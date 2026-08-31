import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { deskCallFromDock, isDeskCandidate, pickDeskDocks } from "../src/lib/desk";
import {
  parsePinInput,
  parseWatchInput,
  PIN_PRICE_LABEL,
  pinPitch,
  runWatchHref,
  WATCH_PRICE_LABEL,
  waterLabel,
  weekOfIso,
} from "../src/lib/income";
import { parseCheckoutRef } from "../src/lib/pay";
import { runRows, tankDollars, tankGallons } from "../src/lib/run-card";
import type { Dock } from "../src/lib/types";
import seed from "../data/docks.seed.json";

const docks = seed.docks as Dock[];

assert.equal(tankGallons({ gallons: 40, gph: null, hours: null }), 40);
assert.equal(tankGallons({ gallons: null, gph: 12, hours: 3 }), 36);
assert.equal(tankGallons({ gallons: null, gph: 12, hours: null }), null);
assert.equal(tankDollars(40, 5.28), 211.2);
assert.equal(PIN_PRICE_LABEL, "$299 a season");
assert.equal(WATCH_PRICE_LABEL, "$29 a year");
assert.equal(waterLabel("galveston-bay", null), "Galveston Bay / Clear Lake");
assert.match(weekOfIso(new Date("2026-08-31T12:00:00Z")), /^2026-08-31$/);

const posted = docks.find((dock) => dock.id === "galveston-yacht-marina");
assert.ok(posted);
const rows = runRows([posted], 40);
assert.equal(rows[0]?.dieselLabel.startsWith("$"), true);
assert.equal(rows[0]?.tankDieselLabel.startsWith("$"), true);

const callDock = docks.find((dock) => dock.id === "marina-bay-harbor");
assert.ok(callDock);
const callRows = runRows([callDock], 40);
assert.equal(callRows[0]?.gasLabel, "Call");
assert.equal(callRows[0]?.tankGasLabel, "Call");

const badPin = parsePinInput({
  dockId: "",
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "dock",
  note: "",
});
assert.equal(badPin.ok, false);

const okPin = parsePinInput({
  dockId: "marina-bay-harbor",
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "fuel dock",
  note: "",
});
assert.equal(okPin.ok, true);

const badWatch = parseWatchInput({
  email: "nope",
  name: "Pat",
  corridor: "galveston-bay",
  region: "",
  gallons: "40",
});
assert.equal(badWatch.ok, false);

const okWatch = parseWatchInput({
  email: "pat@example.com",
  name: "Pat",
  corridor: "galveston-bay",
  region: "",
  gallons: "40",
});
assert.equal(okWatch.ok, true);
if (okWatch.ok) {
  assert.equal(okWatch.value.corridor, "galveston-bay");
  assert.equal(okWatch.value.gallons, 40);
}

assert.equal(isDeskCandidate(callDock, []), true);
assert.equal(isDeskCandidate(posted, []), false);
assert.equal(isDeskCandidate(callDock, [{
  id: "x",
  dockId: callDock.id,
  dockName: callDock.name,
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "dock",
  status: "paid",
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
  lastContactedAt: null,
  note: null,
}]), false);

const picked = pickDeskDocks(docks, [], []);
assert.ok(picked.length > 0 && picked.length <= 8);
assert.ok(picked.every((dock) => dock.phone && dock.access === "public"));
assert.ok(picked.some((dock) => dock.corridor === "galveston-bay" || dock.corridor === "upper-keys"));
const first = picked[0];
assert.ok(first);
const drafted = deskCallFromDock(first, new Date("2026-08-31T12:00:00Z"));
assert.equal(drafted.status, "queued");
assert.equal(drafted.weekOf, "2026-08-31");

const pitch = pinPitch("Marina Bay Harbor");
assert.match(pitch, /\$299 a season/);
assert.doesNotMatch(pitch, /cheapest|savings|bargain/i);

assert.deepEqual(parseCheckoutRef("pin:abc"), { kind: "pin", recordId: "abc" });
assert.equal(parseCheckoutRef("nope"), null);
assert.equal(runWatchHref({ corridor: "galveston-bay", gallons: 40 }), "/run?corridor=galveston-bay&gallons=40");
assert.equal(
  runWatchHref({ corridor: "galveston-bay", gallons: 40, watched: true }),
  "/run?corridor=galveston-bay&gallons=40&watched=1",
);
assert.equal(runWatchHref({ region: "keys" }), "/run?region=keys");
assert.equal(runWatchHref({}), "/run");

const fence = /cheapest|bargain|savings pitch|on this water|instrument family|field letter|wind is the tide/i;
for (const file of [
  "src/app/pin/page.tsx",
  "src/app/run/page.tsx",
  "src/app/how/page.tsx",
  "src/components/how-it-works.tsx",
  "src/lib/income.ts",
  "src/lib/run-card.ts",
  "src/lib/desk.ts",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, fence, `${file} leaked a bargain or sister-product term`);
}

const pinPage = readFileSync(path.join(process.cwd(), "src/app/pin/page.tsx"), "utf8");
assert.match(pinPage, /Own the pin/);
assert.match(pinPage, /PIN_PRICE_LABEL/);
assert.match(pinPage, /How the pin works/);
assert.doesNotMatch(pinPage, /stripe/i);

const runPage = readFileSync(path.join(process.cwd(), "src/app/run/page.tsx"), "utf8");
assert.match(runPage, /The run/);
assert.match(runPage, /Charter or trailer/);
assert.match(runPage, /E15 is not for boats/);
assert.match(runPage, /How the run works/);

const howPage = readFileSync(path.join(process.cwd(), "src/app/how/page.tsx"), "utf8");
assert.match(howPage, /How it works/);
assert.match(howPage, /The pin/);
assert.match(howPage, /The run/);
assert.match(howPage, /Named storm/);
assert.match(howPage, /PIN_WALK/);
assert.match(howPage, /RUN_WALK/);
assert.match(howPage, /STORM_WALK/);

const walks = readFileSync(path.join(process.cwd(), "src/components/how-it-works.tsx"), "utf8");
assert.match(walks, /File the boat/);
assert.match(walks, /Two yards that fit/);
assert.match(walks, /When they name it, we text what.s left/);
assert.match(walks, /You call the yard\. We don.t lift her\./);

const haulPage = readFileSync(path.join(process.cwd(), "src/app/haul-out/page.tsx"), "utf8");
assert.match(haulPage, /STORM_WALK/);
assert.match(haulPage, /The four steps/);
assert.doesNotMatch(haulPage, /heading="How it works"/);

const footer = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.match(footer, /href="\/pin"/);
assert.match(footer, /href="\/run"/);
assert.match(footer, /href="\/how"/);
assert.match(footer, /Waterdog Fuel[\s\S]*The pin[\s\S]*The run/);

const dockPage = readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8");
assert.match(dockPage, /data-testid="own-this-pin"/);
assert.match(dockPage, /data-testid="this-water"/);
assert.match(dockPage, /runWatchHref/);

const board = readFileSync(path.join(process.cwd(), "src/components/dock-board.tsx"), "utf8");
assert.match(board, /data-testid="board-run"/);

const home = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.doesNotMatch(home, /stripe|waitlist|email capture|newsletter/i);

console.log("income tests passed");
