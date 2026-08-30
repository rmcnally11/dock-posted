import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { filterDocks, parseBoardQuery, matchesSearch } from "../src/lib/board-query";
import { formatQuote } from "../src/lib/format";
import { boardQuote, boardTally, freshness, freshnessLabel, pinTrust } from "../src/lib/freshness";
import { mergeParsedIntoDocks } from "../src/lib/waterway-guide";
import { DEFAULT_X_HANDLE, publicXHandle, xProfileUrl } from "../src/lib/x-handle";
import seed from "../data/docks.seed.json";
import type { Dock, StateCode } from "../src/lib/types";
import { STATE_CODES } from "../src/lib/types";

const docks = seed.docks as Dock[];

assert.ok(docks.length >= 90, `expected a coastal set, got ${docks.length}`);
assert.ok(docks.every((dock) => dock.region && dock.state && dock.city));
assert.ok(docks.every((dock) => Number.isFinite(dock.lat) && Number.isFinite(dock.lng)));
assert.ok(!docks.some((dock) => dock.id === "kemah-boardwalk-marina"));
assert.ok(!docks.some((dock) => dock.id === "watergate-yachting-center"));
assert.ok(!docks.some((dock) => /waterford|legend point|portofino|tcyc|corinthian/i.test(`${dock.id} ${dock.name}`)));

for (const dock of docks) {
  for (const quote of dock.quotes) {
    if (quote.status === "posted") {
      assert.ok(quote.pricePerGallon != null, `${dock.id} posted without a number`);
      assert.ok(dock.sourceUrl, `${dock.id} posted without a sourceUrl`);
    }
    if (quote.pricePerGallon != null) {
      assert.equal(quote.status, "posted", `${dock.id} has a dollar with status ${quote.status}`);
    }
  }
}

const texas = filterDocks(docks, parseBoardQuery({}));
assert.equal(texas.inCorridor.length, 7);
assert.equal(texas.visible.length, 7);
assert.ok(texas.visible.every((dock) => dock.corridor === "galveston-bay"));
assert.deepEqual(
  texas.visible.slice(0, 3).map((dock) => dock.id),
  ["marina-bay-harbor", "blue-marlin-seabrook", "south-shore-harbour"],
);
assert.equal(texas.visible[0].name, "Marina Bay Harbor");
assert.equal(texas.visible[1].name, "Blue Marlin Fuel Dock");
assert.equal(texas.visible[2].name, "South Shore Harbour Fuel Pier");
assert.equal(texas.visible.at(-1)?.id, "galveston-yacht-marina");

