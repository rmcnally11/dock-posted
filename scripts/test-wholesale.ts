import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { wholesalePasswordConfigured } from "../src/lib/wholesale-auth";
import {
  WHOLESALE_AREA_ORDER,
  addCents,
  computeProductNetback,
  computeWorksheet,
  emptyWorksheet,
  findArea,
  findTerminal,
  formatCents,
  formatDollars,
  loadWholesaleCatalog,
  parseOptionalCents,
  subCents,
  taxCents,
  tcnLabel,
  terminalsForArea,
  worksheetFromFields,
} from "../src/lib/wholesale";

const previousPassword = process.env.WHOLESALE_PASSWORD;
delete process.env.WHOLESALE_PASSWORD;
assert.equal(wholesalePasswordConfigured(), false);
process.env.WHOLESALE_PASSWORD = "test-only";
assert.equal(wholesalePasswordConfigured(), true);
if (previousPassword) process.env.WHOLESALE_PASSWORD = previousPassword;
else delete process.env.WHOLESALE_PASSWORD;

const catalog = loadWholesaleCatalog();
assert.equal(catalog.irsDirectoryAsOf, "2026-06-30");
assert.ok(catalog.sources["irs-tcn-2026-06-30"].url.includes("irs.gov"));
assert.ok(catalog.sources["buckeye-marine-specs-2025-10"].url.includes("buckeye.com"));
assert.ok(catalog.sources["km-products-page-2026-08-30"].url.includes("kindermorgan.com"));

assert.deepEqual(
  catalog.areas.map((area) => area.areaId).sort(),
  [...WHOLESALE_AREA_ORDER].sort(),
);

for (const area of catalog.areas) {
  assert.ok(area.terminals.length >= 1, `${area.areaId} needs a terminal`);
  for (const ref of area.terminals) {
    const terminal = findTerminal(ref.terminalId);
    assert.ok(terminal, `missing ${ref.terminalId} for ${area.areaId}`);
  }
}

const verified = catalog.terminals.filter((row) => row.tcnStatus === "verified");
assert.ok(verified.length >= 40);
for (const row of verified) {
  assert.ok(row.tcnIrs && /^T-\d{2}-[A-Z]{2}-\d{4}$/.test(row.tcnIrs), `bad TCN ${row.tcnIrs}`);
}

const unverified = catalog.terminals.filter((row) => row.tcnStatus === "unverified");
assert.ok(unverified.every((row) => row.tcnIrs == null));
assert.equal(tcnLabel(unverified[0]!), "—");

const keys = findArea("keys");
assert.equal(keys.terminals.length, 1);
assert.equal(keys.terminals[0]?.terminalId, "t-65-fl-2156");
assert.equal(keys.terminals[0]?.inArea, false);
assert.match(keys.note, /Key Largo/i);
assert.equal(findTerminal("t-65-fl-2156")?.tcnIrs, "T-65-FL-2156");
assert.ok(!catalog.terminals.some((row) => /key largo/i.test(row.city)));

const upper = findArea("upper-keys");
assert.equal(upper.terminals[0]?.terminalId, "t-65-fl-2156");

const houston = terminalsForArea("galveston-bay");
assert.ok(houston.every((row) => row.terminal.operator === "Kinder Morgan"));
assert.ok(houston.every((row) => row.terminal.tcnIrs?.startsWith("T-76-TX-")));

const texas = terminalsForArea("texas");
assert.ok(texas.some((row) => row.terminal.id === "t-76-tx-2838"));
assert.ok(texas.some((row) => row.terminal.operator === "Buckeye"));
assert.ok(texas.some((row) => row.terminal.operator === "Kinder Morgan"));

const westFl = terminalsForArea("west-florida");
assert.ok(westFl.filter((row) => row.terminal.city === "Tampa").length >= 4);
assert.ok(westFl.some((row) => row.terminal.operator === "Buckeye"));
assert.ok(westFl.some((row) => row.terminal.operator === "Kinder Morgan"));

const marrero = findTerminal("buckeye-marrero-unverified");
assert.equal(marrero?.tcnIrs, null);
assert.equal(marrero?.tcnStatus, "unverified");

assert.equal(formatCents(null), "—");
assert.equal(formatDollars(null), "—");
assert.equal(formatCents(12.5), "12.50 ¢/gal");
assert.equal(formatDollars(12.5), "$0.1250/gal");
assert.equal(parseOptionalCents(""), null);
assert.equal(parseOptionalCents("2.10", "dollar"), 210);
assert.equal(addCents(200, 10), 210);
assert.equal(addCents(200, null), null);
assert.equal(subCents(250, 200), 50);
assert.equal(subCents(250, null), null);
assert.equal(taxCents({ federal: 18.4, state: 20, other: null, oneLine: null }), 38.4);
assert.equal(taxCents({ federal: 18.4, state: 20, other: 5, oneLine: 40 }), 40);
assert.equal(taxCents({ federal: null, state: null, other: null, oneLine: null }), null);

const blank = computeWorksheet(emptyWorksheet());
assert.equal(blank.RB.rackMargin, null);
assert.equal(blank.HO.dockRemaining, null);
assert.equal(formatCents(blank.RB.impliedDiff), "—");

const filled = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.equal(filled.terminalSpot, 208);
assert.equal(filled.inboundRack, 212);
assert.equal(filled.rackMargin, 18);
assert.equal(filled.jobberMargin, 15);
assert.equal(filled.tax, 40);
assert.equal(filled.dockExTax, 320);
assert.equal(filled.dockRemaining, 75);
assert.equal(filled.rackEquivalent, 320);
assert.equal(filled.terminalEquivalent, 316);
assert.equal(filled.impliedDiff, 116);
assert.equal(filled.edgeVsTyped, 108);
assert.ok(filled.steps.every((step) => step.cents != null));
assert.equal(filled.steps[0]?.source, "typed");
assert.equal(filled.steps[2]?.source, "derived");

const partial = worksheetFromFields({ nymex_rb: "210" }, "cent");
assert.equal(partial.rb.nymexScreen, 210);
assert.equal(partial.rb.postedRack, null);
assert.equal(partial.ho.nymexScreen, null);
const partialBook = computeWorksheet(partial);
assert.equal(partialBook.RB.terminalSpot, null);
assert.equal(formatCents(partialBook.RB.rackMargin), "—");

async function storeRoundtrip() {
  const dir = await mkdtemp(path.join(tmpdir(), "dock-posted-wholesale-"));
  process.env.DATA_DIR = dir;
  const { saveTerminalWorksheet, addWholesaleDiff, readWholesaleStore } = await import("../src/lib/store");
  const sheet = emptyWorksheet();
  sheet.rb.nymexScreen = 199;
  await saveTerminalWorksheet("t-76-tx-2809", sheet);
  await addWholesaleDiff({
    id: "diff-1",
    terminalId: "t-76-tx-2809",
    name: "Pasadena vs screen",
    product: "RB",
    centsVsScreen: null,
  });
  const stored = await readWholesaleStore();
  assert.equal(stored.worksheets["t-76-tx-2809"]?.rb.nymexScreen, 199);
  assert.equal(stored.worksheets["t-76-tx-2809"]?.rb.postedRack, null);
  assert.equal(stored.differentials[0]?.centsVsScreen, null);
  await rm(dir, { recursive: true, force: true });
}

storeRoundtrip()
  .then(() => {
    console.log(
      `wholesale ok — ${catalog.terminals.length} terminals, ${catalog.areas.length} areas, blank stays blank`,
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
