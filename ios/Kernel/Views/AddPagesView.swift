import SwiftUI
import UniformTypeIdentifiers

/// Add a book: import a PDF or EPUB you own (summarized chapter by chapter through /api/summarize, or kept word for
/// word), Kindle or Readwise highlights, or type a chapter into a book by hand. Photos of pages are gone (2026-11-15).
struct AddPagesView: View {
    var store: DataStore
    @Environment(\.dismiss) private var dismiss
    @State private var book = ""            // slug of an existing book, "" for a new one
    @State private var newTitle = ""
    /// `title`: a Goodreads book's title, when Summarize this book opened the sheet.
    init(store: DataStore, title: String = "") { self.store = store; _newTitle = State(initialValue: title) }
    @State private var chapter = ""
    @State private var text = ""
    @State private var error: String?
    @State private var saving = false
    @State private var kindle = false
    @AppStorage("kernel.importSummarize") private var summarize = true
    @State private var ebook = false
    @State private var importing: String?
    @State private var kindleDone: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("Summarize each chapter", isOn: $summarize)
                    Button { ebook = true } label: { Label(importing ?? "Import a PDF or EPUB you own", systemImage: "doc.richtext") }.disabled(importing != nil)
                        .fileImporter(isPresented: $ebook, allowedContentTypes: [.pdf, .epub]) { r in   // its own view: two importers on one view clash
                            guard case .success(let url) = r else { return }
                            Task { await importBook(url) }
                        }
                    Button { kindle = true } label: { Label(importing ?? "Import Kindle or Readwise highlights", systemImage: "book.pages") }.disabled(importing != nil)
                } footer: {
                    kindleDone.map(Text.init(verbatim:)) ?? Text(summarize ? "A PDF or EPUB without DRM becomes a book, each chapter summarized. Only the summaries are kept. For highlights, choose My Clippings.txt or a Readwise CSV export." : "A PDF or EPUB without DRM becomes a book, a chapter per section, word for word. For highlights, choose My Clippings.txt or a Readwise CSV export.")
                }
                Section {
                    Picker("Book", selection: $book) {
                        Text("New book").tag("")
                        ForEach(store.summaryIndex) { Text($0.title).tag($0.slug) }
                    }
                    if book.isEmpty { TextField("Book title", text: $newTitle) }
                    TextField("Chapter title", text: $chapter)
                    TextEditor(text: $text).frame(minHeight: 200).font(.kernel(.body))
                        .overlay(alignment: .topLeading) {
                            if text.isEmpty { Text("Type or paste a chapter here.").foregroundStyle(.tertiary).padding(.top, 8).padding(.leading, 5).allowsHitTesting(false) }
                        }
                } footer: {
                    if let error { Text(error).foregroundStyle(.red) }
                }
            }
            .fileImporter(isPresented: $kindle, allowedContentTypes: [.plainText, .text, .commaSeparatedText]) { r in
                guard case .success(let url) = r else { return }
                let ok = url.startAccessingSecurityScopedResource(); defer { if ok { url.stopAccessingSecurityScopedResource() } }
                guard let text = try? String(contentsOf: url, encoding: .utf8) else { kindleDone = "Could not read that file."; return }
                let rw = Kindle.parseReadwise(text), books = rw ?? Kindle.parse(text)
                Task { importing = "Adding \(books.count) books…"; kindleDone = await store.importKindle(books, heading: rw == nil ? "Kindle highlights" : "Readwise highlights"); importing = nil }
            }
            .formStyle(.grouped)
            .navigationTitle("Add a book")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(saving || chapter.isEmpty || text.isEmpty || (book.isEmpty && newTitle.isEmpty))
                }
            }
        }
    }

    private func importBook(_ url: URL) async {
        importing = "Reading \(url.lastPathComponent)…"; kindleDone = nil
        defer { importing = nil }
        do {
            let ok = url.startAccessingSecurityScopedResource(); defer { if ok { url.stopAccessingSecurityScopedResource() } }
            var b = try Ebook.markdown(url)
            if summarize { b.markdown = try await Ebook.summarized(b.markdown) { i, n in importing = "Summarizing \(i) of \(n)…" } }
            importing = "Adding \(b.title)…"
            try await store.addBook(title: b.title, markdown: b.markdown)
            kindleDone = "Added \(b.title)."
        } catch {
            kindleDone = (error as? Ebook.Failure)?.message ?? (error as? API.Failure)?.message ?? "Could not add that book."
        }
    }

    private func save() async {
        saving = true; defer { saving = false }
        do {
            try await store.addChapter(to: book.isEmpty ? nil : book, title: newTitle, chapter: chapter, text: text)
            dismiss()
        } catch { self.error = (error as? API.Failure)?.message ?? "Could not save." }
    }
}

extension DataStore {
    /// Append a chapter to a book (at the book's own chapter heading level) or start a new book with it.
    func addChapter(to slug: String?, title: String, chapter: String, text: String) async throws {
        let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if let slug, let e = summary(for: slug), let id = e.rowID {
            let lines = e.content.components(separatedBy: "\n")
            let mark = lines.filter { $0.hasPrefix("# ") }.count >= 2 ? "#" : "##"
            let content = e.content.trimmingCharacters(in: .whitespacesAndNewlines) + "\n\n\(mark) \(chapter)\n\n\(body)\n"
            // A content edit: updated_at moves on purpose, so the narrator scripts rebuild (highlights stay).
            _ = try await API.call("PATCH", "/rest/bookrank_summaries?id=eq.\(id)", json: ["content": content])
        } else {
            guard slug == nil else { throw API.Failure(message: "That book cannot take new chapters here. Add them on the web.") }
            let slug = title.lowercased().replacing(/[^a-z0-9]+/, with: "-").trimmingCharacters(in: CharacterSet(charactersIn: "-"))
            _ = try await API.call("POST", "/rest/bookrank_summaries", json: [
                "slug": slug.isEmpty ? "untitled" : slug, "title": title, "content": "## \(chapter)\n\n\(body)\n",
                "updated_at": Date().formatted(.iso8601)])
        }
        if let slug, Speaker.shared.slug == slug { Speaker.shared.unload() }   // so the book page picks up the new chapter
        await loadSummaries()
    }
}
