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
