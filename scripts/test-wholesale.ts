import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  wholesalePasswordConfigured,
  wholesaleSessionToken,
  wholesaleSessionValid,
  wholesaleWriteAllowed,
} from "../src/lib/wholesale-auth";
import seed from "../data/docks.seed.json";
import type { Dock } from "../src/lib/types";
import {
  WHOLESALE_AREA_ORDER,
  addCents,
  applyDiffRow,
  applyWorksheetDefaults,
  boardDockDefault,
  computeProductNetback,
  computeWorksheet,
  deliveredAtPlace,
  fatTakeCents,
  defaultTaxForTerminal,
  deskFootnotes,
  emptyWorksheet,
  findArea,
  findTerminal,
  formatCents,
  formatDollars,
  loadWholesaleCatalog,
  loadWholesaleTax,
  netbackHasFigures,
  parseOptionalCents,
  rankTakes,
  resolveTaxForProduct,
  sourceLabel,
  stepByKey,
  rememberClearedTax,
  stripUnchangedDefaults,
  subCents,
  taxCents,
  tcnLabel,
  terminalsForArea,
  worksheetFromFields,
  worksheetHasInputs,
} from "../src/lib/wholesale";
import { parseWholesaleDraft, serializeWholesaleDraft } from "../src/lib/wholesale-draft";
import {
  NYMEX_YAHOO_TICKERS,
  dollarsPerGalToCents,
  isYahooQuoteStale,
  parseYahooChart,
} from "../src/lib/wholesale-nymex";

const previousPassword = process.env.WHOLESALE_PASSWORD;
delete process.env.WHOLESALE_PASSWORD;
assert.equal(wholesalePasswordConfigured(), false);
process.env.WHOLESALE_PASSWORD = "test-only";
assert.equal(wholesalePasswordConfigured(), true);
const liveSession = wholesaleSessionToken();
assert.equal(wholesaleWriteAllowed(undefined), false);
assert.equal(wholesaleSessionValid("not-the-session"), false);
assert.equal(wholesaleWriteAllowed(liveSession), true);
delete process.env.WHOLESALE_PASSWORD;
assert.equal(wholesaleWriteAllowed(liveSession), false, "leftover cookie must not write when password is unset");
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
assert.equal(taxCents({ federal: 18.4, state: null, other: null, oneLine: null }), null);

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
assert.ok(
  filled.steps
    .filter((step) => !["taxOther", "fairHose", "shouldBe", "invoice", "fatTake"].includes(step.key))
    .every((step) => step.cents != null),
);
assert.equal(filled.steps[0]?.source, "typed");
assert.equal(filled.steps[2]?.source, "derived");
assert.equal(filled.taxMode, "split");
assert.ok(filled.rungs.some((rung) => rung.key === "taxFederal" && rung.cents === 18.4));
assert.ok(filled.rungs.some((rung) => rung.key === "taxState" && rung.cents === 21.6));
assert.equal(filled.fattestTake, "remaining");
assert.equal(filled.dap, 274);
assert.equal(filled.shouldBe, null);
assert.equal(filled.fatTake, null);
assert.equal(filled.postedVsDap, 86);
assert.ok(filled.rungs.some((rung) => rung.key === "shouldBe" && rung.label === "What it should have been." && rung.cents == null));
assert.ok(filled.rungs.some((rung) => rung.key === "fatTake" && rung.takeKey === "fatTake"));
assert.ok(filled.rungs.some((rung) => rung.key === "postedVsDap" && rung.takeKey == null));
assert.ok(!filled.takes.some((take) => take.key === "fatTake"));

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
assert.equal(withDefaults.rb.tax.state.cents, 20);
assert.equal(withDefaults.ho.tax.state.cents, 20);
assert.equal(withDefaults.rb.input.inboundFreight, null);
assert.equal(withDefaults.rb.input.nymexScreen, null);
assert.equal(withDefaults.rb.input.postedRack, null);
assert.equal(worksheetHasInputs(emptySheet), false);

const typedTax = emptyWorksheet();
typedTax.taxRb = { federal: 30, state: 10 };
const override = applyWorksheetDefaults(typedTax, { state: "TX", saved: typedTax });
assert.equal(override.rb.tax.federal.cents, 30);
assert.equal(override.rb.tax.federal.origin, "typed");
assert.equal(override.rb.tax.state.cents, 10);
assert.equal(override.ho.tax.federal.cents, 24.4);
assert.equal(override.ho.tax.federal.origin, "default");
assert.equal(override.ho.tax.state.cents, 20);

