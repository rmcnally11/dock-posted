# Dock Posted

Public marina **posted pump** chart. Sabine to Key West, then the rest of the US saltwater recreational coast.

The last number they wrote on the board. If they did not post, it stays Call.

This is a consumer board. It does **not** sell, broker, bid, or source gallons. No accounts. No marina POS. No rack, OPIS, Argus, Platts, delivered, RINs, invoices, throughput, or savings pitch.

Clear Lake opens on the mouth: **Marina Bay Harbor**, **Blue Marlin Fuel Dock** (Seabrook, west of 146), then **South Shore Harbour Fuel Pier**. Galveston Island is not the stretch poster. No Kemah Boardwalk weekend routing. Lakewood and Houston Yacht Club are club-only. No fuel at Watergate, Waterford, Legend Point, or Portofino.

Key Largo is Key Largo — Marina Del Mar and Ocean Reef (members only), not just Pilot House. Islamorada is a different run. Dock E0 is not the landside E10 hose. A 2022 Call stays Call.

Blank stays Call. We never fill a blank from last month, a neighbor, or an average.

## Run locally

Needs Node 20+.

```bash
npm install
npm run seed          # clears reports / overlays; seed is already in-repo
npm run dev           # http://127.0.0.1:43123
```

Then:

- `/` — chart + list
- `/haul-out` — leftover haul-out seats (Clear Lake / Kemah / Upper Keys). Blank = Call
- `/haul-out/plan/[id]` — Named Storm Plan one-pager
- `/report` — post a price (honeypot + 8 reports/hour/IP)
- `/safe-fuel` — E15 / E10 / E0 at the pump

## Seed data

`data/docks.seed.json` is a coastal set of real docks: marina name, city, state, lat/lng, phone and website when public. Posted dollars exist only where a public page showed them. Everything else is Call.

How we captured it (30 Aug 2026) is in `data/SOURCE-NOTES.md`.

```bash
npm run seed:coast    # rebuild the JSON from scripts/build-coast-seed.ts
npm run seed          # clear runtime reports + overlays
```

## Reports that survive a deploy

Local `npm run dev` writes reports to `data/runtime/`. On Vercel the filesystem is `/tmp` and evaporates.

When a Blob store is connected, reports, dock overlays, haul-out plans, and the wholesale desk live in Vercel Blob under `dock-posted/reports.json`, `dock-posted/overlays.json`, `dock-posted/haul-out.json`, and `dock-posted/wholesale.json`.

One dashboard click on the existing Dock Posted project:

1. Vercel → Storage → Create Database → **Blob**
2. Connect it to this project

Vercel injects `BLOB_READ_WRITE_TOKEN`. Redeploy. No new vendor login.

Until that token is present, production still accepts reports for the life of the instance, then loses them. The chart and seed keep working either way.

Truck-day updates. The marina owns a verified pin. Unverified public pins stay Call.

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

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATA_DIR` | no | `data/runtime` or `/tmp/...` | Local file fallback for reports, overlays, haul-out, and wholesale |
| `BLOB_READ_WRITE_TOKEN` | no | unset | Vercel Blob. Injected when a Blob store is connected |
| `VERCEL` | set by Vercel | — | Local fallback uses `/tmp/dock-posted` if Blob is not configured |
| `WHOLESALE_PASSWORD` | for `/wholesale` | unset = 404 | Shared password for the internal netback desk |
| `WHOLESALE_SESSION_SECRET` | no | derived from the password | Signs the HttpOnly wholesale cookie |

No map API keys. Tiles are OpenStreetMap (`tile.openstreetmap.de`, fallback `a.tile.openstreetmap.fr/osmfr`) through `/api/tiles/{z}/{x}/{y}.png?v=2`. User-Agent: `DockPosted/1.0`. Attribution: © OpenStreetMap. Not Carto.

## Stack

Next.js App Router, TypeScript, Tailwind. JSON seed. Vercel Blob for reports when enabled. HTML-first chart — the map is image tiles and links, so it still works if client JS is blocked.

## Production build

```bash
npm run test:board
npm run test:parser
npm run build
npm start             # same port as dev: 43123
```

## Internal wholesale desk

`/wholesale` is a password-gated netback worksheet. The header shows **Wholesale** only when `WHOLESALE_PASSWORD` is set. If that env is unset, the route is 404 and the nav link is omitted. Unauthenticated visitors see a password form only.

The desk default is a terminal→retail waterfall (RB and HO side by side). Tax is a first-class take: federal and state rungs from published IRS/EIA tables in `data/wholesale-tax.json`, always overrideable. Market cells (NYMEX, diff, rack, jobber) start blank. Freight stays blank unless typed.

Differentials and per-terminal inputs persist next to haul-out: `DATA_DIR` / `data/runtime/wholesale.json`, or Blob `dock-posted/wholesale.json`. Terminal TCNs are in `data/wholesale-terminals.json` (IRS directory + Buckeye / KM pages). Blank TCN stays blank.

The desk may pull the public Yahoo Finance NYMEX front-month screens — `RB=F` (RBOB / gasoline) and `HO=F` (NY Harbor ULSD / heating oil). Fetch is server-side. If Yahoo fails, is stale, or will not parse, the screen stays — and the desk says so. A typed screen wins. Not Platts, OPIS, DTN, RINs, or Rio Energy.

```bash
npm run test:wholesale
```

## What this is not

A public fuel desk, a bargain map, an SMS product, or a payment flow. The consumer board does not show rack, NYMEX, or a wholesale book. No leftover wet-slip or pump-out products.
