import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
  computeDerivedMarinaLandedCost,
  computeProductNetback,
  computeWorksheet,
  deliveredAtPlace,
  derivedLegBlankText,
  fatTakeCents,
  formatDerivedCents,
  jobberOnStack,
  postedLeftoverCents,
  PRESSURE_LADDER_KEYS,
  RIN_STACK_NOTE,
  defaultTaxForTerminal,
  deskFootnotes,
  emptyWorksheet,
  findArea,
  findTerminal,
  formatCents,
  formatDockDollars,
  formatDollars,
  loadWholesaleCatalog,
  loadWholesaleTax,
  marinaPitchReady,
  marinaPostedNumber,
  netbackHasFigures,
  pickMarinaPitchProduct,
  parseOptionalCents,
  rankTakes,
  resolveTaxForProduct,
  sourceLabel,
  stepByKey,
  rememberClearedTax,
  stripUnchangedDefaults,
  subCents,
  sumDerivedAddLegs,
  taxCents,
  westFloridaSpotKey,
  tcnLabel,
  terminalsForArea,
  worksheetFromFields,
  worksheetHasInputs,
} from "../src/lib/wholesale";
import { renderToStaticMarkup } from "react-dom/server";
import { DerivedEstimate } from "../src/app/wholesale/derived-estimate";
import {
  AIRTABLE_PLATTS_TOKEN_ENV,
  OUTRIGHT_MISMATCH_CENTS,
  PLATTS_AIRTABLE_BASE_ID,
  PLATTS_AIRTABLE_FIELDS,
  PLATTS_AIRTABLE_TABLE_ID,
  latestPlattsRecord,
  loadPlattsDailyRow,
  outrightGap,
  plattsRowFromAirtableFields,
  plattsRowIsStale,
} from "../src/lib/platts-daily";
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
assert.equal(galvRb.cents, 483);
assert.match(galvRb.label, /from the board/);
assert.ok(galvHo);
assert.equal(galvHo.cents, 633);
assert.equal(boardDockDefault(docks, "keys", "RB"), null);
assert.equal(boardDockDefault(docks, "keys", "HO"), null);
assert.equal(boardDockDefault(docks, "upper-keys", "RB"), null);

