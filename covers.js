// Book covers and share links, split out of listen.js to keep it readable.

// Thumbnails: exact title match first, then either title starting with the other
// ("Adult Autism" vs "Adult Autism Essentials"), then a contains match.
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function matchCover(title, books) {
  const t = norm(title); if (!t) return null;
  const withCover = books.filter(b => b.cover);
  const pick = f => withCover.find(b => f(norm(b.title)))?.cover || null;
  return pick(n => n === t) || pick(n => n.startsWith(t) || t.startsWith(n)) || pick(n => n.includes(t) || t.includes(n));
}

// Candidate cover URLs from one Open Library search doc: the work cover, then each ISBN
// and edition, which often carry a cover the work does not. `default=false` makes a miss a
// 404 the browser can detect instead of a placeholder image.
export function coverCandidates(doc) {
  if (!doc) return [];
  const out = [];
  if (doc.cover_i) out.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`);
  for (const i of (doc.isbn || []).slice(0, 4)) out.push(`https://covers.openlibrary.org/b/isbn/${i}-M.jpg?default=false`);
  for (const k of (doc.edition_key || []).slice(0, 3)) out.push(`https://covers.openlibrary.org/b/olid/${k}-M.jpg?default=false`);
  return out;
}

// A drawn cover for a book no lookup found: a hue from the title, its initials on top. Never
// saved to the row, so a later real cover still wins. ponytail: initials only, add the title text if it feels bare.
export function fallbackCover(title) {
  const t = String(title || '');
  let h = 0; for (const c of t) h = (h * 31 + c.codePointAt(0)) % 360;
  const ini = (norm(t).split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 130"><rect width="90" height="130" fill="hsl(${h} 45% 38%)"/><rect x="6" width="2" height="130" fill="#fff" opacity=".25"/><text x="50" y="76" font-family="Georgia,serif" font-size="34" fill="#fff" text-anchor="middle">${ini}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Public share URL for a token.
export const shareUrl = (origin, token) => `${origin}/share.html?t=${token}`;
