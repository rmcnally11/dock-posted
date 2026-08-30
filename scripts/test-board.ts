import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { filterDocks, parseBoardQuery, matchesSearch } from "../src/lib/board-query";
import { formatQuote } from "../src/lib/format";
import { boardQuote, boardTally, freshness, freshnessLabel, pinTrust } from "../src/lib/freshness";
import seed from "../data/docks.seed.json";
import type { Dock, StateCode } from "../src/lib/types";
import { STATE_CODES } from "../src/lib/types";

async function main() {
  const { docks } = await loadCombinedSeed();

assert.ok(docks.length >= 90, `expected a coastal set, got ${docks.length}`);
assert.ok(docks.every((dock) => dock.region && dock.state && dock.city));
assert.ok(docks.every((dock) => Number.isFinite(dock.lat) && Number.isFinite(dock.lng)));
assert.ok(!docks.some((dock) => dock.id === "kemah-boardwalk-marina"));
assert.ok(!docks.some((dock) => dock.id === "watergate-yachting-center"));
assert.ok(!docks.some((dock) => /waterford|legend point|portofino/i.test(dock.name)));

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
assert.equal(keys.inCorridor.length, 13);
assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(keys.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(keys.visible.some((dock) => dock.id === "ocean-reef-club"));
assert.ok(!keys.visible.some((dock) => dock.corridor === "galveston-bay"));
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

const oceanReef = docks.find((dock) => dock.id === "ocean-reef-club");
assert.ok(oceanReef);
assert.equal(oceanReef.access, "members");
assert.ok(oceanReef.quotes.every((quote) => quote.pricePerGallon == null));
assert.ok(/members only/i.test(oceanReef.notes ?? ""));

const marinaDelMar = docks.find((dock) => dock.id === "marina-del-mar");
assert.ok(marinaDelMar);
assert.ok(marinaDelMar.quotes.every((quote) => quote.pricePerGallon == null));

  const keys = filterDocks(docks, parseBoardQuery({ corridor: "upper-keys" }));
  assert.equal(keys.inCorridor.length, 11);
  assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));

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
assert.equal(pinTrust(marinaBay), "unverified");

const gym = docks.find((dock) => dock.id === "galveston-yacht-marina");
assert.ok(gym);
assert.equal(pinTrust(gym), "verified");

const blueMarlin = docks.find((dock) => dock.id === "blue-marlin-seabrook");
assert.ok(blueMarlin);
assert.equal(pinTrust(blueMarlin), "last-seen");
assert.equal(freshnessLabel(blueMarlin), "Last seen");
assert.match(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null)), /^\$/);

const lastMonth = Date.parse("2026-08-30T12:00:00Z") + 40 * 24 * 60 * 60 * 1000;
assert.equal(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null, lastMonth)), "Call");

const houstonYacht = docks.find((dock) => dock.id === "houston-yacht-club");
assert.ok(houstonYacht);
assert.equal(formatQuote(houstonYacht.quotes.find((quote) => quote.product === "89") ?? null), "Call");
assert.equal(freshness(houstonYacht), "never");
assert.equal(freshnessLabel(houstonYacht), "Call ahead");
assert.equal(pinTrust(houstonYacht), "unverified");
assert.equal(houstonYacht.access, "members");

const lakewood = docks.find((dock) => dock.id === "lakewood-yacht-club");
assert.ok(lakewood);
assert.equal(lakewood.access, "private");

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
  /waterdog|coastal cavaliers|cheapest fuel|bargain map|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|RVO|throughput|gal\/slip|invoice|savings pitch|pasadena rack|text us every morning/i;
for (const file of [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/report/page.tsx",
  "src/app/safe-fuel/page.tsx",
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/site-header.tsx",
  "src/components/site-footer.tsx",
  "src/components/report-form.tsx",
  "src/components/freshness-badge.tsx",
  "src/app/report/page.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, fence, `${file} leaked a fuel-desk term`);
}

const tally = boardTally(docks);
assert.ok(tally.postedThisWeek > 0);
assert.ok(tally.call > tally.postedThisWeek);

console.log(
  `board filters ok — seed ${docks.length}, texas ${texas.visible.length}, keys ${keys.visible.length}, tx-state ${texasState.visible.length}, ne ${newEngland.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}, search ${search.visible.length}, posted-this-week ${tally.postedThisWeek}, call ${tally.call}, stale ${tally.stale}`,
);