const boardApplied = applyWorksheetDefaults(emptyWorksheet(), {
  state: "TX",
  areaId: "galveston-bay",
  docks,
});
assert.equal(boardApplied.rb.input.dockPosted, 483);
assert.equal(boardApplied.rb.origins.dockPosted, "board");
assert.equal(boardApplied.ho.input.dockPosted, 633);
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
    rb: { ...emptyWorksheet().rb, dockPosted: 483 },
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
assert.equal(marinaPitchReady(blank.RB), false);

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
const shortPathSource = readFileSync(path.join(process.cwd(), "src/app/wholesale/short-path.tsx"), "utf8");
const deskUi = `${deskSource}\n${shortPathSource}`;
const wholesalePage = readFileSync(path.join(process.cwd(), "src/app/wholesale/page.tsx"), "utf8");
const printPage = readFileSync(path.join(process.cwd(), "src/app/wholesale/print/page.tsx"), "utf8");
const tearSheetSource = readFileSync(path.join(process.cwd(), "src/app/wholesale/print/tear-sheet.tsx"), "utf8");
const fullBookSource = readFileSync(path.join(process.cwd(), "src/app/wholesale/print/full-book.tsx"), "utf8");
const globalCss = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(deskSource, />Wholesale</);
assert.match(deskSource, /What it cost\. What they posted\./);
assert.match(deskSource, /Continue/);
assert.match(deskUi, /What it should have been\./);
assert.match(deskUi, /Fair hose\./);
assert.match(deskUi, /Invoice \/ delivered/);
assert.match(deskUi, /Fat\s+take is invoice versus posted rack, not posted pump/);
assert.doesNotMatch(shortPathSource, /['"]use client['"]/);
assert.match(deskUi, /data-testid="short-path"/);
assert.match(deskUi, /data-testid="full-stack"/);
assert.match(deskUi, /data-testid=\{`fat-take-\$\{p\}`\}/);
assert.match(deskUi, /data-testid="product-ho"/);
assert.match(deskUi, /Diesel stays dark until you open it/);
assert.match(deskUi, /posted vs should-be/);
assert.match(deskUi, /not the pitch/);
assert.match(deskUi, /invoice − posted rack/);
assert.match(deskUi, /Net to retail/);
assert.match(deskUi, /net to the retail \/ posted pump/);
assert.match(deskUi, /Terminal \/ pipe/);
assert.match(deskUi, /Inbound rack cost/);

const productShortPath = shortPathSource.slice(
  shortPathSource.indexOf("function ProductShortPath"),
  shortPathSource.indexOf("function PressureLadder"),
);
assert.match(productShortPath, /data-testid=\{`tax-strip-\$\{p\}`\}/);
assert.match(productShortPath, /data-testid=\{`net-to-retail-\$\{p\}`\}/);
assert.match(productShortPath, /data-testid=\{`net-dap-\$\{p\}`\}/);
assert.match(productShortPath, /data-testid=\{`net-should-be-\$\{p\}`\}/);
assert.match(productShortPath, /label="Federal tax"/);
assert.match(productShortPath, /label="State tax"/);
assert.match(productShortPath, /formatBoth\(book\.dap\)/);
assert.match(productShortPath, /formatBoth\(book\.shouldBe\)/);
assert.match(productShortPath, /What the retail \/ posted pump should have been/);
assert.match(productShortPath, /The net-to-retail check/);
assert.ok(
  !productShortPath.includes('data-testid="full-stack"'),
  "tax strip and net-to-retail stand on the short path without opening Full stack",
);
assert.ok(
  productShortPath.indexOf("data-testid={`net-to-retail-${p}`}") >
    productShortPath.indexOf("data-testid={`fat-take-${p}`}"),
  "net to retail sits after fat take on the short path",
);
const taxStrip = productShortPath.slice(
  productShortPath.indexOf("data-testid={`tax-strip-${p}`}"),
  productShortPath.indexOf('label="Posted rack"'),
);
assert.match(taxStrip, /label="Federal tax"/);
assert.match(taxStrip, /label="State tax"/);
assert.match(taxStrip, /\bprimary\b/);
assert.doesNotMatch(taxStrip, /\bquiet\b/, "federal/state tax must not be quiet-buried on the short path");
assert.match(productShortPath, /data-testid=\{`tax-incomplete-\$\{p\}`\}/);
const netRetail = productShortPath.slice(productShortPath.indexOf("data-testid={`net-to-retail-${p}`}"));
assert.match(netRetail, /formatBoth\(book\.dap\)/);
assert.match(netRetail, /formatBoth\(inputs\.fairHose\)/);
assert.match(netRetail, /formatBoth\(book\.shouldBe\)/);
assert.match(netRetail, /posted vs should-be/);
assert.match(shortPathSource, /<details[\s\S]*data-testid="full-stack"/);
assert.match(shortPathSource, /data-rung="pipe"[\s\S]*data-rung="freight"[\s\S]*rung="inbound"[\s\S]*data-rung="postedRack"[\s\S]*data-rung="jobber"[\s\S]*data-rung="tax"[\s\S]*rung="dap"[\s\S]*data-rung="fairHose"[\s\S]*data-rung="invoice"[\s\S]*data-rung="leftover"/);
assert.deepEqual([...PRESSURE_LADDER_KEYS], [
  "pipe",
  "freight",
  "inbound",
  "postedRack",
  "jobber",
  "tax",
  "dap",
  "fairHose",
  "invoice",
  "leftover",
]);
assert.match(shortPathSource, /RIN_STACK_NOTE/);
assert.match(
  readFileSync(path.join(process.cwd(), "src/lib/wholesale.ts"), "utf8"),
  /RVO \/ RIN is already inside the typed DAP and posted rack/,
);
assert.equal(RIN_STACK_NOTE.includes("Not a second RIN line"), true);
assert.doesNotMatch(deskUi, /Waterdog RIN|live RIN|name="rin"|OPIS RIN|Platts RIN/i);
assert.doesNotMatch(deskUi, /riodata2026|\bn8n\b/i);
assert.doesNotMatch(deskUi, /Come in/);
assert.doesNotMatch(deskUi, /Where the cents went/);
assert.doesNotMatch(deskUi, /The take/);
assert.doesNotMatch(deskUi, /The book/);
assert.doesNotMatch(deskUi, /Open the book/);
assert.doesNotMatch(deskUi, /hacking the gallon/);
assert.doesNotMatch(deskUi, /Investor print/);
assert.doesNotMatch(deskUi, /Sign in to dashboard/);
assert.doesNotMatch(deskUi, /silly|gotcha|bargain|call-out|shame/i);
assert.doesNotMatch(deskUi, /posted − should-be|posted - should-be|posted − DAP|posted - DAP/);
assert.doesNotMatch(deskUi, /fat take is posted|fat take = posted/i);
assert.match(deskSource, /TearSheetControl/);
assert.match(deskSource, /marinaPitchReady/);
assert.match(deskSource, /tear-sheet-disabled/);
assert.doesNotMatch(deskSource, /href=\{`\/wholesale\/print\?area=\$\{areaId\}`\}/);
assert.match(wholesalePage, /How the gallon got that way\./);
assert.doesNotMatch(wholesalePage, /<Waterfall/);
assert.match(wholesalePage, /rb=\{live\.RB\}/);
assert.doesNotMatch(wholesalePage, /The take/);
assert.doesNotMatch(wholesalePage, /Come in/);
assert.doesNotMatch(wholesalePage, /Where the cents went/);
assert.match(printPage, /marinaPitchReady/);
assert.match(printPage, /TearSheet/);
assert.match(printPage, /parsePrintView/);
assert.doesNotMatch(printPage, /This week.s sheet/);
assert.doesNotMatch(printPage, /The book/);
assert.doesNotMatch(printPage, /Investor/);
assert.match(tearSheetSource, /Fat take/);
assert.match(tearSheetSource, /What it should have been/);
assert.match(tearSheetSource, /Dock Posted · Waterdog 2027/);
assert.match(tearSheetSource, /No Platts\. No OPIS/);
assert.match(tearSheetSource, /print-full-book/);
assert.match(tearSheetSource, /print:hidden/);
assert.doesNotMatch(tearSheetSource, /Investor/);
assert.doesNotMatch(tearSheetSource, /NYMEX/);
assert.match(fullBookSource, /Wholesale · /);
assert.match(fullBookSource, /print-matrix/);
assert.doesNotMatch(fullBookSource, /Investor/);
assert.match(globalCss, /@media print/);
assert.match(globalCss, /size: letter/);
assert.match(globalCss, /\.tear-sheet/);
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
assert.equal(marinaPitchReady(costSheet), true);
assert.equal(marinaPitchReady(filled), false, "investor figures are not a marina pitch");
assert.equal(netbackHasFigures(filled), true);
assert.equal(formatDockDollars(170), "$1.70");
assert.equal(formatDockDollars(18.4), "$0.184");
assert.equal(formatDockDollars(-30), "−$0.30");
assert.equal(formatDockDollars(null), "—");
assert.equal(marinaPostedNumber(costSheet).kind, "pump");
assert.equal(marinaPostedNumber(costSheet).cents, 360);
assert.equal(pickMarinaPitchProduct({ RB: costSheet, HO: blank.HO }, "HO"), "RB");
assert.equal(pickMarinaPitchProduct({ RB: filled, HO: blank.HO }), "HO");
assert.notEqual(costSheet.fatTake, 360 - 274, "fat take is not posted − DAP");
assert.equal(postedLeftoverCents(360, 284), 76);
assert.equal(postedLeftoverCents(360, null), null);
assert.equal(formatCents(postedLeftoverCents(360, null)), "—");
assert.notEqual(costSheet.fatTake, postedLeftoverCents(360, 284), "fat take is not posted leftover");
assert.equal(jobberOnStack(400, 245), null);
assert.equal(jobberOnStack(null, 245), 245);
assert.equal(jobberOnStack(null, null), null);
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
assert.equal(marinaPitchReady(noHose), false, "fat take alone is not a marina pitch");
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
assert.equal(marinaPitchReady(noInvoice), false, "should-be alone is not a marina pitch");
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
assert.equal(marinaPitchReady(underInvoice), true, "a negative fat take is still a filled pitch");

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
assert.equal(marinaPitchReady(incompleteWithHose), false);
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
const publicLeak = /should-be|Fair hose|invoice \/ delivered|nymex|\bTCN\b|platts|n8n|riodata2026|\bRIN\b/i;
for (const file of publicPages) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, publicLeak, `${file} leaked a wholesale cost-sheet term`);
}
assert.match(readFileSync(path.join(process.cwd(), "src/app/wholesale/desk.tsx"), "utf8"), /LoginPanel/);
const loginSlice = deskSource.slice(deskSource.indexOf("export function LoginPanel"), deskSource.length);
assert.doesNotMatch(loginSlice, /should-be|Fair hose|\binvoice\b|nymex|\brack\b|\bTCN\b|Platts|\bRIN\b/i);
assert.doesNotMatch(loginSlice, /DERIVED ESTIMATE|Platts row unavailable|AIRTABLE_PLATTS/);

