# Kernel loop handoff (2026-11-23, midday)

## What the loop is

The loop works on the library, not on new features. Its job is to make sure every book Joshua owns has a complete, correct summary in his Kernel account, and to patch the ones that are not. A summary is incomplete when a chapter is missing, a chapter is a placeholder (under about 100 words of "part of a comprehensive guide"), a book is duplicated, or a cover is missing.

Sources are PDFs Joshua puts in iCloud Books. The summarize-books skill is PDF-first. Page photos are read with Apple's on-device text reader, which is fast enough to use when no PDF exists. Summaries are written in my own words. Imports go through scripts/import-summaries.py. Never ship a placeholder, and never import a summary that got shorter than the one it replaces: sync-summaries.sh copies iCloud over the repo and does not merge, so after any sync check the chapter counts.

If the loop changes the app, a feature is a minor and a fix is a patch, and a major is Joshua's call. Never pick a version number yourself. Commit by exact path. QA with headless simulators; never press Listen in a simulator; no GUI launches on Joshua's screen without asking. Use ASC_BYPASS_KEYCHAIN=1 for asc. Replies under two lines, plain English.

The Kernel account's database went missing sometime after 2026-11-10 and was restored on 2026-11-16 by rewinding it briefly and copying the account and books back. The cause is still unknown. Do not rewind the database again without Joshua's yes.

## Where things stand

- The loop is STOPPED. Nothing runs on its own.
- Book batch on 2026-11-23: Hackers and Painters is whole (chapters 7 to 15 plus notes). Video Game Design For Dummies has chapters 13 and 14; 10 to 12 were never photographed. Claude AI For Dummies has chapters 4 to 16. Einstein and Relativity (Paul Strathern, The Big Idea series) is a new book. All page photos are deleted from iCloud Books, which is tidied to one summary per book.
- Repo: the CLAUDE.md semver rule is in (major stays at 20, features minor, fixes patch). Loose root files moved into docs/, .github/, test/ and scripts/. 56 tests pass.
- About 6 GB came back from app caches; 17 GB is free.
- Repo at 20.1.0: tagged, GitHub release out, web deployed at kernel.jaybulb.com. The App Store build for 20.1.0 is not submitted. Submission is Joshua's call.
- Claude AI For Dummies still has no cover.
- Books still needing PDFs: Agentic AI For Dummies 1 to 11, Apple 1 to 12, Becoming Steve Jobs 1 to 10, ChatGPT For Dummies 4 on, Claude AI For Dummies past 16 (unchecked), Data Science For Dummies 1 to 19, Exercise Science 1 to 2, Hackers and Painters 1, Video Game Design For Dummies 10 to 12, plus Cracking the AP Computer Science, Raw and The Man Who Solved the Market.
- Simulator QA on the real account is blocked: an unsigned simulator build cannot write the keychain. Build it signed and launch with SIMCTL_CHILD_KERNEL_QA_REFRESH set.
- Joshua's checks that stay with him: the Shortcuts actions, Handoff, Spotlight, the signed-in Mac walk, Listen on a real phone with the screen locked, Goodreads in iOS dark mode, two devices merging highlights.

## Next, in order

1. README screenshots. The iOS 27.2 simulator runtime is installed but no devices exist. The fastlane Snapfile names "iPhone 17 Pro Max" and "iPad Pro 13" need creating with simctl first.
2. Find chapters 10 to 12 of Video Game Design For Dummies. Patch from the PDF if one exists; otherwise they stay open for Joshua.
3. Give Claude AI For Dummies a cover.
4. As Joshua adds PDFs, patch the rest of the list above, one book per pass, checking each chapter count against the PDF's table of contents.
5. Delete the old Accounting duplicate once the longer copy is confirmed to cover it.
6. Stop when every book on the list is complete. Submitting 20.1.0 to the App Store waits for Joshua's word.

## Restart prompt

```
/loop until the README screenshots are done and every book on the list in docs/LOOP-HANDOFF.md is complete, in ~/Documents/Code/kernel. Read docs/LOOP-HANDOFF.md first, then docs/summary-gaps.md. Do the screenshots first (create the fastlane simulator names with simctl), then find Video Game Design chapters 10 to 12 and patch from any PDF in iCloud Books. Patch books one at a time, checking each chapter count against the PDF. Use the summarize-books skill (PDF first). Never press Listen in a simulator, never rewind the database without Joshua's yes, and never submit 20.1.0 without his word. Replies under two lines, plain English.
```
