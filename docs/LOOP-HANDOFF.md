# Kernel loop handoff (2026-11-16, after midnight)

## What the loop is

The loop works on the library, not on new features. Its job is to make sure every book Joshua owns has a complete, correct summary in his Kernel account, and to patch the ones that are not. A summary is incomplete when a chapter is missing, a chapter is a placeholder (under about 100 words of "part of a comprehensive guide"), a book is duplicated, or a cover is missing.

Sources are PDFs Joshua puts in iCloud Books. The summarize-books skill is PDF-first and reads page photos only when no PDF exists. Summaries are written in my own words. Imports go through scripts/import-summaries.py. Never ship a placeholder, and never import a summary that got shorter than the one it replaces: sync-summaries.sh copies iCloud over the repo and does not merge, so after any sync run `git diff --stat` and treat a smaller summary as a bug.

If the loop changes the app, a feature is a minor and a fix is a patch, and a major is Joshua's call. Never pick a version number yourself. Commit by exact path. QA with headless simulators; never press Listen in a simulator; no GUI launches on Joshua's screen without asking. Use ASC_BYPASS_KEYCHAIN=1 for asc. Replies under two lines, plain English.

The Kernel account's database went missing sometime after 2026-11-10 and was restored on 2026-11-16 by rewinding it briefly and copying the account and books back. The cause is still unknown. Do not rewind the database again without Joshua's yes.

## Where things stand

- Repo at 20.1.0: tagged, GitHub release out, web deployed at kernel.jaybulb.com. Add a book imports a PDF or EPUB and summarizes each chapter; page photos and the document camera are gone; scanned PDFs are read on device in the apps; signing in lands on the summaries.
- The App Store build for 20.1.0 is not submitted. Submission is Joshua's call.
- The library is back with 34 books plus an old Accounting duplicate. Graph Algorithms has its real cover from its PDF. Claude AI For Dummies has no cover.
- Recovered from an old Mac app cache: 6 books. Summarized from PDFs on 2026-11-16: Graph Algorithms the Fun Way, TI-89 For Dummies, Writing a C Compiler.
- The 109 leftover page photos are deleted.
- Books still needing PDFs before they can be completed: Agentic AI For Dummies 1 to 11, Apple 1 to 12, Becoming Steve Jobs 1 to 10, ChatGPT For Dummies 4 on, Claude AI For Dummies 4 on, Data Science For Dummies 1 to 19, Exercise Science 1 to 2, Hackers and Painters 1 and 7 to 15, Video Game Design For Dummies 10 on, plus Cracking the AP Computer Science, Raw and The Man Who Solved the Market.
- Joshua's checks that stay with him: Scan pages is gone, so drop it; the Shortcuts actions, Handoff, Spotlight, the signed-in Mac walk, Listen on a real phone with the screen locked, Goodreads in iOS dark mode, two devices merging highlights.
- Simulator QA on the real account is blocked: an unsigned simulator build cannot write the keychain. Build it signed and launch with SIMCTL_CHILD_KERNEL_QA_REFRESH set.

## Next, in order

1. Audit every book in the account for the issues above (missing chapters, placeholder chapters, duplicates, missing covers). Write the list into docs/summary-gaps.md, replacing the 2026-11-02 audit, and show Joshua the list in chat.
2. Patch the books whose PDFs are already in iCloud Books. One book at a time: summarize from the PDF, import, and check the chapter count against the PDF's table of contents before moving on.
3. As Joshua adds PDFs, patch the rest of the list in the order it gives, one book per pass.
4. Delete the old Accounting duplicate once the longer copy is confirmed to cover it.
5. Give Claude AI For Dummies a cover.
6. Stop when every book on the list is complete. Submitting 20.1.0 to the App Store waits for Joshua's word.

## Restart prompt

```
/loop until all summaries are recovered and every incomplete book is patched, in ~/Documents/Code/kernel. Read docs/LOOP-HANDOFF.md and docs/summary-gaps.md first. Audit the library and list the issues before patching anything, then patch the books whose PDFs are in iCloud Books, one at a time, checking each chapter count against the PDF. Use the summarize-books skill (PDF first, photos only when no PDF exists). Never ship a placeholder and never import a summary smaller than the one it replaces. Do not touch the database rewind, the App Store submission or any version number without Joshua. Commit by exact path. Replies under two lines, plain English.
```