assert.equal(formatCents(229.99999999999997), "230.00 ¢/gal");
assert.equal(formatDollars(229.99999999999997), "$2.3000/gal");
assert.doesNotMatch(formatCents(229.99999999999997), /999999/);
assert.equal(formatDerivedCents(22.125), "22.125 ¢/gal");
assert.equal(formatDerivedCents(0), "0.00 ¢/gal");
assert.equal(formatDerivedCents(null), "—");
assert.equal(existsSync(path.join(process.cwd(), "data/platts-daily-seed.json")), false);

async function derivedChecks() {
  // Synthetic stand-in for a Platts Daily payload. These decimals are not a licensed print.
  const syntheticOlder = {
    DateKey: "2026-09-30",
    NYMEX_RB_Implied: 101.11,
    NYMEX_HO_Implied: 202.22,
    GC_CBOB_Diff: 11.11,
    GC_CBOB93_Diff: 22.22,
    GC_ULSD_Diff: 33.33,
    TPA_CBOB_Diff: 12.12,
    TPA_ULSD_Diff: 13.13,
    TPA_PRE_Diff: 14.14,
    GC_CBOB_Out: 112.22,
    GC_CBOB93_Out: 123.33,
    GC_ULSD_Out: 235.55,
    TPA_CBOB_Out: 113.23,
    TPA_PRE_Out: 115.25,
    TPA_ULSD_Out: 215.35,
  };
  const syntheticLatest = {
    ...syntheticOlder,
    DateKey: "2026-10-05",
    NYMEX_RB_Implied: "101.11",
    GC_CBOB_Out: "112.30",
    TPA_PRE_Out: 115.4,
  };
  const mockedAirtableBody = {
    records: [
      { id: "recOlder", fields: syntheticOlder },
      { id: "recLatest", fields: syntheticLatest },
    ],
  };

  const realPrints = [
    ["327", "99"],
    ["372", "99"],
    ["448", "36"],
    ["340", "24"],
    ["331", "24"],
    ["450", "11"],
    ["41", "75"],
    ["-3", "25"],
    ["-1", "75"],
  ].map((parts) => parts.join("."));
  const feedDecimals = decimalNeedles(mockedAirtableBody);
  assert.ok(feedDecimals.length >= 8);
  for (const file of walkRepo(process.cwd())) {
    const text = readText(file);
    if (text == null) continue;
    for (const needle of realPrints) {
      const hit = new RegExp(`(?<![A-Za-z0-9.])${needle.replace(".", "\\.")}(?![0-9])`).test(text);
      assert.equal(hit, false, `${path.relative(process.cwd(), file)} contains a licensed print`);
    }
    if (path.relative(process.cwd(), file) === "scripts/test-wholesale.ts") continue;
    for (const needle of feedDecimals) {
      assert.equal(
        new RegExp(`(?<![0-9.])${needle.replace(".", "\\.")}(?![0-9])`).test(text),
        false,
        `${path.relative(process.cwd(), file)} contains a mocked feed value`,
      );
    }
  }

  assert.equal(outrightGap(110.05, 100, 10), 0.05);
  assert.equal(outrightGap(110.05, 100, 10) > OUTRIGHT_MISMATCH_CENTS, false);
  assert.equal(outrightGap(110.06, 100, 10) > OUTRIGHT_MISMATCH_CENTS, true);
  assert.equal(plattsRowIsStale("2026-10-05", "2026-10-06"), false);
  assert.equal(plattsRowIsStale("2026-10-02", "2026-10-05"), false);
  assert.equal(plattsRowIsStale("2026-10-02", "2026-10-06"), true);
  assert.equal(AIRTABLE_PLATTS_TOKEN_ENV, "AIRTABLE_PLATTS_TOKEN");
  assert.equal(PLATTS_AIRTABLE_FIELDS.dateKey, "DateKey");
  assert.equal(PLATTS_AIRTABLE_FIELDS.nymexRbImplied, "NYMEX_RB_Implied");
  assert.equal(PLATTS_AIRTABLE_FIELDS.nymexHoImplied, "NYMEX_HO_Implied");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcCbobDiff, "GC_CBOB_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcCbob93Diff, "GC_CBOB93_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcUlsdDiff, "GC_ULSD_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaCbobDiff, "TPA_CBOB_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaUlsdDiff, "TPA_ULSD_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaPreDiff, "TPA_PRE_Diff");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcCbobOut, "GC_CBOB_Out");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcCbob93Out, "GC_CBOB93_Out");
  assert.equal(PLATTS_AIRTABLE_FIELDS.gcUlsdOut, "GC_ULSD_Out");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaCbobOut, "TPA_CBOB_Out");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaPreOut, "TPA_PRE_Out");
  assert.equal(PLATTS_AIRTABLE_FIELDS.tpaUlsdOut, "TPA_ULSD_Out");

  const cleanRow = plattsRowFromAirtableFields(syntheticOlder);
  assert.ok(cleanRow);
  assert.equal(cleanRow.gcCbob.out, syntheticOlder.GC_CBOB_Out);
  assert.equal(cleanRow.gcCbob.flagged, false);
  assert.equal(cleanRow.tpaUlsd.out, syntheticOlder.TPA_ULSD_Out);
  assert.equal(cleanRow.tpaPre.flagged, false);

  const blankTyped = {
    RB: { invoiceCents: null, rackCents: null },
    HO: { invoiceCents: null, rackCents: null },
  };
  const derivedBook = computeDerivedMarinaLandedCost({
    docks,
    row: cleanRow,
    typed: blankTyped,
    todayKey: "2026-10-06",
    stale: false,
    rowSource: "airtable",
    rowNote: "synthetic",
  });
  assert.equal(derivedBook.label, "DERIVED ESTIMATE");
  assert.equal(derivedBook.outrightFlag, false);
  assert.deepEqual(
    derivedBook.docks.map((dock) => dock.dockId),
    [
      "galveston-yacht-marina",
      "madeira-beach-municipal-marina",
      "st-augustine-municipal-marina",
      "lambs-yacht-center",
    ],
  );
  assert.ok(derivedBook.docks.every((dock) => !/california|pacific/i.test(dock.dockId)));
  assert.equal(westFloridaSpotKey("premium"), "tpaPre");
  assert.equal(westFloridaSpotKey("gasoline"), "tpaCbob");
  assert.equal(westFloridaSpotKey("diesel"), "tpaUlsd");
  assert.ok(derivedBook.docks.every((dock) => dock.products.every((product) => product.spotKey !== "tpaPre")));

  const galveston = derivedBook.docks[0]!;
  const regular = galveston.products.find((product) => product.product === "87")!;
  const premium = galveston.products.find((product) => product.product === "93")!;
  const galvestonDiesel = galveston.products.find((product) => product.product === "diesel")!;
  assert.equal(regular.approximate, false);
  assert.equal(regular.spotKey, "gcCbob");
  assert.equal(regular.legs.find((leg) => leg.key === "spot")?.cents, syntheticOlder.GC_CBOB_Out);
  assert.equal(premium.approximate, true);
  assert.equal(premium.spotKey, "gcCbob93");
  assert.equal(premium.legs.find((leg) => leg.key === "spot")?.cents, syntheticOlder.GC_CBOB93_Out);
  assert.equal(galvestonDiesel.spotKey, "gcUlsd");
  assert.equal(galvestonDiesel.legs.find((leg) => leg.key === "spot")?.cents, syntheticOlder.GC_ULSD_Out);
  assert.equal(galvestonDiesel.dieselFlag?.estimateUsed, "undyed-clear");
  assert.match(galvestonDiesel.dieselFlag?.notApplied ?? "", /noncommercial vessel/i);
  assert.equal(regular.postedPumpCents, postedCents("galveston-yacht-marina", "87"));
  assert.equal(premium.postedPumpCents, postedCents("galveston-yacht-marina", "93"));
  assert.equal(galvestonDiesel.postedPumpCents, postedCents("galveston-yacht-marina", "diesel"));
  for (const product of galveston.products) {
    const freight = product.legs.find((leg) => leg.key === "marinePipelineFreight")!;
    assert.equal(freight.disposition, "not_on_path");
    assert.equal(freight.cents, null);
    assert.equal(freight.blank, null);
    assert.match(freight.note, /Colonial/);
    for (const key of ["terminalThroughput", "truckFreight"] as const) {
      const leg = product.legs.find((item) => item.key === key)!;
      assert.equal(leg.cents, null);
      assert.equal(leg.blank, "not sourced");
      assert.notEqual(leg.cents, 0);
      assert.equal(derivedLegBlankText(leg), `${leg.label} — not sourced`);
    }
    assert.equal(product.legs.find((leg) => leg.key === "federalTax")?.cents, product.product === "diesel" ? 24.4 : 18.4);
    assert.equal(product.legs.find((leg) => leg.key === "stateTax")?.cents, 20);
    const local = product.legs.find((leg) => leg.key === "localTax")!;
    assert.equal(local.cents, 0);
    assert.equal(local.blank, null);
    assert.ok(local.sourceUrl);
    assert.equal(product.legs.find((leg) => leg.key === "invoice")?.blank, "not typed");
    assert.equal(product.legs.find((leg) => leg.key === "rack")?.blank, "not typed");
    assert.equal(product.dapComplete, false);
    assert.equal(product.dapCents, null);
    assert.notEqual(product.dapCents, 0);
    assert.equal(product.impliedMarginCents, null);
    assert.equal(product.fatTakeStatus, "NO CALL");
    assert.equal(product.fatTakeCents, null);
  }

  const madeira = derivedBook.docks[1]!;
  const madeiraGas = madeira.products.find((product) => product.product === "gasoline")!;
  const madeiraDiesel = madeira.products.find((product) => product.product === "diesel")!;
  assert.equal(madeiraGas.approximate, true);
  assert.equal(madeiraGas.spotKey, "tpaCbob");
  assert.equal(madeiraGas.legs.find((leg) => leg.key === "spot")?.cents, syntheticOlder.TPA_CBOB_Out);
  assert.equal(madeiraGas.legs.find((leg) => leg.key === "marinePipelineFreight")?.disposition, "embedded");
  assert.equal(madeiraGas.legs.find((leg) => leg.key === "marinePipelineFreight")?.cents, null);
  assert.equal(madeiraGas.postedPumpCents, postedCents("madeira-beach-municipal-marina", "gasoline"));
  assert.equal(madeiraGas.legs.find((leg) => leg.key === "stateTax")?.cents, 22.125);
  assert.equal(madeiraGas.legs.find((leg) => leg.key === "localTax")?.cents, 16.9);
  assert.equal(madeiraDiesel.spotKey, "tpaUlsd");
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "spot")?.cents, syntheticOlder.TPA_ULSD_Out);
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "marinePipelineFreight")?.disposition, "embedded");
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "marinePipelineFreight")?.blank, null);
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "federalTax")?.cents, 24.4);
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "stateTax")?.cents, 22);
  assert.equal(madeiraDiesel.legs.find((leg) => leg.key === "localTax")?.cents, 16.9);
  assert.equal(madeiraDiesel.postedPumpCents, postedCents("madeira-beach-municipal-marina", "diesel"));
  assert.doesNotMatch(madeira.gaps.join(" "), /Marine \/ pipeline freight — not sourced/);

  const augustine = derivedBook.docks[2]!;
  const augustineGas = augustine.products.find((product) => product.product === "gasoline")!;
  assert.equal(augustineGas.approximate, true);
  assert.equal(augustineGas.spotKey, "gcCbob");
  assert.equal(augustineGas.legs.find((leg) => leg.key === "marinePipelineFreight")?.blank, "not sourced");
  assert.equal(augustineGas.legs.find((leg) => leg.key === "localTax")?.cents, 15.9);
  assert.equal(augustineGas.postedPumpCents, postedCents("st-augustine-municipal-marina", "gasoline"));
  assert.equal(augustine.products.find((product) => product.product === "diesel")?.postedPumpCents, postedCents("st-augustine-municipal-marina", "diesel"));

  const lambs = derivedBook.docks[3]!;
  const lambsGas = lambs.products.find((product) => product.product === "90")!;
  assert.equal(lambsGas.approximate, true);
  assert.equal(lambsGas.spotKey, "gcCbob");
  assert.match(lambsGas.matchNote, /not CBOB93/);
  assert.equal(lambsGas.legs.find((leg) => leg.key === "localTax")?.cents, 21.9);
  assert.equal(lambsGas.postedPumpCents, postedCents("lambs-yacht-center", "90"));
  assert.equal(lambs.products.find((product) => product.product === "diesel")?.postedPumpCents, postedCents("lambs-yacht-center", "diesel"));
  assert.match(lambs.gaps.join(" "), /Truck freight — not sourced/);
  assert.match(lambs.gaps.join(" "), /Invoice — not typed/);
  assert.match(lambs.gaps.join(" "), /Posted rack — not typed/);
  assert.doesNotMatch(lambsGas.gaps.join(" "), /Local tax/);

  const typedBook = computeDerivedMarinaLandedCost({
    docks,
    row: cleanRow,
    typed: {
      RB: { invoiceCents: 400, rackCents: 230 },
      HO: { invoiceCents: null, rackCents: 210 },
    },
    todayKey: "2026-10-06",
    stale: false,
    rowSource: "airtable",
    rowNote: "synthetic",
  });
  const typedRegular = typedBook.docks[0]!.products.find((product) => product.product === "87")!;
  const typedDiesel = typedBook.docks[0]!.products.find((product) => product.product === "diesel")!;
  assert.equal(typedRegular.legs.find((leg) => leg.key === "invoice")?.cents, 400);
  assert.equal(typedRegular.legs.find((leg) => leg.key === "rack")?.cents, 230);
  assert.equal(typedRegular.fatTakeStatus, "typed");
  assert.equal(typedRegular.fatTakeCents, 170);
  assert.equal(typedRegular.dapCents, null);
  assert.notEqual(typedRegular.legs.find((leg) => leg.key === "rack")?.cents, typedRegular.legs.find((leg) => leg.key === "spot")?.cents);
  assert.equal(typedDiesel.fatTakeStatus, "NO CALL");
  assert.equal(typedDiesel.legs.find((leg) => leg.key === "invoice")?.blank, "not typed");
  assert.equal(typedDiesel.legs.find((leg) => leg.key === "rack")?.cents, 210);

  const missingOut: Record<string, unknown> = { ...syntheticOlder };
  delete missingOut.GC_CBOB_Out;
  const missingRow = plattsRowFromAirtableFields(missingOut);
  assert.ok(missingRow);
  assert.equal(missingRow.gcCbob.out, null);
  assert.notEqual(missingRow.gcCbob.out, 0);
  assert.equal(missingRow.gcCbob.flagged, false);
  const missingBook = computeDerivedMarinaLandedCost({
    docks,
    row: missingRow,
    typed: blankTyped,
    todayKey: "2026-10-06",
    stale: false,
    rowSource: "airtable",
    rowNote: "synthetic",
  });
  const missingSpot = missingBook.docks[0]!.products.find((product) => product.product === "87")!.legs.find((leg) => leg.key === "spot")!;
  assert.equal(missingSpot.blank, "not sourced");
  assert.equal(missingSpot.cents, null);
  assert.equal(derivedLegBlankText(missingSpot), "Spot — not sourced");

  const zeroFields = { ...syntheticOlder, GC_CBOB_Out: 0 };
  const zeroRow = plattsRowFromAirtableFields(zeroFields);
  assert.equal(zeroRow?.gcCbob.out, 0);
  assert.equal(zeroRow?.gcCbob.flagged, true);
  const blankText = { ...syntheticOlder, GC_CBOB_Out: "  " };
  assert.equal(plattsRowFromAirtableFields(blankText)?.gcCbob.out, null);
  const badText = { ...syntheticOlder, TPA_ULSD_Out: "n/a" };
  assert.equal(plattsRowFromAirtableFields(badText)?.tpaUlsd.out, null);
  const wrongCase: Record<string, unknown> = { ...syntheticOlder };
  delete wrongCase.GC_CBOB_Out;
  assert.equal(plattsRowFromAirtableFields({ ...wrongCase, gc_cbob_out: syntheticOlder.GC_CBOB_Out })?.gcCbob.out, null);
  assert.equal(plattsRowFromAirtableFields({ DateKey: "not-a-date", GC_CBOB_Out: syntheticOlder.GC_CBOB_Out }), null);

  const unavailable = await loadPlattsDailyRow({ token: "", todayKey: "2026-10-06" });
  assert.equal(unavailable.source, "unavailable");
  assert.equal(unavailable.row, null);
  assert.equal(unavailable.stale, false);
  assert.equal(unavailable.outrightFlag, false);
  assert.equal(JSON.stringify(unavailable).includes(String(syntheticOlder.NYMEX_RB_Implied)), false);
  const unavailableBook = computeDerivedMarinaLandedCost({
    docks,
    row: null,
    typed: blankTyped,
    todayKey: unavailable.todayKey,
    stale: unavailable.stale,
    rowSource: unavailable.source,
    rowNote: unavailable.note,
  });
  assert.equal(unavailableBook.dateKey, null);
  assert.equal(unavailableBook.stale, false);
  const unavailableSpot = unavailableBook.docks[0]!.products[0]!.legs.find((leg) => leg.key === "spot")!;
  assert.equal(unavailableSpot.blank, "Platts row unavailable");
  assert.equal(unavailableSpot.cents, null);
  assert.equal(derivedLegBlankText(unavailableSpot), "Spot — Platts row unavailable");
  assert.equal(unavailableBook.docks[0]!.products[0]!.dapComplete, false);
  assert.match(unavailableBook.docks[0]!.gaps.join(" "), /Spot — Platts row unavailable/);
  const unavailableHtml = renderToStaticMarkup(DerivedEstimate({ book: unavailableBook }));
  assert.match(unavailableHtml, /Platts row unavailable/);
  assert.doesNotMatch(unavailableHtml, /data-testid="platts-stale"/);
  assert.equal(unavailableHtml.includes(String(syntheticOlder.GC_CBOB_Out)), false);

  const handLegs = [
    { key: "spot" as const, label: "Spot", cents: 100, blank: null, disposition: "add" as const, sourceUrl: "https://example.test", asOf: "2026-10-06", sourceTitle: "row", note: "" },
    { key: "truckFreight" as const, label: "Truck freight", cents: null, blank: "not sourced" as const, disposition: "add" as const, sourceUrl: null, asOf: null, sourceTitle: null, note: "" },
    { key: "localTax" as const, label: "Local tax", cents: 0, blank: null, disposition: "add" as const, sourceUrl: "https://example.test/local", asOf: "2026-10-06", sourceTitle: "statute", note: "" },
    { key: "invoice" as const, label: "Invoice", cents: 50, blank: null, disposition: "typed_input" as const, sourceUrl: null, asOf: null, sourceTitle: null, note: "" },
  ];
  assert.equal(sumDerivedAddLegs(handLegs), null);
  assert.notEqual(sumDerivedAddLegs(handLegs), 0);
  const completeLegs = handLegs.map((leg) => (leg.key === "truckFreight" ? { ...leg, cents: 4, blank: null } : leg));
  assert.equal(sumDerivedAddLegs(completeLegs), 104);

  const derivedHtml = renderToStaticMarkup(DerivedEstimate({ book: derivedBook }));
  assert.match(derivedHtml, /DERIVED ESTIMATE/);
  assert.match(derivedHtml, /Truck freight — not sourced/);
  assert.match(derivedHtml, /Terminal throughput — not sourced/);
  assert.match(derivedHtml, /Marine \/ pipeline freight — not sourced/);
  assert.match(derivedHtml, /Invoice — not typed/);
  assert.match(derivedHtml, /Posted rack — not typed/);
  assert.match(derivedHtml, /NO CALL/);
  assert.match(derivedHtml, /Incomplete/);
  assert.match(derivedHtml, /Included in Tampa DDP basis/);
  assert.match(derivedHtml, /not on path/);
  assert.match(derivedHtml, /undyed \(clear\) rate/i);
  assert.doesNotMatch(derivedHtml, /Truck freight — 0/);
  assert.equal(derivedHtml.includes(">$0.00<"), false);
  assert.doesNotMatch(derivedHtml, /data-testid="platts-stale"/);

  let airtableCalls = 0;
  const airtableRow = await loadPlattsDailyRow({
    token: "test-token",
    todayKey: "2026-10-06",
    fetch: async (url, init) => {
      airtableCalls += 1;
      assert.match(url, new RegExp(PLATTS_AIRTABLE_BASE_ID));
      assert.match(url, new RegExp(PLATTS_AIRTABLE_TABLE_ID));
      assert.match(url, /sort\[0\]\[field\]=DateKey/);
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-token");
      assert.equal(url.includes("test-token"), false);
      return new Response(JSON.stringify(mockedAirtableBody), { status: 200 });
    },
  });
  assert.equal(airtableCalls, 1);
  assert.equal(airtableRow.source, "airtable");
  assert.equal(airtableRow.stale, false);
  assert.equal(airtableRow.row?.dateKey, "2026-10-05");
  assert.equal(airtableRow.row?.gcCbob.out, 112.3);
  assert.equal(airtableRow.row?.gcCbob.flagged, true);
  assert.equal(airtableRow.row?.tpaPre.flagged, true);
  assert.equal(airtableRow.outrightFlag, true);
  assert.equal(JSON.stringify(airtableRow).includes("test-token"), false);
  const flaggedBook = computeDerivedMarinaLandedCost({
    docks,
    row: airtableRow.row,
    typed: blankTyped,
    todayKey: "2026-10-06",
    stale: airtableRow.stale,
    rowSource: airtableRow.source,
    rowNote: airtableRow.note,
  });
  assert.equal(flaggedBook.outrightFlag, true);
  assert.equal(flaggedBook.docks[1]!.products.find((product) => product.product === "diesel")?.spotKey, "tpaUlsd");
  assert.match(renderToStaticMarkup(DerivedEstimate({ book: flaggedBook })), /data-testid="platts-outright-flag"/);

  assert.equal(
    latestPlattsRecord([
      { fields: { ...syntheticOlder, DateKey: "2026-10-04", GC_CBOB_Out: syntheticLatest.GC_CBOB_Out } },
      { fields: { ...syntheticOlder, DateKey: "2026-10-04", GC_CBOB_Out: syntheticOlder.GC_CBOB_Out } },
    ])?.gcCbob.out,
    112.3,
  );
  assert.equal(
    latestPlattsRecord([
      { fields: syntheticOlder },
      { fields: { ...syntheticOlder, DateKey: "2026-10-01" } },
    ])?.dateKey,
    "2026-10-01",
  );

  let retryCalls = 0;
  const retried = await loadPlattsDailyRow({
    token: "test-token",
    todayKey: "2026-10-06",
    fetch: async () => {
      retryCalls += 1;
      if (retryCalls === 1) return new Response("no", { status: 422 });
      return new Response(JSON.stringify({ records: [{ id: "recOnly", fields: syntheticOlder }] }), { status: 200 });
    },
  });
  assert.equal(retryCalls, 2);
  assert.equal(retried.row?.dateKey, syntheticOlder.DateKey);

  const staleRow = await loadPlattsDailyRow({
    token: "test-token",
    todayKey: "2026-10-06",
    fetch: async () => new Response(JSON.stringify({ records: [{ fields: { ...syntheticOlder, DateKey: "2026-10-02" } }] }), { status: 200 }),
  });
  assert.equal(staleRow.stale, true);
  assert.equal(staleRow.row?.dateKey, "2026-10-02");
  assert.match(renderToStaticMarkup(DerivedEstimate({
    book: computeDerivedMarinaLandedCost({
      docks,
      row: staleRow.row,
      typed: blankTyped,
      todayKey: "2026-10-06",
      stale: staleRow.stale,
      rowSource: staleRow.source,
      rowNote: staleRow.note,
    }),
  })), /data-testid="platts-stale"/);

  const failedFetch = await loadPlattsDailyRow({
    token: "test-token",
    todayKey: "2026-10-06",
    fetch: async () => {
      throw new Error("network");
    },
  });
  assert.equal(failedFetch.source, "unavailable");
  assert.equal(failedFetch.row, null);
  assert.equal(failedFetch.stale, false);
  assert.equal(failedFetch.note.includes("test-token"), false);

  const priorFatTake = fatTakeCents(400, 230);
  assert.equal(priorFatTake, 170);
  assert.equal(typedRegular.fatTakeCents, priorFatTake);
}

function postedCents(dockId: string, product: string): number {
  const dock = docks.find((row) => row.id === dockId);
  const quote = dock?.quotes.find((item) => item.product === product);
  assert.ok(quote?.pricePerGallon != null);
  return Math.round(quote.pricePerGallon * 100);
}

function decimalNeedles(value: unknown, found: string[] = []): string[] {
  if (typeof value === "number" && String(value).includes(".")) found.push(String(value));
  if (typeof value === "string" && /^-?\d+\.\d+$/.test(value)) found.push(value);
  if (Array.isArray(value)) {
    for (const item of value) decimalNeedles(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) decimalNeedles(item, found);
  }
  return [...new Set(found)];
}

function walkRepo(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".next") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walkRepo(full, found);
    else found.push(full);
  }
  return found;
}

function readText(file: string): string | null {
  try {
    const text = readFileSync(file);
    if (text.includes(0)) return null;
    return text.toString("utf8");
  } catch {
    return null;
  }
}

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

derivedChecks()
  .then(() => storeRoundtrip())
  .then(() => {
    console.log(
      `wholesale ok — ${catalog.terminals.length} terminals, ${catalog.areas.length} areas, blank stays blank`,
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