const defaultedBook = computeWorksheet(emptyWorksheet(), { state: "FL" });
assert.equal(defaultedBook.RB.taxFederal, 18.4);
assert.equal(defaultedBook.HO.taxFederal, 24.4);
assert.equal(defaultedBook.RB.taxState, 40.096);
assert.equal(defaultedBook.HO.taxState, 40.971);
assert.equal(defaultedBook.RB.taxIncomplete, false);
assert.equal(defaultedBook.RB.inboundRack, null);
assert.equal(defaultedBook.RB.rungs.find((rung) => rung.key === "freight")?.cents, null);
assert.ok(defaultedBook.RB.takes.every((take) => take.key !== "freight"));
assert.ok(defaultedBook.RB.rungs.some((rung) => rung.key === "taxFederal"));
assert.ok(defaultedBook.RB.rungs.some((rung) => rung.key === "taxState"));

const clearedBook = computeWorksheet(emptyWorksheet(), { state: "TX", applyTaxDefaults: false });
assert.equal(clearedBook.RB.taxFederal, null);
assert.equal(clearedBook.RB.taxState, null);
assert.equal(clearedBook.RB.taxIncomplete, false);

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
assert.equal(boardApplied.rb.input.invoiceDelivered, null);
assert.equal(boardApplied.rb.input.fairHose, null);
assert.equal(boardApplied.ho.input.invoiceDelivered, null);
assert.equal(boardApplied.ho.input.fairHose, null);

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
assert.equal(stripped.taxRb?.state, null);
assert.equal(stripped.rb.dockPosted, null);

const galvestonNotes = deskFootnotes(findArea("galveston-bay"));
assert.ok(!galvestonNotes.some((note) => /Atlanta \/ Birmingham hubs can be added later/i.test(note)));
assert.ok(!galvestonNotes.some((note) => /can be added later/i.test(note)));

const incompleteTax = computeProductNetback(
  "HO",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
  },
  { federal: 18.4, state: null, other: null, oneLine: null },
);
assert.equal(incompleteTax.tax, null);
assert.equal(incompleteTax.taxIncomplete, true);
assert.equal(incompleteTax.dockExTax, null);
assert.equal(incompleteTax.dockRemaining, null);
assert.equal(incompleteTax.dap, null);
assert.equal(incompleteTax.shouldBe, null);
assert.notEqual(incompleteTax.dap, 0);
assert.equal(formatCents(incompleteTax.dockExTax), "—");
assert.equal(formatCents(incompleteTax.dap), "—");
assert.equal(formatCents(incompleteTax.shouldBe), "—");
assert.equal(stepByKey(incompleteTax, "taxFederal")?.cents, 18.4);
assert.equal(resolveTaxForProduct({ federal: 18.4, state: null, other: null, oneLine: null }, "RB").incomplete, true);
const otherMissing = resolveTaxForProduct(
  { federal: 18.4, state: 20, other: null, oneLine: null },
  "RB",
  { state: "TX", applyDefaults: true },
);
assert.equal(otherMissing.incomplete, false);
assert.equal(otherMissing.strip.cents, 38.4);
assert.equal(otherMissing.other.cents, null);
const federalOnlyDefault = resolveTaxForProduct(
  { federal: null, state: null, other: null, oneLine: null },
  "RB",
  { state: "TX", applyDefaults: true },
);
assert.equal(federalOnlyDefault.federal.cents, 18.4);
assert.equal(federalOnlyDefault.state.cents, 20);
assert.equal(federalOnlyDefault.incomplete, false);
assert.equal(federalOnlyDefault.strip.cents, 38.4);
const unverifiedState = resolveTaxForProduct(
  { federal: 18.4, state: null, other: null, oneLine: null },
  "RB",
  { state: "ZZ", applyDefaults: true },
);
assert.equal(unverifiedState.federal.cents, 18.4);
assert.equal(unverifiedState.state.cents, null);
assert.equal(unverifiedState.incomplete, true);
assert.equal(unverifiedState.strip.cents, null);

