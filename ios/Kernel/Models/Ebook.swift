import Foundation
import PDFKit
import Compression
import Vision

/// An EPUB (no DRM) or PDF you own becomes a book: "# Title", then "## " per section. Same EPUB rules as epub.js;
/// a PDF uses its outline for chapters, or ten pages at a time when it has none. A page with no text layer (a scan)
/// is read on this device with Vision. `summarized` swaps each chapter for a summary from /api/summarize.
/// ponytail: plain text only; images and tables are dropped.
enum Ebook {
    struct Failure: Error { let message: String }

    static func markdown(_ url: URL) throws -> (title: String, markdown: String) {
        url.pathExtension.lowercased() == "pdf" ? try pdf(url) : try epub(Data(contentsOf: url))
    }

    // MARK: PDF
    static func pdf(_ url: URL) throws -> (title: String, markdown: String) {
        guard let doc = PDFDocument(url: url), doc.pageCount > 0 else { throw Failure(message: "Could not open that PDF.") }
        let title = (doc.documentAttributes?[PDFDocumentAttribute.titleAttribute] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? url.deletingPathExtension().lastPathComponent
        let text = { (r: Range<Int>) in r.compactMap { doc.page(at: $0).map(pageText) }.joined(separator: "\n\n").replacingOccurrences(of: "[ \\t]+", with: " ", options: .regularExpression) }
        var parts: [(String, Range<Int>)] = []
        let marks = (0..<(doc.outlineRoot?.numberOfChildren ?? 0)).compactMap { doc.outlineRoot?.child(at: $0) }
            .compactMap { o in o.destination?.page.map { (o.label ?? "", doc.index(for: $0)) } }.sorted { $0.1 < $1.1 }
        if marks.count >= 2 {
            for (i, m) in marks.enumerated() { parts.append((m.0, m.1..<(i + 1 < marks.count ? marks[i + 1].1 : doc.pageCount))) }
        } else {
            for s in stride(from: 0, to: doc.pageCount, by: 10) { let e = min(s + 10, doc.pageCount); parts.append(("Pages \(s + 1) to \(e)", s..<e)) }
        }
        var md = "# \(title)\n"
        for (name, r) in parts where !r.isEmpty { let t = text(r).trimmingCharacters(in: .whitespacesAndNewlines); if t.count >= 200 { md += "\n## \(name)\n\n\(t)\n" } }
        guard md.contains("\n## ") else { throw Failure(message: "No readable text in that PDF.") }
        return (title, md)
    }

    /// A page's text layer, or for a scanned page its words read on this device. ponytail: accurate level only.
    static func pageText(_ page: PDFPage) -> String {
        if let s = page.string, s.trimmingCharacters(in: .whitespacesAndNewlines).count > 20 { return s }
        let size = page.bounds(for: .mediaBox).size, scale = 2000 / max(size.width, size.height, 1)
        guard let img = page.thumbnail(of: CGSize(width: size.width * scale, height: size.height * scale), for: .mediaBox).cg else { return "" }
        let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = true
        try? VNImageRequestHandler(cgImage: img).perform([req])
        var out = ""
        for l in (req.results ?? []).compactMap({ $0.topCandidates(1).first?.string }) { out += l + (".?!:".contains(l.last ?? " ") ? "\n\n" : " ") }
        return out
    }

    // MARK: Summaries
    /// Split at paragraph breaks into pieces the server takes (24,000 characters); a longer paragraph is cut hard.
    static func chunks(_ text: String, max: Int = 24000) -> [String] {
        var out = [""]
        for p in text.components(separatedBy: "\n\n") {
            var rest = Substring(p)
            repeat {
                let piece = rest.prefix(max); rest = rest.dropFirst(piece.count)
                if !out[out.count - 1].isEmpty && out[out.count - 1].count + piece.count + 2 > max { out.append("") }
                out[out.count - 1] += (out[out.count - 1].isEmpty ? "" : "\n\n") + piece
            } while !rest.isEmpty
        }
        return out.filter { !$0.isEmpty }
    }

    /// The same "# Title / ## Chapter" Markdown with each chapter's text replaced by its summary. Same as epub.js.
    static func summarized(_ markdown: String, progress: (Int, Int) -> Void) async throws -> String {
        let secs = markdown.components(separatedBy: "\n## ")
        var md = secs[0].trimmingCharacters(in: .whitespacesAndNewlines) + "\n"
        for (i, s) in secs.dropFirst().enumerated() {
            progress(i + 1, secs.count - 1)
            let name = String(s.prefix { $0 != "\n" }), body = String(s.dropFirst(name.count))
            var sums: [String] = []
            for piece in chunks(body.trimmingCharacters(in: .whitespacesAndNewlines)) { sums.append(try await summarize(piece, title: name)) }
            md += "\n## \(name)\n\n\(sums.joined(separator: "\n\n"))\n"
        }
        return md
    }

    static func summarize(_ text: String, title: String) async throws -> String {
        guard let token = await API.token() else { throw API.Failure(message: "Sign in first.") }
        var req = URLRequest(url: URL(string: "https://kernel.jaybulb.com/api/summarize")!)
        req.httpMethod = "POST"; req.timeoutInterval = 120
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "authorization")
        req.httpBody = try JSONEncoder().encode(["text": text, "title": title])
        struct Out: Decodable { let text: String?; let error: String? }
        let (data, _) = try await URLSession.shared.data(for: req)
        let out = try? JSONDecoder().decode(Out.self, from: data)
        guard let t = out?.text, !t.isEmpty else { throw API.Failure(message: out?.error ?? "Could not summarize \(title).") }
        return t
    }

