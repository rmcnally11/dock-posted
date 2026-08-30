# Seed sources (captured 30 Aug 2026)

Prices in `docks.seed.json` come from public pages opened that day. Nothing here was invented. New coastal pins are real docks from public marina and municipal pages. If no pump board was on that page, the card says Call.

## Home waters — posted numbers

Waterway Guide weekly reports (opened 30 Aug 2026):

- Gulf Coast AL thru TX: https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx
- Florida Keys: https://www.waterwayguide.com/fuel-price-report/7/florida-keys

Used for posted numbers, Call, or No Report at Marina Bay Harbor, Blue Marlin Fuel Dock / Seabrook, South Shore Harbour Fuel Pier, Pilot House, Mangrove, Plantation Yacht Harbor, IslaMarina, Snake Creek, Three Waters, World Wide Sportsman, Bud'n Mary's.

Waterway Guide marina pages (Call / Never):

- Houston Yacht Club
- Lakewood Yacht Club
- Waterman's Harbor
- Key Largo Harbor Marina
- Tavernier Creek Marina
- Garden Cove Marina

Key Largo home pins added as Call, no invented dollars:

- Marina Del Mar (Key Largo) — CRYC sends boats here. First-party page listed slips, not a pump board. Directories disagree on a hose. Call.
- Ocean Reef Club (North Key Largo) — members only. Club marina page (30 Aug 2026) lists Daily 7am–6pm for members and their guests. A non-member weekend guest cannot buy. No pump dollars.

Islamorada docks stay in the Keys region. They are not on the Key Largo board.

Blue Marlin Fuel Dock (Seabrook, west of 146): marina fuel-dock page lists regular, supreme, diesel, ice, beer, bait — no pump dollars and no hours. Official pages conflict on Saturday close. Hours stay Call. WG dollars (even 08/28/26) stay off the card as a stale sample; the date of that last post stays. 93 has been listed E0.

South Shore Harbour Fuel Pier: marina page lists ValvTect gasoline and diesel. Summer 8am–6pm daily; winter 8am–4:30pm. No ethanol-free line. Tenant pump-out is free and is not fuel. No ice on pages Tide pulled. WG dollars stay off the card. A 6:30 run cannot use this dock.

Marina Bay Harbor hose is Daily 7:30am–5:30pm. Fri–Sun 6am is the ship store, not the hose. Last light in August is after 6, so this pin is last-pump, not still-open. Ethanol-free 93. Live shrimp by boat.

Lakewood Yacht Club is private (fuel/pump-out 832-256-6923). Houston Yacht Club is members/reciprocal. Neither is a public pump.

Watergate, Waterford, Legend Point, Portofino, Kemah Boardwalk, and TCYC are not fuel pins.

Dropped from the coast set (no weekend routing / no fuel):

- Kemah Boardwalk Marina
- Watergate Yachting Center
- Waterford, Legend Point, Portofino — never seeded

Marina marketing sites with a live board:

- https://galvestonyachtbasin.com/ — 30 Aug 2026: Diesel $5.28, Unleaded $4.45, Non-Ethanol $5.79

Marina sites that confirm fuel but show no pump price (home set):

- https://seabrookmarina.com/pages/seabrook-marina-fuel-dock
- https://southshoreharbourmarina.com/fuel-pier/
- https://www.pilothousemarina.com/marina/

## Coast expansion — directory capture, no invented dollars

The rest of the seed (Texas beyond Clear Lake, Louisiana, Mississippi, Alabama, both Florida coasts, the lower Keys, Georgia, the Carolinas, Chesapeake, New Jersey, New York, New England) was taken from public marina sites, municipal harbor pages, and well-known recreational docks on those waters.

Each of those pins has a real name, city, state, and a public lat/lng for the harbor. Phone and website are included when the public page listed them. Quotes are **Call**. `lastVerifiedAt` is empty (Never) until a public board or a boater report fills it.

No Waterway Guide scrape of the expanded coast succeeded from this environment. Cloudflare still challenges unattended fetches. That is a failed scrape, not a silent success. Do not treat this file as a fresh weekly report for the new pins.

Public WG report URLs the fetcher will try again (login not required):

- https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx
- https://www.waterwayguide.com/fuel-price-report/7/florida-keys
- https://www.waterwayguide.com/fuel-price-report/6/east-coast-of-florida
- https://www.waterwayguide.com/fuel-price-report/5/georgia
- https://www.waterwayguide.com/fuel-price-report/4/carolinas
- https://www.waterwayguide.com/fuel-price-report/3/chesapeake-bay
- https://www.waterwayguide.com/fuel-price-report/2/new-jersey-new-york
- https://www.waterwayguide.com/fuel-price-report/1/maine-to-new-york

If a later fetch returns real HTML, the parser can write overlays. Until then the seed stays Call.

## Rebuild

```bash
npm run seed:coast
```

That script keeps the home-water docks (prices intact), applies Clear Lake / Key Largo lead order, and rewrites the coastal additions from `scripts/build-coast-seed.ts`.