const loadedTax = applyWorksheetDefaults(emptyWorksheet(), { state: "TX" });
assert.equal(loadedTax.rb.tax.federal.cents, 18.4);
assert.equal(loadedTax.rb.tax.state.cents, 20);
const clearedFederalSheet = worksheetFromFields(
  {
    rack_rb: "230",
    freight_rb: "4",
    hose_rb: "10",
    invoice_rb: "400",
    tax_federal_rb: "",
    tax_state_rb: "20",
    tax_federal_ho: "24.4",
    tax_state_ho: "20",
  },
  "cent",
);
assert.equal(clearedFederalSheet.taxRb?.federal, null);
assert.equal(clearedFederalSheet.taxRb?.state, 20);
assert.equal(clearedFederalSheet.taxRb?.touched, true);
assert.notEqual(clearedFederalSheet.taxRb?.federal, 18.4);
const clearedFederalBook = computeWorksheet(clearedFederalSheet, { state: "TX" });
assert.equal(clearedFederalBook.RB.taxIncomplete, true);
assert.equal(clearedFederalBook.RB.taxFederal, null);
assert.equal(clearedFederalBook.RB.taxState, 20);
assert.notEqual(clearedFederalBook.RB.taxFederal, 18.4);
assert.equal(clearedFederalBook.RB.dap, null);
assert.equal(clearedFederalBook.RB.shouldBe, null);
assert.equal(formatCents(clearedFederalBook.RB.dap), "—");
assert.equal(formatCents(clearedFederalBook.RB.shouldBe), "—");
assert.equal(formatDollars(clearedFederalBook.RB.dap), "—");
assert.notEqual(clearedFederalBook.RB.dap, 0);
assert.equal(clearedFederalBook.HO.taxFederal, 24.4);
assert.equal(clearedFederalBook.HO.taxIncomplete, false);

const clearedStateSheet = {
  ...clearedFederalSheet,
  taxRb: { federal: 18.4, state: null, touched: true as const },
};
const clearedStateBook = computeWorksheet(clearedStateSheet, { state: "TX" });
assert.equal(clearedStateBook.RB.taxIncomplete, true);
assert.equal(clearedStateBook.RB.taxState, null);
assert.notEqual(clearedStateBook.RB.taxState, 20);
assert.equal(clearedStateBook.RB.dap, null);
assert.equal(clearedStateBook.RB.shouldBe, null);

const bothClearedSheet = worksheetFromFields(
  {
    rack_rb: "230",
    freight_rb: "4",
    hose_rb: "10",
    tax_federal_rb: "",
    tax_state_rb: "",
  },
  "cent",
);
assert.equal(bothClearedSheet.taxRb?.touched, true);
const bothClearedBook = computeWorksheet(bothClearedSheet, { state: "TX" });
assert.equal(bothClearedBook.RB.taxIncomplete, true);
assert.equal(bothClearedBook.RB.taxFederal, null);
assert.equal(bothClearedBook.RB.taxState, null);
assert.equal(bothClearedBook.RB.dap, null);
assert.equal(bothClearedBook.RB.shouldBe, null);

const oneLineThenCleared = rememberClearedTax(
  { ...emptyWorksheet(), tax: { federal: null, state: null, other: null, oneLine: null } },
  { ...emptyWorksheet(), tax: { federal: 18.4, state: 20, other: null, oneLine: 62 } },
);
assert.equal(oneLineThenCleared.tax.oneLineCleared, true);
const oneLineClearedBook = computeWorksheet(
  {
    ...oneLineThenCleared,
    rb: { ...oneLineThenCleared.rb, postedRack: 230, inboundFreight: 4, fairHose: 10 },
    taxRb: { federal: 18.4, state: 20, touched: true },
  },
  { state: "TX" },
);
assert.equal(oneLineClearedBook.RB.taxIncomplete, true);
assert.equal(oneLineClearedBook.RB.dap, null);
assert.equal(oneLineClearedBook.RB.shouldBe, null);

const retypedOneLine = rememberClearedTax(
  { ...emptyWorksheet(), tax: { federal: null, state: null, other: null, oneLine: 55 } },
  oneLineThenCleared,
);
assert.equal(retypedOneLine.tax.oneLineCleared, undefined);

const partialKept = stripUnchangedDefaults(
  { ...emptyWorksheet(), taxRb: { federal: null, state: 20, touched: true } },
  "TX",
);
assert.equal(partialKept.taxRb?.federal, null);
assert.equal(partialKept.taxRb?.state, 20);
assert.equal(partialKept.taxRb?.touched, true);

