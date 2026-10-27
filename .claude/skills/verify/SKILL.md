---
name: verify
description: Build, run, and drive the Clipper app in a real browser to observe a change working. Use when verifying booking, appointment, or UI changes at their runtime surface.
---

# Verifying Clipper

The surface is a browser. Drive it with Playwright; there is no test suite.

## Bring it up

```bash
npm run db:migrate:local && npm run db:seed:local   # seed wipes all rows first
nohup npm run dev > /tmp/dev.log 2>&1 &             # vinext dev on http://localhost:3000
```

`npm run dev` prints the ready line to the log, not the terminal. Wait for
`➜  Local: http://localhost:3000/`.

## Drive it

No Playwright in `node_modules`, but the browsers are cached. Install
`playwright-core` in a scratch dir and point it at the cached binary:

```js
const EXE = process.env.HOME +
  "/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/" +
  "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
await chromium.launch({ executablePath: EXE, headless: true });
```

Pass `caret: "initial"` to `page.screenshot()`. Playwright's default
`caret: "hide"` injects `style="caret-color: transparent"` on inputs and
React then logs a hydration mismatch that is an artifact, not a bug.

## Flows worth driving

- **Book a visit** — `http://localhost:3000/#book-prism` (the section id is
  `book-prism`, from `BOOKING_SECTION_ID`, not `book`). Fill by accessible
  name: `Pet name`, `Breed` (select), the package `<button>` by its name,
  `Street address`, `Neighborhood` (select), `Apartment, floor, or gate code`,
  then a time button, then `Confirm visit →`. Success navigates to
  `/appointments/CLP-XXXXXXXXXX`.
- **Arrival times only appear after a neighborhood is picked** — before that
  the panel reads "Choose a neighborhood to see the arrival times we can cover."
- **See it** — `/appointments` lists every visit; clicking a card opens the
  detail page. `/appointments/<unknown-ref>` renders the not-found page.
- **API directly** — `POST /api/bookings`, `GET /api/booking-options`.

## Gotchas

- **Slots are generated with a 60-minute floor** (`SHORTEST_VISIT_MINUTES` in
  `lib/clipper/data.ts`), but `findAvailableGroomer` checks the *selected
  package's* duration. The last offered slot of a shift therefore 409s for
  90- and 120-minute packages. Pick a mid-shift time for a happy path.
- Seed groomer shifts are Seoul wall-clock: Ava (Hannam/Itaewon/Yeonnam)
  Mon–Wed+Fri 09:00–17:00, Thu 11:00–19:00. Itaewon has only Ava.
- Booking writes to local D1 in `.wrangler/`. Re-run `npm run db:seed:local`
  to clear test bookings.
