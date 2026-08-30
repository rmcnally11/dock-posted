# Dock Posted

Public marina fuel-price map for **two corridors only**:

1. Galveston Bay / Clear Lake / Kemah / Seabrook, Texas
2. Key Largo / Upper Keys

This is a consumer tool. It does **not** sell, broker, bid, or source gallons. No accounts. No marina POS.

Waterway Guide’s own Gulf reports still say they update weekly and you should call ahead. Dock Posted shows the last public snapshot or a boater report, flags anything older than 7 days or still marked Call, and lets the next boat post what they actually saw.

## Run locally

Needs Node 20+.

```bash
npm install
npm run seed          # copies data/docks.seed.json into the runtime store
npm run dev           # http://127.0.0.1:43123
```

`npm run dev` also auto-seeds the runtime store on first read if it is missing, so a fresh clone still shows the map.

Then:

- `/` — map + list
- `/report` — report a price (honeypot + 8 reports/hour/IP)
- `/safe-fuel` — E15 / E10 / E0 explainer

## Seed data

`data/docks.seed.json` is 18 real docks. Prices are only what a public page posted. If the page said Call, No Report, or Never, the card says that.

How we captured it (30 Aug 2026) is in `data/SOURCE-NOTES.md`.

```bash
npm run seed          # reset runtime docks + wipe user reports
```

Runtime files live in `data/runtime/` locally, or `$DATA_DIR`, or `/tmp/dock-posted` on Vercel. Serverless filesystems are ephemeral — reports persist for local demo and for the life of a given serverless instance, not as a hosted database.

## Waterway Guide fetcher

Public report pages only. No login, no paywall bypass.

```bash
npm run fetch:wg
```

or `GET /api/fetch-wg`.

Those pages are often behind a Cloudflare challenge. The fetcher treats that as a **failed scrape** and leaves the seed / manual reports alone. It will not invent a successful update.

Parser coverage is in `data/fixtures/wg-sample.html`:

```bash
npm run test:parser
```

## Environment

| Variable   | Required | Default                         | Purpose                                      |
| ---------- | -------- | ------------------------------- | -------------------------------------------- |
| `DATA_DIR` | no       | `data/runtime` or `/tmp/...`    | Where docks.json + reports.json are written  |
| `VERCEL`   | set by Vercel | —                          | Switches storage to `/tmp/dock-posted`       |

No API keys. The map uses OpenFreeMap + OpenStreetMap. No Google key.

## Stack

Next.js App Router, TypeScript, Tailwind, MapLibre. JSON file store. Optional Airtable later — not required to demo.

## Deploy on Vercel

Import the repo. Build command `npm run build`, no env secrets required. Seed data ships in-repo. User reports on Vercel will not survive cold starts until a database is added.

## What this is not

A fuel desk, Dockwa clone, national map, SMS product, payment flow, or wholesale/RIN book.
