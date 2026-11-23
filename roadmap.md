## Next: open feature rows, then Joshua's checks
Semver is honest from here: a feature is a minor, a fix is a patch, and a major only on Joshua's call. Each major ships with a Mobbin pass and an opus-ad film. The repo is at 20.0.0 (GitHub Latest). The iPhone and Mac builds for 19.0.0 are waiting for App Review.

| Minor | What | Status |
|---|---|---|
| docs | Refresh the README screenshots (no version: nothing in the app changed) | built 2026-10-30, light and dark, iPhone |
| 18.2.0 | Android, desktop and terminal readers open shared links through jaybulb-api | built |
| 18.2.1 | Web player shows merged highlights right away (a fix) | built |
| 18.2.2 | Mac Account sheet filled in screenshot mode (a fix) | built |
| 19.0.0 | Major (Joshua's call, 2026-10-30): Mobbin pass below, launch film (ad/kernel-19.json) | built |

## 19.x: gaps from the 19.0 Mobbin pass (2026-10-30)
All rows done. Detail moved to `docs/roadmap-19.md`.
20.0.0 detail moved to `docs/roadmap-20.md`.

## Rows built (2026-10-28 to 10-30)
Moved to docs/roadmap-rows-built.md (rows 3 to 99, all built; 67 and 93 still wait on the store and Workers AI).
## Open outside the table
- [ ] Icon and font A+: check the icon at 16 to 32 px, and whether the seed belongs on the other dots (blocked: Joshua's eye, 2026-11-01; 16 to 32 px checked clean).
- [ ] (11-01: narration cached in KV) Workers AI ran out of its 10,000 free daily neurons on 2026-10-28 (narration scripts, Ask, page photos and the Aura-2 fallback fail until 00:00 UTC). Workers Paid is $5 a month (Joshua's call). Then tune the meaning floor (0.6) on real bge scores.
- [ ] (blocked: App Review, 20.0.1 iOS waiting and Mac in review 2026-11-01) French listing: Apple refused "Kernel" in fr-FR (taken). Use Noyau; the app info is locked while 19.0.0 is in review, so add it on the next version (`asc apps rename --locale fr-FR --name Noyau`).
- [ ] Joshua's checks: Kernel's actions in the Shortcuts app (v35), Handoff between iPhone and Mac (v37), Spotlight results (v40), the signed-in Mac walk, Listen on a real phone with the screen locked, Goodreads in iOS dark mode, two devices merging highlights.
- [ ] Summaries still to finish from PDFs (no more page photos): Agentic AI 1 to 11, Apple 1 to 12, Becoming Steve Jobs 1 to 10, ChatGPT 4 on, Claude AI 4 on, Data Science For Dummies 1 to 19, Exercise 1 to 2, Hackers and Painters 1 and 7 to 15, Video Game Design 10 on, plus Cracking AP Computer Science, Raw and The Man Who Solved the Market. Claude AI For Dummies still has no cover.

## Hazard
`scripts/sync-summaries.sh` copies iCloud over the repo, it does not merge. On 2026-08-17 it replaced a full The Optimist with a shorter iCloud copy, and git was the only place four chapters still lived. After every sync run `git diff --stat` and treat a summary that got smaller as a bug, never a change to commit.

History is in [docs/CHANGELOG.md](docs/CHANGELOG.md) and git. How to ship is in [docs/SHIPPING.md](docs/SHIPPING.md).

## Ingested 2026-10-30
- [ ] Raw files for books? (Joshua's note, as written. Question: keep the original photos/scans of each book alongside the summaries, or export raw text?)

## Ingested 2026-10-31
- [ ] Reference: ElevenReader, read books aloud https://apps.apple.com/ca/app/elevenreader-read-books-aloud/id6479373050 (note was the title Kernel plus this link only). Clarify: copy a feature or just a competitor to watch?

## Ingested 2026-11-06

## Ingested 2026-11-14
- [ ] (Note "Kernel") Taking photos of every page is super impractical. PDF and EPUB import already ship (row 32). Still open from the note: Google Drive import for existing PDFs, Kindle / Readwise highlights import, camera scanning as backup only. Must work without API keys.
- [ ] (Note "Kernel") A skill that finds EPUBs or PDFs for the books already summarized, plus any list we give it, and also takes a link or file directly. Extends `summarize-books`? Question: only legally free sources (Gutenberg, Standard Ebooks, Internet Archive), or files Joshua owns?
- [ ] (Note "Kernel") Copy the UI and UX of this book tracking app: "Book Tracker" home with colored count tiles (All, Library, Wishlist, Not Owned, Statistics, Quotes), a pages-read / minutes-listened chart, reading statuses list (Unread, To read, Reading, Read, Not finished), floating + button. Screenshot: ~/Documents/Code/notes/attachments/2026-11-14/kernel-1.png

## Ingested 2026-11-18
- [ ] We got the ChatGPT for Dummies PDF.
- [ ] Summarize-books skill should delete the HEIC scans of a book once we have a PDF.
- [ ] Find PDFs for missing books and patch missing cover thumbnails (Claude AI for Dummies has no cover, notes/attachments/2026-11-18/22283-1.png).
- [ ] Needs Zero to One (Peter Thiel). We bought it on Apple Books.
- [ ] (Note "Kernel") Needs registration or login onboarding. Model: ElevenReader's first screen, fanned book covers, "Listen to anything" line, then Continue with Apple / Google / email capsules. Screenshot: notes/attachments/2026-11-18/22414-1.png. (Answers the row 135 ElevenReader question: copy its features.)
- [ ] (Note "Kernel") "This is what Kernel should be. Also it has a better animated App Store banner." Reference is ElevenReader's icon, a black sunburst glyph on white with depth: notes/attachments/2026-11-18/22418-1.png. Q: icon redo, App Store banner animation, or both?
- [ ] (Note "Kernel") Add a payment subscription like ElevenReader's paywall: hero art, rating plus user count, "without limits" headline, 4 checkmark benefits, Annual (3 days free, then $129, "Best value, save $51", $10.75/mo) vs Monthly $15/mo, "Try for $0.00" button, "We'll notify you before it ends. Cancel anytime." Needs IAP, not Stripe. Screenshot: notes/attachments/2026-11-18/22441-1.png

## Ingested 2026-11-23

- [ ] **Kernel**: Mark as finished should remove the nook from currently reading
  - Obviously
  - It’s broken right now.
- [ ] **Kernel**: Kernel
  - Bottom audio bar overwrites or covers bottom nav.
  - Screenshots (not yet read): `notes/attachments/2026-11-23/22851-1.png`
- [ ] **Kernel**: Claude for dummies
  - Done the book
- [ ] **Kernel**: Eleven labs forever
  - What’s the subscription plans?
  - Don’t fall back anymore
- [ ] **Kernel**: inspo
  - Screenshots (not yet read): `notes/attachments/2026-11-23/22905-1.png`