## Haul-out leftover seats

No live leftover counts. Blank = Call. We do not invent remaining seats, indoor or lot holes, max length, or yard phones.

`data/yards.seed.json` lists unverified names on the Clear Lake / Kemah / Upper Keys stretch already in these notes (Marina Bay Harbor, South Shore Harbour, Lakewood Yacht Club, Seabrook Shipyard from the WG “seabrook marina/shipyard” alias, Plantation Yacht Harbor, Mangrove, Tavernier Creek). Name only. Indoor, lot, max length, phone, and remaining seats stay Call until a yard posts them.

Market color, not quotes:

- Clear Lake first-come haul has been about $40/ft. Do not print that as a live quote.
- Progressive and other carriers have talked 50% haul reimbursement with a cap around $2,000. Insurance color. Not a Dock Posted quote.

Out of scope:

- Wet slips. We do not sell or list leftover wet slips.
- We are not the yard. We do not haul, store, or insure.

Owner offer: Named Storm Plan $99–$199 a season. Form only. No checkout.

Yard: bounty when a referred boat actually shows. They keep the haul fee. If they will not disclose leftover seats, they stay Call and they get no boats.

Kill: five yards have not said leftover seats out loud.

Owner plans and leftover posts write with price reports: `DATA_DIR` / `data/runtime/haul-out.json`, or Vercel Blob `dock-posted/haul-out.json` when configured. Not a separate `/tmp`-only path.

## Wholesale terminals (internal desk only)

Captured 30 Aug 2026. Mapping lives in `data/wholesale-terminals.json`. This is not shown on the public board.

Source of truth, in order:

1. IRS Terminal Control Number / Terminal Locations Directory, file title **ACTIVE FUEL TERMINALS @6/30/2026**. Page: https://www.irs.gov/businesses/small-businesses-self-employed/terminal-control-number-tcn-terminal-locations-directory — XLSX https://www.irs.gov/pub/irs-sbse/tcn-db.xlsx retrieved 30 Aug 2026.
2. Buckeye Pipe Line Company, L.P. Section 7.1 Table I Marine Terminal Specs (1 Oct 2025): https://www.buckeye.com/wp-content/uploads/2025/09/Section-7.1-Table-I-Marine-Terminal-Specs-100125.pdf — lists Albany NY, Baltimore MD, Bayonne NJ, Charleston SC, Chesapeake VA, Corpus Christi TX, Ft Lauderdale FL, Groton CT, Jacksonville FL, Marrero LA, New Haven CT, Pennsauken NJ, Perth Amboy NJ, Port Reading NJ, Rensselaer NY, Roseton NY, S. Portland ME, Tampa North FL, Tampa South FL, and specifies marine receipt of RBOB and ULSD.
3. Kinder Morgan Products page: https://www.kindermorgan.com/Operations/Products/Index — KMLT Tampa at 2101 GATX Drive (gasoline/gasohol, diesel, jet, ethanol); CFPL Taft / Orlando; Southeast terminals. Pasadena sheet (June 2025): https://www.kindermorgan.com/getmedia/0086655d-8bad-4607-9307-c3b81e81ec3b/(GL)-Pasadena-(2025-06).pdf — 1420 / N. Witter, refined products and distillates. Galena Park sheet (June 2025): https://www.kindermorgan.com/getmedia/f06a0876-d052-4ed6-8309-6112e45ebee0/(GL)-Galena-Park-(2025-06).pdf — 906 Clinton Drive.

Rules used:

- Every verified `tcnIrs` is copied from the IRS XLSX. No minted 4-digit. No neighbor-hub copy.
- If Buckeye lists a marine terminal but the IRS file has no matching operator+city row, `tcnIrs` is blank and `tcnStatus` is unverified (Marrero, LA).
- Keys / Key Largo: no pipeline terminal. Nearest row is Buckeye Fort Lauderdale `T-65-FL-2156` (~80 mi N of Key Largo). No invented Key Largo TCN. No KM TCN at Port Everglades in the 6/30/2026 IRS file.
- Houston / Clear Lake: KM only (`T-76-TX-2809`, `T-76-TX-2830`, `T-76-TX-2788`, `T-76-TX-2819`). No Buckeye Houston TCN.
- Mississippi coast: no Buckeye/KM on the water. In-state KMST Collins `T-64-MS-2402`. Footnote: Chevron Pascagoula `T-64-MS-2416` (other operator).
- Georgia coast: no Buckeye/KM in Savannah. Nearest Buckeye: Jacksonville and North Charleston. Footnote: Colonial Terminals Savannah `T-58-GA-2550`.
- Alabama coast: no Buckeye/KM in Mobile. In-state inland Birmingham / Montgomery TCNs only.
- Atlanta and extra inland KMST/Buckeye rows are left as addable hubs, not dumped onto the coastal worksheet.

Miles on area attachments are great-circle city-to-region-center distances, for “nearest / direction” labels only. They are not freight.