const yahooFill = computeProductNetback(
  "RB",
  {
    nymexScreen: null,
    terminalDiff: 8,
    inboundFreight: null,
    postedRack: null,
    jobberSell: null,
    dockPosted: null,
  },
  { federal: null, state: null, other: null, oneLine: null },
  { nymexFallback: 210 },
);
assert.equal(yahooFill.terminalSpot, 218);
assert.equal(yahooFill.nymexSource, "yahoo");
assert.equal(sourceLabel(stepByKey(yahooFill, "nymex")!), "yahoo");

const typedWins = computeProductNetback(
  "HO",
  {
    nymexScreen: 199,
    terminalDiff: 5,
    inboundFreight: null,
    postedRack: null,
    jobberSell: null,
    dockPosted: null,
  },
  { federal: null, state: null, other: null, oneLine: null },
  { nymexFallback: 210 },
);
assert.equal(typedWins.terminalSpot, 204);
assert.equal(typedWins.nymexSource, "typed");

const zeroFallback = computeProductNetback(
  "RB",
  emptyWorksheet().rb,
  emptyWorksheet().tax,
  { nymexFallback: 0 },
);
assert.equal(zeroFallback.steps[0]?.cents, null);
assert.equal(zeroFallback.nymexSource, null);

const underwater = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 200,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.ok(underwater.dockRemaining != null && underwater.dockRemaining < 0);
assert.equal(underwater.fattestTake, "remaining");
assert.ok(underwater.takes[0]!.cents < 0);
assert.match(formatCents(underwater.dockRemaining), /−/);
assert.equal(netbackHasFigures(underwater), true);
assert.equal(netbackHasFigures(blank.RB), false);

const applied = applyDiffRow(emptyWorksheet(), {
  id: "d1",
  terminalId: "t-76-tx-2809",
  name: "Pasadena vs screen",
  product: "RB",
  centsVsScreen: 12.5,
});
assert.equal(applied.rb.terminalDiff, 12.5);
assert.equal(applied.ho.terminalDiff, null);
assert.equal(applied.rb.nymexScreen, null);

const draftRound = parseWholesaleDraft(serializeWholesaleDraft({ terminalId: "t-76-tx-2809", sheet: applied }));
assert.equal(draftRound?.terminalId, "t-76-tx-2809");
assert.equal(draftRound?.sheet.rb.terminalDiff, 12.5);

assert.equal(NYMEX_YAHOO_TICKERS.RB, "RB=F");
assert.equal(NYMEX_YAHOO_TICKERS.HO, "HO=F");
assert.equal(dollarsPerGalToCents(3.0502), 305.02);
assert.equal(dollarsPerGalToCents(0), null);
assert.equal(isYahooQuoteStale(Date.now() - 6 * 24 * 60 * 60 * 1000, Date.now()), true);

const now = Date.parse("2026-08-30T17:00:00Z");
const yahooOk = parseYahooChart(
  {
    chart: {
      result: [
        {
          meta: {
            currency: "USD",
            symbol: "RB=F",
            regularMarketPrice: 3.0502,
            regularMarketTime: Date.parse("2026-08-28T20:59:58Z") / 1000,
            shortName: "RBOB Gasoline Oct 26",
          },
        },
      ],
      error: null,
    },
  },
  "RB",
  now,
);
assert.equal(yahooOk.status, "ok");
assert.equal(yahooOk.cents, 305.02);

const yahooStale = parseYahooChart(
  {
    chart: {
      result: [
        {
          meta: {
            currency: "USD",
            symbol: "HO=F",
            regularMarketPrice: 4.249,
            regularMarketTime: Date.parse("2026-08-20T20:59:56Z") / 1000,
            shortName: "Heating Oil Oct 26",
          },
        },
      ],
      error: null,
    },
  },
  "HO",
  now,
);
assert.equal(yahooStale.status, "stale");
assert.equal(yahooStale.cents, null);

const yahooZero = parseYahooChart(
  {
    chart: {
      result: [{ meta: { currency: "USD", symbol: "RB=F", regularMarketPrice: 0, regularMarketTime: now / 1000 } }],
      error: null,
    },
  },
  "RB",
  now,
);
assert.equal(yahooZero.status, "unparseable");
assert.equal(yahooZero.cents, null);

const partial = worksheetFromFields({ nymex_rb: "210" }, "cent");
assert.equal(partial.rb.nymexScreen, 210);
assert.equal(partial.rb.postedRack, null);
assert.equal(partial.ho.nymexScreen, null);
const partialBook = computeWorksheet(partial);
assert.equal(partialBook.RB.terminalSpot, null);
assert.equal(formatCents(partialBook.RB.rackMargin), "—");