    // MARK: EPUB
    static func epub(_ data: Data) throws -> (title: String, markdown: String) {
        let files = try unzip(data), str = { (n: String) in files[n].flatMap { String(data: $0, encoding: .utf8) } ?? "" }
        guard let opfPath = str("META-INF/container.xml").firstMatch(of: /full-path="([^"]+)"/)?.1, case let opf = str(String(opfPath)), !opf.isEmpty else { throw Failure(message: "That file is not an EPUB.") }
        let dir = opfPath.contains("/") ? String(opfPath[...opfPath.lastIndex(of: "/")!]) : ""
        var items: [String: String] = [:]
        for m in opf.matches(of: /<item\b[^>]*>/) {
            let tag = String(m.0)
            if let id = tag.firstMatch(of: /id="([^"]+)"/)?.1, let href = tag.firstMatch(of: /href="([^"]+)"/)?.1 { items[String(id)] = String(href) }
        }
        let title = text(String(opf.firstMatch(of: /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/)?.1 ?? "Untitled"))
        var md = "# \(title)\n", n = 0
        for m in opf.matches(of: /<itemref\b[^>]*idref="([^"]+)"/) {
            let s = section(str(dir + (items[String(m.1)]?.removingPercentEncoding ?? "")))
            guard s.text.count >= 200 else { continue }   // covers, title pages, copyright
            n += s.title.isEmpty ? 1 : 0
            md += "\n## \(s.title.isEmpty ? "Section \(n)" : s.title)\n\n\(s.text)\n"
        }
        guard md.contains("\n## ") else { throw Failure(message: "No readable text in that EPUB (it may have DRM).") }
        return (title, md)
    }

    static func section(_ xhtml: String) -> (title: String, text: String) {
        let body = xhtml.firstMatch(of: /<body[\s\S]*<\/body>/).map { String($0.0) } ?? xhtml
        let title = text(String(body.firstMatch(of: /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/)?.1 ?? ""))
        let parts = body.matches(of: /<(p|li|h[4-6])[^>]*>([\s\S]*?)<\/(?:p|li|h[4-6])>/).map { m in (m.1.lowercased() == "li" ? "- " : "") + text(String(m.2)) }
            .filter { !$0.replacingOccurrences(of: "- ", with: "").isEmpty }
        return (title, parts.joined(separator: "\n\n"))
    }

    static func text(_ s: String) -> String {
        let plain = s.replacing(/<[^>]+>/, with: "")
            .replacingOccurrences(of: "&nbsp;", with: " ").replacingOccurrences(of: "&quot;", with: "\"").replacingOccurrences(of: "&apos;", with: "'")
            .replacingOccurrences(of: "&lt;", with: "<").replacingOccurrences(of: "&gt;", with: ">").replacingOccurrences(of: "&amp;", with: "&")
        return plain.replacing(/\s+/, with: " ").trimmingCharacters(in: .whitespaces)
    }

    /// The files of a zip by name; stored and deflated entries only, which is all EPUBs use.
    static func unzip(_ d: Data) throws -> [String: Data] {
        let b = [UInt8](d)
        func u16(_ p: Int) -> Int { Int(b[p]) | Int(b[p + 1]) << 8 }
        func u32(_ p: Int) -> Int { u16(p) | u16(p + 2) << 16 }
        var end = b.count - 22
        while end >= 0 && u32(end) != 0x06054b50 { end -= 1 }
        guard end >= 0 else { throw Failure(message: "That file is not an EPUB.") }
        var files: [String: Data] = [:], p = u32(end + 16)
        for _ in 0..<u16(end + 10) {
            let method = u16(p + 10), size = u32(p + 20), full = u32(p + 24), nameLen = u16(p + 28), local = u32(p + 42)
            let name = String(decoding: b[(p + 46)..<(p + 46 + nameLen)], as: UTF8.self)
            let start = local + 30 + u16(local + 26) + u16(local + 28), raw = Array(b[start..<(start + size)])
            if method == 0 { files[name] = Data(raw) }
            else if method == 8 {
                var out = [UInt8](repeating: 0, count: max(full, 1))
                let n = compression_decode_buffer(&out, out.count, raw, raw.count, nil, COMPRESSION_ZLIB)   // Apple's ZLIB is raw deflate
                files[name] = Data(out.prefix(n))
            }
            p += 46 + nameLen + u16(p + 30) + u16(p + 32)
        }
        return files
    }
}

extension DataStore {
    /// A whole new book from Markdown (an imported EPUB or PDF).
    func addBook(title: String, markdown: String) async throws {
        let slug = title.lowercased().replacing(/[^a-z0-9]+/, with: "-").trimmingCharacters(in: CharacterSet(charactersIn: "-"))
        _ = try await API.call("POST", "/rest/bookrank_summaries", json: [
            "slug": slug.isEmpty ? "untitled" : slug, "title": title, "content": markdown, "updated_at": Date().formatted(.iso8601)])
        await loadSummaries()
    }
}

#if os(iOS)
private extension UIImage { var cg: CGImage? { cgImage } }
#else
private extension NSImage { var cg: CGImage? { cgImage(forProposedRect: nil, context: nil, hints: nil) } }
#endif
