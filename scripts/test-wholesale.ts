import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { wholesalePasswordConfigured } from "../src/lib/wholesale-auth";
import seed from "../data/docks.seed.json";
import type { Dock } from "../src/lib/types";
import {
  WHOLESALE_AREA_ORDER,
  addCents,
  applyWorksheetDefaults,
  boardDockDefault,
  computeProductNetback,
  computeWorksheet,
  defaultTaxForTerminal,
  emptyWorksheet,
  findArea,
  findTerminal,
  formatCents,
  formatDollars,
  loadWholesaleCatalog,
  loadWholesaleTax,
  parseOptionalCents,
  rankTakes,
  resolveTaxForProduct,
  stripUnchangedDefaults,
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
assert.ok(filled.steps.filter((step) => step.key !== "taxOther").every((step) => step.cents != null));
assert.equal(filled.steps[0]?.source, "typed");
assert.equal(filled.steps[2]?.source, "derived");
assert.equal(filled.taxMode, "split");
assert.ok(filled.rungs.some((rung) => rung.key === "taxFederal" && rung.cents === 18.4));
assert.ok(filled.rungs.some((rung) => rung.key === "taxState" && rung.cents === 21.6));
assert.equal(filled.fattestTake, "remaining");

const oneLineBook = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: 55 },
);
assert.equal(oneLineBook.taxMode, "oneline");
assert.equal(oneLineBook.tax, 55);
assert.ok(oneLineBook.rungs.some((rung) => rung.key === "tax" && rung.label === "TAX" && rung.cents === 55));
assert.ok(!oneLineBook.rungs.some((rung) => rung.key === "taxFederal"));
assert.equal(oneLineBook.fattestTake, "remaining");

const taxWins = computeProductNetback(
  "HO",
  {
    nymexScreen: 200,
    terminalDiff: 5,
    inboundFreight: 3,
    postedRack: 220,
    jobberSell: 230,
    dockPosted: 280,
  },
  { federal: 24.4, state: 20, other: null, oneLine: null },
);
assert.equal(taxWins.tax, 44.4);
assert.ok(taxWins.dockRemaining != null && Math.abs(taxWins.dockRemaining - 5.6) < 1e-6);
assert.equal(taxWins.fattestTake, "taxFederal");

const table = loadWholesaleTax();
assert.equal(table.federal.gasolineCents, 18.4);
assert.equal(table.federal.dieselCents, 24.4);
assert.match(table.federal.label, /IRS as of 2026/);
assert.equal(table.state.asOf, "2026-07");
assert.equal(table.state.rates.TX.gasolineCents, 20);
assert.equal(table.state.rates.TX.dieselCents, 20);

const txRb = defaultTaxForTerminal("TX", "RB");
const txHo = defaultTaxForTerminal("TX", "HO");
assert.equal(txRb.federal.cents, 18.4);
assert.equal(txHo.federal.cents, 24.4);
assert.equal(txRb.state.cents, 20);
assert.equal(txHo.state.cents, 20);
assert.match(txRb.federal.label, /default · IRS as of 2026/);
assert.match(txRb.state.label, /EIA as of July 2026/);

const xx = defaultTaxForTerminal("ZZ", "RB");
assert.equal(xx.federal.cents, 18.4);
assert.equal(xx.state.cents, null);

const emptySheet = emptyWorksheet();
const withDefaults = applyWorksheetDefaults(emptySheet, { state: "TX" });
assert.equal(emptySheet.tax.federal, null);
assert.equal(withDefaults.rb.tax.federal.cents, 18.4);
assert.equal(withDefaults.rb.tax.federal.origin, "default");
assert.equal(withDefaults.ho.tax.federal.cents, 24.4);
assert.equal(withDefaults.ho.tax.federal.origin, "default");
assert.equal(withDefaults.rb.input.inboundFreight, null);
assert.equal(withDefaults.rb.input.nymexScreen, null);
assert.equal(withDefaults.rb.input.postedRack, null);

