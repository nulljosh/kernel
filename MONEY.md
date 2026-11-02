# Kernel Money

How Kernel makes money. The company plan is `REVENUE.md` in the Code root; the ledger is `GTM.md`.

## Price and rail

$0.99 upfront on iPhone, iPad and Mac (ASC 6792376485), with no in-app purchase since 2026-10-02. Apple keeps 15%, so each sale pays about $0.84. The web is free to read. The natural voices on the web are meant to be a one-time $1 Stripe payment. The Stripe gate for web voices stays off until `STRIPE_PAYMENT_LINK` is set, and GTM.md lists the web as free. Joshua has to confirm which one is live before the next release.

## What is actually sold

The natural voices, not the summaries. The summaries are of books other people wrote, and the authors and publishers own those words. The voice costs money every time it reads a new line, so the voice is what we charge for. The risk is the books. A paid voice reading someone else's book is closer to their copyright than the free summary alone.

## Who pays and why

A reader who would rather hear a chapter summary in a natural voice than in the device voice. They pay once, because every new line of natural voice costs money to make.

## Cost to serve

ElevenLabs reads through `/api/speak`. The caps in the code: a monthly character budget for the whole app (default 50,000) and a daily budget per account (default 8,000), sized for the $5 ElevenLabs plan. Past those, the line goes to Cloudflare Aura-2 with its own caps (default 2,000,000 characters a month and 60,000 a day). Past those, the device voice. Every line is stored once, so a repeat costs nothing. `/api/ask` runs on Workers AI with its own caps (defaults 150,000 characters a day and 5,000,000 a month). The worst case is those caps. Lower `ASK_MONTHLY_CHARS` if the Ask bill matters.

## Where we are

- 2026-10-02: $0.99 upfront, no in-app purchase.
- 2026-10-28: renamed from Bookrank to Kernel. kernel.jaybulb.com is live (2026-10-29).
- Revenue: no verified number (the App Store Connect key cannot read sales yet).

## Role in the company plan

Hero candidate. GTM.md names Kernel as one of the three hero apps. It serves Stage 0 with one clear purchase, the natural voices, which is easy to explain to a stranger. Stage 1 needs it on the store charts in its category.

## Next

Give the App Store Connect key the Sales role, then check the ElevenLabs spend against the App Store sales. The voice budget only holds if the caps hold.

## Million, billion, trillion

**A million.** Kernel is the book summary app people listen to on a walk, with the natural voice as the one thing they pay for.

**A billion.** Kernel is the default way to take in a book on every Jaybulb device, with the authors still paid through their own sales.

**A trillion.** Kernel would need licensed summaries and licensed voices from every publisher, which makes it a rights business, a different company.

## Change it

`asc pricing schedule create --app 6792376485 --price 0.99 --base-territory USA --start-date YYYY-MM-DD`. Swap `--price 0.99` for `--free` to revert. No build, no review. Web voices: the `STRIPE_PAYMENT_LINK` secret on the Pages project. Only with Joshua's yes in chat.

Anyone who got Kernel while it was free keeps it free.

*ASC 6792376485. Verified 2026-11-02.*
