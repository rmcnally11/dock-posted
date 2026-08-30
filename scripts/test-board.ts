import assert from "node:assert/strict";
import { filterDocks, parseBoardQuery } from "../src/lib/board-query";
import { loadCombinedSeed } from "../src/lib/store";
import { CORRIDOR_ORDER } from "../src/lib/types";

async function main() {
  const { docks } = await loadCombinedSeed();

  const all = filterDocks(docks, parseBoardQuery({}));
  assert.equal(all.inCorridor.length, docks.length);
  assert.ok(docks.length >= 40);

  const texas = filterDocks(docks, parseBoardQuery({ corridor: "galveston-bay" }));
  assert.equal(texas.inCorridor.length, 7);
  assert.ok(texas.visible.every((dock) => dock.corridor === "galveston-bay"));

  const keys = filterDocks(docks, parseBoardQuery({ corridor: "upper-keys" }));
  assert.equal(keys.inCorridor.length, 11);
  assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));

  const sabine = filterDocks(docks, parseBoardQuery({ corridor: "sabine" }));
  assert.ok(sabine.visible.some((dock) => dock.id === "pleasure-island-marina"));

  const lowerKeys = filterDocks(docks, parseBoardQuery({ corridor: "lower-keys" }));
  assert.ok(lowerKeys.visible.some((dock) => dock.id === "key-west-bight"));

  for (const id of CORRIDOR_ORDER) {
    const stretch = docks.filter((dock) => dock.corridor === id);
    assert.ok(stretch.length > 0, `gap: ${id}`);
  }

  const e0 = filterDocks(docks, parseBoardQuery({ corridor: "galveston-bay", e0: "1" }));
  assert.ok(e0.visible.length < e0.inCorridor.length);
  assert.ok(e0.visible.every((dock) => dock.ethanol === "E0"));

  const fresh = filterDocks(docks, parseBoardQuery({ corridor: "galveston-bay", fresh: "1" }));
  assert.ok(fresh.visible.length < fresh.inCorridor.length);

  console.log(
    `board filters ok — all ${all.visible.length}, galveston ${texas.visible.length}, keys ${keys.visible.length}, stretches ${CORRIDOR_ORDER.length}`,
  );
}

void main();
