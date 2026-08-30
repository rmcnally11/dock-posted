import assert from "node:assert/strict";
import { filterDocks, parseBoardQuery, matchesSearch } from "../src/lib/board-query";
import { formatQuote } from "../src/lib/format";
import { freshness } from "../src/lib/freshness";
import seed from "../data/docks.seed.json";
import type { Dock, StateCode } from "../src/lib/types";
import { STATE_CODES } from "../src/lib/types";

async function main() {
  const { docks } = await loadCombinedSeed();

assert.ok(docks.length >= 90, `expected a coastal set, got ${docks.length}`);
assert.ok(docks.every((dock) => dock.region && dock.state && dock.city));
assert.ok(docks.every((dock) => Number.isFinite(dock.lat) && Number.isFinite(dock.lng)));

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

  const texas = filterDocks(docks, parseBoardQuery({ corridor: "galveston-bay" }));
  assert.equal(texas.inCorridor.length, 7);
  assert.ok(texas.visible.every((dock) => dock.corridor === "galveston-bay"));

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

const newEngland = filterDocks(docks, parseBoardQuery({ region: "new-england" }));
assert.ok(newEngland.visible.length >= 8);
assert.ok(newEngland.visible.every((dock) => dock.region === "new-england"));

const search = filterDocks(docks, parseBoardQuery({ q: "key largo" }));
assert.ok(search.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(search.visible.every((dock) => matchesSearch(dock, "key largo")));

const statesPresent = new Set(docks.map((dock) => dock.state));
for (const state of STATE_CODES) {
  assert.ok(statesPresent.has(state as StateCode), `missing state ${state}`);
}

const marinaBay = docks.find((dock) => dock.id === "marina-bay-harbor");
assert.ok(marinaBay);
assert.equal(formatQuote(marinaBay.quotes.find((quote) => quote.product === "87") ?? null), "No report");

const houstonYacht = docks.find((dock) => dock.id === "houston-yacht-club");
assert.ok(houstonYacht);
assert.equal(formatQuote(houstonYacht.quotes.find((quote) => quote.product === "89") ?? null), "Call");
assert.equal(freshness(houstonYacht), "never");

console.log(
  `board filters ok — seed ${docks.length}, texas ${texas.visible.length}, keys ${keys.visible.length}, tx-state ${texasState.visible.length}, ne ${newEngland.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}, search ${search.visible.length}`,
);
