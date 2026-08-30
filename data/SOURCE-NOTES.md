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

Blue Marlin Fuel Dock (Seabrook, west of 146): marina fuel-dock page lists regular, supreme, diesel and no hours. Directories disagree on the close. Card hours stay Call. Last-pump flag stays. Still-open is not claimed.

Marina Bay Harbor hose is Daily 7:30am–5:30pm. Fri–Sun 6am is the ship store, not the hose. Last light in August is after 6, so this pin is last-pump, not still-open.

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
