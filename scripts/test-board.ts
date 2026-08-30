import assert from "node:assert/strict";
import { filterDocks, parseBoardQuery } from "../src/lib/board-query";
import seed from "../data/docks.seed.json";
import type { Dock } from "../src/lib/types";

const docks = seed.docks as Dock[];

const texas = filterDocks(docks, parseBoardQuery({}));
assert.equal(texas.inCorridor.length, 7);
assert.equal(texas.visible.length, 7);
assert.ok(texas.visible.every((dock) => dock.corridor === "galveston-bay"));

const keys = filterDocks(docks, parseBoardQuery({ corridor: "upper-keys" }));
assert.equal(keys.inCorridor.length, 11);
assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(!keys.visible.some((dock) => dock.corridor === "galveston-bay"));

const e0 = filterDocks(docks, parseBoardQuery({ e0: "1" }));
assert.ok(e0.visible.length < e0.inCorridor.length);
assert.ok(e0.visible.every((dock) => dock.ethanol === "E0"));
assert.ok(!e0.visible.some((dock) => dock.id === "south-shore-harbour"));

const fresh = filterDocks(docks, parseBoardQuery({ fresh: "1" }));
assert.ok(fresh.visible.length < fresh.inCorridor.length);
assert.ok(fresh.visible.every((dock) => dock.lastVerifiedAt));

console.log(
  `board filters ok — texas ${texas.visible.length}, keys ${keys.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}`,
);
