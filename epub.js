// An EPUB you own (no DRM) becomes a book: one chapter per section of its reading order.
// Unzipped in the browser with DecompressionStream; nothing is uploaded but the text you save.
// The apps do the same in Ebook.swift. ponytail: plain text only; images and tables are dropped.

/** The files of a zip, by name. Stored and deflated entries only, which is all EPUBs use. */
export async function unzip(buf) {
  const b = new Uint8Array(buf), v = new DataView(b.buffer, b.byteOffset, b.byteLength), files = new Map();
  let end = b.length - 22;
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error('That file is not an EPUB.');
  let p = v.getUint32(end + 16, true);
  for (let n = v.getUint16(end + 10, true); n > 0; n--) {
    const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), note = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true), raw = b.subarray(start, start + size);
    files.set(name, method === 0 ? raw : new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()));
    p += 46 + nameLen + extra + note;
  }
  return files;
}

const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e.toLowerCase()]);
const text = s => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** A section's XHTML as Markdown: its first heading as the chapter title, paragraphs and list items as text. */
export function section(xhtml) {
  const body = (xhtml.match(/<body[\s\S]*<\/body>/i) || [xhtml])[0];
  const title = text((body.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || [])[1] || '');
  const parts = [...body.matchAll(/<(p|li|h[4-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => (m[1].toLowerCase() === 'li' ? '- ' : '') + text(m[2])).filter(t => t.replace('- ', ''));
  return { title, text: parts.join('\n\n') };
}

/** { title, markdown } for a whole EPUB: "# Title", then "## " per section in reading order. */
export async function epubToMarkdown(buf) {
  const files = await unzip(buf), str = n => files.has(n) ? new TextDecoder().decode(files.get(n)) : '';
  const opfPath = (str('META-INF/container.xml').match(/full-path="([^"]+)"/) || [])[1];
  const opf = str(opfPath || '');
  if (!opf) throw new Error('That file is not an EPUB.');
  const dir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const items = Object.fromEntries([...opf.matchAll(/<item\b[^>]*>/g)].map(m => [(m[0].match(/id="([^"]+)"/) || [])[1], (m[0].match(/href="([^"]+)"/) || [])[1]]));
  const title = text((opf.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/) || [])[1] || 'Untitled');
  let md = `# ${title}\n`, n = 0;
  for (const [, idref] of opf.matchAll(/<itemref\b[^>]*idref="([^"]+)"/g)) {
    const s = section(str(dir + decodeURIComponent(items[idref] || '')));
    if (s.text.length < 200) continue;   // covers, title pages, copyright
    md += `\n## ${s.title || `Section ${++n}`}\n\n${s.text}\n`;
  }
  return { title, markdown: md };
}

// ---- PDFs and summaries ----
// pdf.js loads only when someone picks a PDF. ponytail: text PDFs only; scanned pages need the apps' on-device OCR.
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/';

/** { title, markdown } for a PDF: a "## " per top-level outline entry, or ten pages at a time with no outline. Same as Ebook.swift. */
export async function pdfToMarkdown(buf, name = 'Untitled') {
  const lib = await import(PDFJS + 'pdf.min.mjs');
  lib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
  const doc = await lib.getDocument({ data: buf }).promise, pages = doc.numPages;
  const title = (await doc.getMetadata().catch(() => null))?.info?.Title?.trim() || name.replace(/\.pdf$/i, '');
  const marks = [];
  for (const o of (await doc.getOutline()) || []) {
    try { const d = typeof o.dest === 'string' ? await doc.getDestination(o.dest) : o.dest; marks.push([o.title, await doc.getPageIndex(d[0])]); } catch {}
  }
  marks.sort((a, b) => a[1] - b[1]);
  const parts = marks.length >= 2 ? marks.map(([t, s], i) => [t, s, i + 1 < marks.length ? marks[i + 1][1] : pages])
    : Array.from({ length: Math.ceil(pages / 10) }, (_, i) => [`Pages ${i * 10 + 1} to ${Math.min(i * 10 + 10, pages)}`, i * 10, Math.min(i * 10 + 10, pages)]);
  let md = `# ${title}\n`;
  for (const [t, s, e] of parts) {
    const txt = [];
    for (let p = s; p < e; p++) txt.push((await (await doc.getPage(p + 1)).getTextContent()).items.map(i => i.str + (i.hasEOL ? '\n' : '')).join(''));
    const body = txt.join('\n\n').replace(/[ \t]+/g, ' ').trim();
    if (body.length >= 200) md += `\n## ${t}\n\n${body}\n`;
  }
  return { title, markdown: md };
}

/** Split text at paragraph breaks into pieces of at most `max` characters (a longer paragraph is cut hard). */
export function chunks(text, max = 24000) {
  const out = [''];
  for (const p of text.split(/\n\s*\n/)) {
    for (let i = 0; i < p.length || i === 0; i += max) {
      const piece = p.slice(i, i + max);
      if (out.at(-1).length + piece.length + 2 > max && out.at(-1)) out.push('');
      out[out.length - 1] += (out.at(-1) ? '\n\n' : '') + piece;
    }
  }
  return out.filter(Boolean);
}

/** The same "# Title / ## Chapter" Markdown with each chapter replaced by a summary from /api/summarize. */
export async function summarizeMarkdown(markdown, token, progress = () => {}) {
  const [head, ...secs] = markdown.split(/^## /m);
  let md = head;
  for (const [i, s] of secs.entries()) {
    const nl = s.indexOf('\n'), name = s.slice(0, nl).trim(), body = s.slice(nl + 1);
    progress(i + 1, secs.length, name);
    const sums = [];
    for (const piece of chunks(body)) {
      const r = await fetch('/api/summarize', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ text: piece, title: name }) });
      const out = await r.json().catch(() => ({}));
      if (!out.text) throw new Error(out.error || `Could not summarize ${name}.`);
      sums.push(out.text);
    }
    md += `## ${name}\n\n${sums.join('\n\n')}\n\n`;
  }
  return md.trimEnd() + '\n';
}
