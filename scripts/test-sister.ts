import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { briefCoastFor, briefCoastsForWatch } from "../src/lib/airtable-desk";
import {
  briefCoastsFor,
  conditionsHref,
  conditionsMailLine,
  sisterHomeHref,
} from "../src/lib/sister";

const galveston = conditionsHref({ corridor: "galveston-bay" });
assert.equal(galveston.label, "This morning on Galveston");
assert.match(galveston.href, /theater=texas/);
assert.match(galveston.href, /area=galveston/);
assert.match(galveston.href, /utm_source=dockposted/);
assert.match(galveston.href, /utm_medium=handoff/);

assert.equal(conditionsHref({ city: "Port Arthur", state: "TX" }).area, "sabine");
assert.equal(conditionsHref({ city: "Key Largo", corridor: "upper-keys" }).area, "key-largo");
assert.equal(conditionsHref({ city: "Key West", region: "keys" }).area, "key-west");
assert.equal(conditionsHref({ city: "Rockport", region: "texas" }).area, "aransas");
assert.equal(conditionsHref({ city: "Corpus Christi", region: "texas" }).area, "corpus");
assert.equal(conditionsHref({ region: "louisiana" }).area, "venice");
assert.equal(conditionsHref({ region: "west-florida" }).area, "boca-grande");
assert.equal(conditionsHref({ region: "east-florida" }).area, "jupiter");
assert.equal(conditionsHref({ city: "Maine", region: "maine" }).area, null);

assert.deepEqual(briefCoastsFor({ region: "texas" }), [
  "sabine",
  "galveston",
  "matagorda",
  "aransas",
  "corpus",
  "baffin",
  "lower-laguna",
]);
assert.deepEqual(briefCoastsFor({ corridor: "galveston-bay" }), ["galveston"]);
assert.deepEqual(briefCoastsFor({ region: "keys" }), [
  "key-largo",
  "islamorada",
  "florida-bay",
  "marathon",
  "key-west",
]);

assert.equal(briefCoastFor({ corridor: "galveston-bay", region: null } as never), "galveston");
assert.deepEqual(briefCoastsForWatch({ corridor: null, region: "keys" } as never), [
  "key-largo",
  "islamorada",
  "florida-bay",
  "marathon",
  "key-west",
]);

assert.match(sisterHomeHref(), /^https:\/\/onthiswater\.com\/\?utm_source=dockposted/);
assert.match(conditionsMailLine({ corridor: "galveston-bay" }), /area=galveston/);

for (const file of [
  "src/components/dock-board.tsx",
  "src/app/docks/[id]/page.tsx",
  "src/app/run/page.tsx",
  "src/app/how/page.tsx",
  "src/app/about/page.tsx",
  "src/app/haul-out/page.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.match(text, /SisterHandoff/, `${file} is missing the morning-line handoff`);
}

const footer = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.match(footer, /sisterHomeHref/);
assert.match(footer, /On This Water/);
assert.match(footer, /Tide and wind for this coast/);
assert.doesNotMatch(footer, /This morning on the same coast/);
assert.match(footer, /data-testid="sister-credit"/);

const handoff = readFileSync(path.join(process.cwd(), "src/components/sister-handoff.tsx"), "utf8");
assert.match(handoff, /Check tide and wind on/);
assert.match(handoff, />\s*On This Water\s*</);
assert.match(handoff, /href=\{next\.href\}/);
assert.doesNotMatch(handoff, /Tide and wind before you leave/);
assert.doesNotMatch(handoff, /Posted fuel lives here/);
assert.doesNotMatch(handoff, /\{next\.label\}/);

console.log("sister tests passed");