const deskSource = readFileSync(path.join(process.cwd(), "src/app/wholesale/desk.tsx"), "utf8");
const wholesalePage = readFileSync(path.join(process.cwd(), "src/app/wholesale/page.tsx"), "utf8");
const printPage = readFileSync(path.join(process.cwd(), "src/app/wholesale/print/page.tsx"), "utf8");
assert.match(deskSource, />Wholesale</);
assert.match(deskSource, /What it cost\. What they posted\./);
assert.match(deskSource, /Continue/);
assert.match(deskSource, /What it should have been\./);
assert.match(deskSource, /Fair hose\./);
assert.match(deskSource, /Invoice \/ delivered/);
assert.match(deskSource, /Fat\s+take is invoice versus posted rack, not posted pump/);
assert.doesNotMatch(deskSource, /Come in/);
assert.doesNotMatch(deskSource, /Where the cents went/);
assert.doesNotMatch(deskSource, /The take/);
assert.doesNotMatch(deskSource, /The book/);
assert.doesNotMatch(deskSource, /Open the book/);
assert.doesNotMatch(deskSource, /hacking the gallon/);
assert.doesNotMatch(deskSource, /Investor print/);
assert.doesNotMatch(deskSource, /Sign in to dashboard/);
assert.doesNotMatch(deskSource, /silly|gotcha|bargain|call-out|shame/i);
assert.doesNotMatch(deskSource, /posted − should-be|posted - should-be|posted − DAP|posted - DAP/);
assert.match(wholesalePage, /How the gallon got that way\./);
assert.doesNotMatch(wholesalePage, /The take/);
assert.doesNotMatch(wholesalePage, /Come in/);
assert.doesNotMatch(wholesalePage, /Where the cents went/);
assert.match(printPage, /Wholesale · /);
assert.doesNotMatch(printPage, /This week.s sheet/);
assert.doesNotMatch(printPage, /The book/);
assert.doesNotMatch(printPage, /Investor/);
assert.equal(filled.rungs.find((rung) => rung.key === "taxFederal")?.label, "Federal tax");
assert.equal(filled.rungs.find((rung) => rung.key === "taxState")?.label, "State tax");
assert.equal(filled.rungs.find((rung) => rung.key === "shouldBe")?.label, "What it should have been.");
assert.equal(filled.rungs.find((rung) => rung.key === "fairHose")?.label, "Fair hose.");

const costSheet = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
    fairHose: 10,
    invoiceDelivered: 400,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.equal(costSheet.dap, 274);
assert.equal(costSheet.shouldBe, 284);
assert.equal(costSheet.fatTake, 170);
assert.equal(fatTakeCents(400, 230), 170);
assert.equal(
  deliveredAtPlace(
    {
      nymexScreen: 200,
      terminalDiff: 8,
      inboundFreight: 4,
      postedRack: 230,
      jobberSell: 245,
      dockPosted: 360,
      fairHose: 10,
      invoiceDelivered: 400,
    },
    200,
    40,
    false,
  ),
  274,
);
assert.notEqual(costSheet.fatTake, 360 - 284, "fat take is not posted − should-be");
assert.notEqual(costSheet.fatTake, 360 - 274, "fat take is not posted − DAP");
assert.equal(costSheet.postedVsDap, 86);
assert.equal(costSheet.dockRemaining, 75);
assert.equal(costSheet.rackMargin, 18);
assert.equal(costSheet.fattestTake, "fatTake");
assert.ok(costSheet.takes.some((take) => take.key === "fatTake" && take.cents === 170));
assert.ok(costSheet.rungs.some((rung) => rung.key === "taxFederal"));
assert.ok(costSheet.rungs.some((rung) => rung.key === "shouldBe" && rung.cents === 284));
const shouldBeAt = costSheet.rungs.findIndex((rung) => rung.key === "shouldBe");
const remainingAt = costSheet.rungs.findIndex((rung) => rung.key === "remaining");
const taxAt = costSheet.rungs.findIndex((rung) => rung.key === "taxState");
assert.ok(taxAt < shouldBeAt && shouldBeAt < remainingAt, "should-be sits after tax and before leftover");

const noHose = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
    fairHose: null,
    invoiceDelivered: 280,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.equal(noHose.dap, 274);