const keys = filterDocks(docks, parseBoardQuery({ corridor: "upper-keys" }));
assert.equal(keys.inCorridor.length, 7);
assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(keys.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(keys.visible.some((dock) => dock.id === "ocean-reef-club"));
assert.ok(!keys.visible.some((dock) => dock.corridor === "galveston-bay"));
assert.ok(!keys.visible.some((dock) => dock.city === "Islamorada"));
assert.deepEqual(
  keys.visible.slice(0, 5).map((dock) => dock.id),
  [
    "key-largo-harbor",
    "marina-del-mar",
    "pilot-house-marina",
    "garden-cove-marina",
    "ocean-reef-club",
  ],
);

const keysRegion = filterDocks(docks, parseBoardQuery({ region: "keys" }));
assert.ok(keysRegion.visible.some((dock) => dock.id === "islamarina"));
assert.ok(keysRegion.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(docks.every((dock) => !/cavalier/i.test(`${dock.id} ${dock.name}`)));

const oceanReef = docks.find((dock) => dock.id === "ocean-reef-club");
assert.ok(oceanReef);
assert.equal(oceanReef.access, "members");
assert.ok(oceanReef.quotes.every((quote) => quote.pricePerGallon == null));
assert.ok(/members only/i.test(oceanReef.notes ?? ""));
assert.match(oceanReef.hours ?? "", /7am–6pm/);

const marinaDelMar = docks.find((dock) => dock.id === "marina-del-mar");
assert.ok(marinaDelMar);
assert.ok(marinaDelMar.quotes.every((quote) => quote.pricePerGallon == null));

const e0 = filterDocks(docks, parseBoardQuery({ e0: "1" }));
assert.ok(e0.visible.length < e0.inCorridor.length);
assert.ok(e0.visible.every((dock) => dock.ethanol === "E0"));
assert.ok(!e0.visible.some((dock) => dock.id === "south-shore-harbour"));

const fresh = filterDocks(docks, parseBoardQuery({ fresh: "1" }));
assert.ok(fresh.visible.length < fresh.inCorridor.length);
assert.ok(fresh.visible.every((dock) => dock.lastVerifiedAt));
assert.ok(fresh.visible.every((dock) => freshness(dock) === "fresh"));

const texasState = filterDocks(docks, parseBoardQuery({ state: "TX" }));
assert.ok(texasState.inCorridor.length > 7);
assert.ok(texasState.visible.every((dock) => dock.state === "TX"));
assert.ok(texasState.visible.some((dock) => dock.id === "cove-harbor-rockport"));
assert.ok(!texasState.visible.some((dock) => dock.id === "kemah-boardwalk-marina"));

const newEngland = filterDocks(docks, parseBoardQuery({ region: "new-england" }));
assert.ok(newEngland.visible.length >= 8);
assert.ok(newEngland.visible.every((dock) => dock.region === "new-england"));

const search = filterDocks(docks, parseBoardQuery({ q: "key largo" }));
assert.ok(search.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(search.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(search.visible.every((dock) => matchesSearch(dock, "key largo")));

const statesPresent = new Set(docks.map((dock) => dock.state));
for (const state of STATE_CODES) {
  assert.ok(statesPresent.has(state as StateCode), `missing state ${state}`);
}

const marinaBay = docks.find((dock) => dock.id === "marina-bay-harbor");
assert.ok(marinaBay);
assert.equal(formatQuote(marinaBay.quotes.find((quote) => quote.product === "87") ?? null), "Call");
assert.equal(marinaBay.flags?.includes("last-pump"), true);
assert.equal(marinaBay.flags?.includes("still-open"), false);
assert.match(marinaBay.hours ?? "", /store only, not the hose/);
assert.equal(pinTrust(marinaBay), "unverified");

const gym = docks.find((dock) => dock.id === "galveston-yacht-marina");
assert.ok(gym);
assert.equal(pinTrust(gym), "verified");

const blueMarlin = docks.find((dock) => dock.id === "blue-marlin-seabrook");
assert.ok(blueMarlin);
assert.equal(pinTrust(blueMarlin), "unverified");
assert.equal(blueMarlin.hours, null);
assert.equal(blueMarlin.flags?.includes("last-pump"), true);
assert.equal(blueMarlin.flags?.includes("west-of-146"), true);
assert.equal(blueMarlin.flags?.includes("still-open"), false);
assert.equal(blueMarlin.ethanol, "E0");
assert.equal(freshnessLabel(blueMarlin), "Call the dock");
assert.ok(blueMarlin.quotes.every((quote) => quote.pricePerGallon == null));
assert.equal(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null)), "Call");
assert.equal(blueMarlin.lastVerifiedAt, "2026-08-28");

const lastMonth = Date.parse("2026-08-30T12:00:00Z") + 40 * 24 * 60 * 60 * 1000;
assert.equal(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null, lastMonth)), "Call");

const wgReplay = mergeParsedIntoDocks(
  [blueMarlin],
  [
    {
      name: "Blue Marlin Fuel Dock",
      city: "Seabrook, TX",
      comments: "stale sample",
      lastUpdate: "2026-08-14",
      nonEthanol: true,
      dockId: "blue-marlin-seabrook",
      quotes: [
        {
          product: "93",
          pricePerGallon: 5.99,
          ethanol: "E0",
          status: "posted",
          taxIncluded: true,
        },
      ],
    },
  ],
  "https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx",
);
assert.equal(wgReplay.docks[0]?.quotes.find((quote) => quote.product === "93")?.pricePerGallon, null);
assert.equal(wgReplay.docks[0]?.lastVerifiedAt, "2026-08-14");
assert.notEqual(wgReplay.docks[0]?.notes, "stale sample");

