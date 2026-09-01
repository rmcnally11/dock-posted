import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assignYards,
  EMPTY_LEFTOVER_NOTE,
  leftoverLabel,
  parseOwnerPlanInput,
  parseYardLeftoverInput,
  planLeftoverNote,
  remainingLabel,
  seedYardFromRow,
  yardsAreAllCall,
  type HaulYard,
  type YardSeedRow,
} from "../src/lib/haul-out";
import seed from "../data/yards.seed.json";

const seedYards: HaulYard[] = (seed.yards as YardSeedRow[]).map(seedYardFromRow);

assert.ok(seedYards.length >= 5 && seedYards.length <= 8, "board should be 5–8 rows");
assert.ok(yardsAreAllCall(seedYards), "seed leftover seats must all be Call");
assert.ok(
  seedYards.every((yard) => leftoverLabel(yard.indoorLeftover) === "—"),
  "indoor starts Call",
);
assert.ok(
  seedYards.every((yard) => remainingLabel(yard) === "—"),
  "remaining starts Call",
);
assert.equal(planLeftoverNote(null), EMPTY_LEFTOVER_NOTE);

const emptyMatch = assignYards(seedYards, 36);
assert.equal(emptyMatch.primary, null);
assert.equal(emptyMatch.backup, null);

const missingName = parseOwnerPlanInput({
  ownerName: "",
  phone: "713-555-0100",
  email: "pat@example.com",
  homeDock: "Lakewood",
  length: "36",
  beam: "12",
  insuranceCarrier: "Example Mutual",
  berth: "in-water",
});
assert.equal(missingName.ok, false);

const okOwner = parseOwnerPlanInput({
  ownerName: "Pat",
  phone: "713-555-0100",
  email: "pat@example.com",
  homeDock: "Lakewood",
  length: "36",
  beam: "12",
  insuranceCarrier: "Example Mutual",
  berth: "in-water",
});
assert.equal(okOwner.ok, true);

const blankLeftover = parseYardLeftoverInput({
  name: "Marina Bay Harbor",
  indoorLeftover: "",
  lotLeftover: "",
  maxLength: "",
  phone: "",
});
assert.equal(blankLeftover.ok, true);
if (blankLeftover.ok) {
  assert.equal(blankLeftover.value.indoorLeftover, null);
  assert.equal(blankLeftover.value.lotLeftover, null);
}

const posted = seedYards.map((yard) => ({ ...yard }));
posted[0] = { ...posted[0], indoorLeftover: 2, lotLeftover: 1, maxLengthFt: 50 };
posted[1] = { ...posted[1], indoorLeftover: 1, lotLeftover: null, maxLengthFt: 40 };
const matched = assignYards(posted, 36);
assert.equal(matched.primary?.id, posted[0].id);
assert.equal(matched.backup?.id, posted[1].id);
assert.ok(!yardsAreAllCall(posted));

async function storeRoundtrip() {
  const dir = await mkdtemp(path.join(tmpdir(), "dock-posted-haul-"));
  process.env.DATA_DIR = dir;
  const { addNamedStormPlan, postYardLeftover, readPlan, readYards } = await import("../src/lib/store");

  const yards = await readYards();
  assert.ok(yardsAreAllCall(yards));
  assert.ok(yards.every((yard) => remainingLabel(yard) === "—"));

  const plan = await addNamedStormPlan(okOwner.ok ? okOwner.value : ({} as never));
  const saved = await readPlan(plan.id);
  assert.ok(saved);
  assert.equal(saved?.primaryYardId, null);
  assert.equal(saved?.backupYardId, null);
  assert.equal(planLeftoverNote(null), EMPTY_LEFTOVER_NOTE);

  await postYardLeftover({
    name: "Marina Bay Harbor",
    indoorLeftover: 3,
    lotLeftover: null,
    maxLengthFt: 45,
    phone: "(281) 555-0100",
  });
  const after = await readYards();
  const marinaBay = after.find((yard) => yard.id === "marina-bay-harbor");
  assert.equal(marinaBay?.indoorLeftover, 3);
  assert.equal(marinaBay?.lotLeftover, null);
  assert.equal(remainingLabel(marinaBay!), "3");

  await rm(dir, { recursive: true, force: true });
}

storeRoundtrip()
  .then(() => {
    console.log(`haul-out ok — seed ${seedYards.length} Call rows, form + empty state`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