assert.equal(noHose.shouldBe, null);
assert.equal(formatCents(noHose.shouldBe), "—");
assert.equal(noHose.fatTake, 50, "fat take is invoice − rack even when hose is blank");
assert.notEqual(noHose.fatTake, 360 - 274);

const noInvoice = computeProductNetback(
  "HO",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
    fairHose: 12,
    invoiceDelivered: null,
  },
  { federal: 24.4, state: 20, other: null, oneLine: null },
);
assert.equal(noInvoice.shouldBe, 230 + 4 + 44.4 + 12);
assert.equal(noInvoice.fatTake, null);
assert.equal(formatCents(noInvoice.fatTake), "—");
assert.ok(!noInvoice.takes.some((take) => take.key === "fatTake"));

const underInvoice = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
    fairHose: 10,
    invoiceDelivered: 200,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.equal(underInvoice.fatTake, -30);
assert.ok(!underInvoice.takes.some((take) => take.key === "fatTake"), "negative fat take stays quiet");
assert.equal(underInvoice.fattestTake, "remaining");

const incompleteWithHose = computeProductNetback(
  "HO",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: 230,
    jobberSell: 245,
    dockPosted: 360,
    fairHose: 15,
    invoiceDelivered: 300,
  },
  { federal: 18.4, state: null, other: null, oneLine: null },
);
assert.equal(incompleteWithHose.taxIncomplete, true);
assert.equal(incompleteWithHose.dap, null);
assert.equal(incompleteWithHose.shouldBe, null);
assert.equal(incompleteWithHose.fatTake, 70);
assert.notEqual(incompleteWithHose.dap, 0);
assert.equal(formatCents(incompleteWithHose.dap), "—");
assert.equal(formatCents(incompleteWithHose.shouldBe), "—");

const nymexPathDap = computeProductNetback(
  "RB",
  {
    nymexScreen: 200,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: null,
    jobberSell: null,
    dockPosted: null,
    fairHose: 6,
    invoiceDelivered: null,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
);
assert.equal(nymexPathDap.dap, 200 + 8 + 4 + 40);
assert.equal(nymexPathDap.shouldBe, 258);
assert.equal(nymexPathDap.fatTake, null);

const yahooDap = computeProductNetback(
  "RB",
  {
    nymexScreen: null,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: null,
    jobberSell: null,
    dockPosted: null,
    fairHose: 5,
    invoiceDelivered: null,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
  { nymexFallback: 210 },
);
assert.equal(yahooDap.nymexSource, "yahoo");
assert.equal(yahooDap.dap, 210 + 8 + 4 + 40);
assert.equal(yahooDap.shouldBe, 267);

const yahooFailDap = computeProductNetback(
  "RB",
  {
    nymexScreen: null,
    terminalDiff: 8,
    inboundFreight: 4,
    postedRack: null,
    jobberSell: null,
    dockPosted: null,
    fairHose: 5,
    invoiceDelivered: null,
  },
  { federal: 18.4, state: 21.6, other: null, oneLine: null },
  { nymexFallback: null },
);
assert.equal(yahooFailDap.dap, null);
assert.equal(yahooFailDap.shouldBe, null);

const fromFields = worksheetFromFields(
  { hose_rb: "11", invoice_ho: "255", rack_rb: "230" },
  "cent",
);
assert.equal(fromFields.rb.fairHose, 11);
assert.equal(fromFields.rb.invoiceDelivered, null);
assert.equal(fromFields.ho.invoiceDelivered, 255);
assert.equal(fromFields.rb.postedRack, 230);

const publicPages = [
  "src/app/page.tsx",
  "src/app/haul-out/page.tsx",
  "src/app/report/page.tsx",
  "src/app/safe-fuel/page.tsx",
  "src/app/wholesale/layout.tsx",
  "src/components/dock-board.tsx",
  "src/components/dock-card.tsx",
  "src/components/fuel-map.tsx",
];
const publicLeak = /should-be|Fair hose|invoice \/ delivered|nymex|\bTCN\b|platts|n8n|riodata2026/i;
for (const file of publicPages) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, publicLeak, `${file} leaked a wholesale cost-sheet term`);
}
assert.match(readFileSync(path.join(process.cwd(), "src/app/wholesale/desk.tsx"), "utf8"), /LoginPanel/);
const loginSlice = deskSource.slice(deskSource.indexOf("export function LoginPanel"), deskSource.length);
assert.doesNotMatch(loginSlice, /should-be|Fair hose|\binvoice\b|nymex|\brack\b|\bTCN\b|Platts/i);

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