const typedTax = emptyWorksheet();
typedTax.taxRb = { federal: 30, state: 10 };
const override = applyWorksheetDefaults(typedTax, { state: "TX", saved: typedTax });
assert.equal(override.rb.tax.federal.cents, 30);
assert.equal(override.rb.tax.federal.origin, "typed");
assert.equal(override.rb.tax.state.cents, 10);
assert.equal(override.ho.tax.federal.cents, 24.4);
assert.equal(override.ho.tax.federal.origin, "default");

const defaultedBook = computeWorksheet(emptyWorksheet(), { state: "FL" });
assert.equal(defaultedBook.RB.taxFederal, 18.4);
assert.equal(defaultedBook.HO.taxFederal, 24.4);
assert.equal(defaultedBook.RB.taxState, 40.096);
assert.equal(defaultedBook.HO.taxState, 40.971);
assert.equal(defaultedBook.RB.inboundRack, null);
assert.equal(defaultedBook.RB.rungs.find((rung) => rung.key === "freight")?.cents, null);
assert.ok(defaultedBook.RB.takes.every((take) => take.key !== "freight"));
assert.ok(defaultedBook.RB.rungs.some((rung) => rung.key === "taxFederal"));
assert.ok(defaultedBook.RB.rungs.some((rung) => rung.key === "taxState"));

const blankFreightRank = rankTakes(defaultedBook.RB.rungs);
assert.ok(!blankFreightRank.some((take) => take.key === "freight"));
assert.ok(blankFreightRank.some((take) => take.key === "taxFederal" || take.key === "taxState"));

const oneLineResolved = resolveTaxForProduct(
  { federal: 18.4, state: 20, other: null, oneLine: 62 },
  "RB",
  { state: "TX", applyDefaults: true },
);
assert.equal(oneLineResolved.mode, "oneline");
assert.equal(oneLineResolved.strip.cents, 62);

const docks = seed.docks as Dock[];
const galvRb = boardDockDefault(docks, "galveston-bay", "RB");
const galvHo = boardDockDefault(docks, "galveston-bay", "HO");
assert.ok(galvRb);
assert.equal(galvRb.dockId, "galveston-yacht-marina");
assert.equal(galvRb.cents, 445);
assert.match(galvRb.label, /from the board/);
assert.ok(galvHo);
assert.equal(galvHo.cents, 528);
assert.equal(boardDockDefault(docks, "keys", "RB"), null);
assert.equal(boardDockDefault(docks, "keys", "HO"), null);
assert.equal(boardDockDefault(docks, "upper-keys", "RB"), null);

const boardApplied = applyWorksheetDefaults(emptyWorksheet(), {
  state: "TX",
  areaId: "galveston-bay",
  docks,
});
assert.equal(boardApplied.rb.input.dockPosted, 445);
assert.equal(boardApplied.rb.origins.dockPosted, "board");
assert.equal(boardApplied.ho.input.dockPosted, 528);

const typedDock = emptyWorksheet();
typedDock.rb.dockPosted = 399;
const dockOverride = applyWorksheetDefaults(typedDock, {
  state: "TX",
  areaId: "galveston-bay",
  docks,
  saved: typedDock,
});
assert.equal(dockOverride.rb.input.dockPosted, 399);
assert.equal(dockOverride.rb.origins.dockPosted, "typed");

const stripped = stripUnchangedDefaults(
  {
    ...emptyWorksheet(),
    taxRb: { federal: 18.4, state: 20 },
    taxHo: { federal: 24.4, state: 20 },
    rb: { ...emptyWorksheet().rb, dockPosted: 445 },
  },
  "TX",
  { areaId: "galveston-bay", docks },
);
assert.equal(stripped.taxRb?.federal, null);
assert.equal(stripped.taxHo?.federal, null);
assert.equal(stripped.rb.dockPosted, null);

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