const southShore = docks.find((dock) => dock.id === "south-shore-harbour");
assert.ok(southShore);
assert.equal(southShore.ethanol, "E10");
assert.ok(southShore.quotes.every((quote) => quote.pricePerGallon == null));
assert.match(southShore.hours ?? "", /8am–6pm \(summer\)/);
assert.match(southShore.hours ?? "", /Winter 8am–4:30pm/);
assert.equal(southShore.lastVerifiedAt, "2026-08-28");
assert.equal(formatQuote(southShore.quotes[0] ?? null), "Call");

const houstonYacht = docks.find((dock) => dock.id === "houston-yacht-club");
assert.ok(houstonYacht);
assert.equal(formatQuote(houstonYacht.quotes.find((quote) => quote.product === "89") ?? null), "Call");
assert.equal(freshness(houstonYacht), "never");
assert.equal(freshnessLabel(houstonYacht), "Call the dock");
assert.equal(pinTrust(houstonYacht), "unverified");
assert.equal(houstonYacht.access, "members");

const lakewood = docks.find((dock) => dock.id === "lakewood-yacht-club");
assert.ok(lakewood);
assert.equal(lakewood.access, "private");
assert.equal(lakewood.phone, "(832) 256-6923");
assert.ok(lakewood.quotes.every((quote) => quote.pricePerGallon == null));

const keyLargoHarbor = docks.find((dock) => dock.id === "key-largo-harbor");
assert.ok(keyLargoHarbor);
assert.ok(keyLargoHarbor.quotes.every((quote) => quote.pricePerGallon == null));
assert.equal(keyLargoHarbor.lastVerifiedAt, "2022-08-26");
assert.equal(formatQuote(keyLargoHarbor.quotes[0] ?? null), "Call");

const tiles = readFileSync(
  path.join(process.cwd(), "src/app/api/tiles/[z]/[x]/[y]/route.ts"),
  "utf8",
);
assert.match(tiles, /tile\.openstreetmap\.org/);
assert.doesNotMatch(tiles, /carto/i);
assert.match(tiles, /DockPosted\/1\.0/);

const fence =
  /cheapest fuel|bargain map|on this water|instrument family|field letter|almanac|onthiswater|wind is the tide|sister page|field board|us saltwater docks|the board at the dock|seven letter|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|RVO|throughput|gal\/slip|invoice|savings pitch|pasadena rack|text us every morning|Holds Fast|waterdogfuel\.com/i;
for (const file of [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/about/page.tsx",
  "src/app/report/page.tsx",
  "src/app/safe-fuel/page.tsx",
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/site-header.tsx",
  "src/components/site-footer.tsx",
  "src/components/report-form.tsx",
  "src/components/freshness-badge.tsx",
  "src/components/x-timeline.tsx",
  "src/lib/x-handle.ts",
  "src/app/report/page.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, fence, `${file} leaked a fuel-desk term`);
}

const pinWall =
  /waterdog|coastal cavaliers|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|nymex|\bTCN\b|pasadena rack/i;
for (const file of [
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/fuel-map.tsx",
  "src/components/freshness-badge.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, pinWall, `${file} put a supplier mark on the board`);
}

const headerSource = readFileSync(path.join(process.cwd(), "src/components/site-header.tsx"), "utf8");
assert.match(headerSource, /Dock Posted/);
assert.doesNotMatch(headerSource, /What the dock posted/);
assert.match(headerSource, /The board/);
assert.match(headerSource, /Named storm/);
assert.match(headerSource, /Post a number/);
assert.match(headerSource, /href="\/about"/);
assert.match(headerSource, />\s*About\s*</);
assert.match(headerSource, /data-testid="nav-about"/);
assert.doesNotMatch(headerSource, />Haul-out</);
assert.doesNotMatch(headerSource, />Board</);
assert.doesNotMatch(headerSource, />Report</);
const e15At = headerSource.indexOf("E15");
const aboutAt = headerSource.indexOf('href="/about"');
const wholesaleAt = headerSource.indexOf("Wholesale");
assert.ok(e15At >= 0 && aboutAt > e15At, "About sits after E15");
assert.ok(wholesaleAt > aboutAt, "About sits before Wholesale");

const haulSource = readFileSync(path.join(process.cwd(), "src/app/haul-out/page.tsx"), "utf8");
assert.match(haulSource, /Leftover seats/);
assert.match(haulSource, /data-testid="haul-out-headline"[\s\S]*Named storm/);
assert.match(haulSource, /When they name it, you need a hole/);
assert.match(haulSource, /File the boat/);
assert.match(haulSource, /Two yards that fit/);
assert.match(haulSource, /When they name it, we text what.s left/);
assert.match(haulSource, /You call the yard\. We don.t lift her\./);
assert.doesNotMatch(haulSource, /Four doors\. One cone\./);
assert.doesNotMatch(haulSource, /\bKill\b/);
assert.match(haulSource, /Five yards still have not said/);
assert.doesNotMatch(haulSource, /Named storm parking/);
assert.doesNotMatch(haulSource, /A leftover seat, said out loud/);

const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(homeSource, /Who writes this\./);
assert.match(homeSource, /href="\/about"/);
assert.match(homeSource, /data-testid="who-writes-this"/);
assert.doesNotMatch(homeSource, /Twitter feed|social/i);

const reportSource = readFileSync(path.join(process.cwd(), "src/app/report/page.tsx"), "utf8");
const safeSource = readFileSync(path.join(process.cwd(), "src/app/safe-fuel/page.tsx"), "utf8");
const footerSource = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.doesNotMatch(reportSource, /What the dock posted/);
assert.doesNotMatch(safeSource, /What the dock posted/);
assert.match(reportSource, /Post a number/);
assert.match(reportSource, /You were there\. What did they have up\./);
assert.doesNotMatch(reportSource, /submit a price/i);
assert.doesNotMatch(reportSource, /If you saw it, write it/);
assert.match(footerSource, /If they didn.t post it, it.s Call\./);
assert.match(footerSource, /OpenStreetMap/);
assert.match(footerSource, /Waterdog Fuel\. Rack to dock\./);
assert.match(footerSource, /https:\/\/coastalcavaliers\.com/);
assert.doesNotMatch(footerSource, /waterdogfuel\.com|RJMtweets11|Holds Fast/i);
assert.doesNotMatch(footerSource, /We publish the pin/);
assert.doesNotMatch(footerSource, /What the boater saw/);
const campaign =
  /The take|The book|Open the book|Come in|Where the cents went|Four doors\. One cone|We publish the pin|Call is the honest number|fat cut lights up/;
const aboutSource = readFileSync(path.join(process.cwd(), "src/app/about/page.tsx"), "utf8");
const xTimelineSource = readFileSync(path.join(process.cwd(), "src/components/x-timeline.tsx"), "utf8");
const xHandleSource = readFileSync(path.join(process.cwd(), "src/lib/x-handle.ts"), "utf8");
assert.match(aboutSource, /data-testid="about-headline"[\s\S]*>\s*About\s*</);
assert.match(aboutSource, /We write what they posted\. If they didn.t, it.s Call\./);
assert.match(
  aboutSource,
  /Dock Posted is the number on the board at the fuel dock\. Sabine to Key West, then\s+the rest of the saltwater coast\./,
);
assert.match(aboutSource, /We don.t sell a gallon\. We don.t lift a boat\. A blank stays Call\./);
assert.match(
  aboutSource,
  /Named storm is leftover seats in the shed or on the lot\. When they name it, you\s+call the yard\./,
);
assert.match(aboutSource, /Wholesale is what it cost and what they posted\. That.s a locked door\./);
assert.match(aboutSource, /If you were at the dock, send the number\./);
assert.match(aboutSource, /href="\/report"/);
assert.match(aboutSource, />\s*Post a number\s*</);
assert.match(aboutSource, />Waterdog Fuel</);
assert.match(
  aboutSource,
  /Waterdog Fuel brings the gallon from the Houston rack to the first-water dock\. Clear\s+Lake, Kemah, Seabrook\. Opens 2027\. Not selling gallons yet\./,
);
assert.match(aboutSource, /mailto:orders@coastalcavaliers\.com/);
assert.match(aboutSource, /Reach them at/);
assert.match(
  aboutSource,
  /Rack to dock\. Same family as this board\. They do not set the number on the hose\./,
);
const waterdogAt = aboutSource.indexOf('data-testid="waterdog-fuel"');
const onXImport = aboutSource.indexOf("<XTimeline");
assert.ok(waterdogAt > 0 && onXImport > waterdogAt, "Waterdog block sits before On X");
assert.doesNotMatch(aboutSource, /waterdogfuel\.com|RJMtweets11|Holds Fast|HoldsFast/i);
assert.match(xTimelineSource, />On X</);
assert.match(xTimelineSource, /Nothing on X yet\./);
assert.match(xTimelineSource, /platform\.twitter\.com\/widgets\.js/);
assert.match(xTimelineSource, /twitter-timeline/);
assert.match(xTimelineSource, /publish\.twitter\.com|platform\.twitter\.com|twitter\.com\//);
assert.match(xHandleSource, /NEXT_PUBLIC_X_HANDLE/);
assert.match(xHandleSource, /DockPosted/);
assert.doesNotMatch(aboutSource, /Twitter feed|\bsocial\b|OTW|on this water/i);
assert.doesNotMatch(xTimelineSource, /Twitter feed|\bsocial\b|RJMtweets11|goodpiratesalma/);
assert.doesNotMatch(aboutSource, /nymex|differential|\bTCN\b|platts|opis|argus|jobber/i);
assert.doesNotMatch(xTimelineSource, /nymex|platts|\brack\b|opis/i);
assert.equal(DEFAULT_X_HANDLE, "DockPosted");
assert.equal(publicXHandle(undefined), "DockPosted");
assert.equal(publicXHandle(""), "DockPosted");
assert.equal(publicXHandle("@DockPosted"), "DockPosted");
assert.equal(publicXHandle("RJMtweets11"), "DockPosted");
assert.equal(publicXHandle("@goodpiratesalma"), "DockPosted");
assert.equal(publicXHandle("SomeOther_1"), "SomeOther_1");
assert.equal(xProfileUrl("DockPosted"), "https://x.com/DockPosted");
assert.doesNotMatch(homeSource, campaign);
assert.doesNotMatch(aboutSource, campaign);
assert.doesNotMatch(reportSource, campaign);
assert.doesNotMatch(safeSource, campaign);
assert.doesNotMatch(haulSource, campaign);
assert.doesNotMatch(footerSource, campaign);

const cardSource = readFileSync(path.join(process.cwd(), "src/components/dock-card.tsx"), "utf8");
assert.match(cardSource, />Regular</);
assert.match(cardSource, />Diesel</);
assert.match(cardSource, />Blend</);
assert.match(cardSource, />Hours</);
assert.match(cardSource, />Date</);

const tally = boardTally(docks);
assert.ok(tally.postedThisWeek > 0);
assert.ok(tally.call > tally.postedThisWeek);

console.log(
  `board filters ok — seed ${docks.length}, texas ${texas.visible.length}, keys ${keys.visible.length}, tx-state ${texasState.visible.length}, ne ${newEngland.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}, search ${search.visible.length}, posted-this-week ${tally.postedThisWeek}, call ${tally.call}, stale ${tally.stale}`,
);
