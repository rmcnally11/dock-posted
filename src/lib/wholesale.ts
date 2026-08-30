import { readFileSync } from "node:fs";
import path from "node:path";
import { CORRIDORS, REGIONS, type CorridorId, type Dock, type RegionId } from "./types";

export type WholesaleProduct = "RB" | "HO";
export type TcnStatus = "verified" | "unverified";
export type OperatorKind = "Buckeye" | "Kinder Morgan" | "other";
export type Cents = number | null;
export type WholesaleAreaId = CorridorId | RegionId;
export type InputUnit = "cent" | "dollar";

export const WHOLESALE_PRODUCTS: WholesaleProduct[] = ["RB", "HO"];

export const PRODUCT_LABEL: Record<WholesaleProduct, string> = {
  RB: "RB (RBOB / gasoline)",
  HO: "HO (ULSD / diesel)",
};

export const WHOLESALE_AREA_ORDER: WholesaleAreaId[] = [
  "galveston-bay",
  "texas",
  "louisiana",
  "mississippi",
  "alabama",
  "west-florida",
  "keys",
  "upper-keys",
  "east-florida",
  "georgia",
  "south-carolina",
  "north-carolina",
  "virginia",
  "maryland",
  "new-jersey",
  "new-york",
  "new-england",
];

export interface WholesaleTerminal {
  id: string;
  hub: string;
  city: string;
  state: string;
  operator: OperatorKind;
  facilityName: string;
  address: string | null;
  zip: string | null;
  tcnIrs: string | null;
  tcnStatus: TcnStatus;
  products: "RB" | "HO" | "both" | null;
  productNote: string;
  sources: string[];
}

export interface AreaTerminalRef {
  terminalId: string;
  inArea: boolean;
  miles?: number;
  direction?: string;
  note?: string;
}

export interface WholesaleArea {
  areaId: WholesaleAreaId;
  label: string;
  note: string;
  footnotes: string[];
  terminals: AreaTerminalRef[];
}

export interface WholesaleCatalog {
  retrievedAt: string;
  irsDirectoryAsOf: string;
  irsDirectoryTitle: string;
  sources: Record<string, { title: string; url: string; retrievedAt: string; file?: string; dated?: string; directoryAsOf?: string }>;
  hubs: Array<{ id: string; label: string; note: string }>;
  terminals: WholesaleTerminal[];
  areas: WholesaleArea[];
}

export interface DiffRow {
  id: string;
  terminalId: string;
  name: string;
  product: WholesaleProduct;
  centsVsScreen: Cents;
}

export interface ProductInputs {
  nymexScreen: Cents;
  terminalDiff: Cents;
  inboundFreight: Cents;
  postedRack: Cents;
  jobberSell: Cents;
  dockPosted: Cents;
}

export interface TaxInputs {
  federal: Cents;
  state: Cents;
  other: Cents;
  oneLine: Cents;
}

export interface ProductTaxSlice {
  federal: Cents;
  state: Cents;
}

export interface TerminalWorksheet {
  rb: ProductInputs;
  ho: ProductInputs;
  tax: TaxInputs;
  taxRb?: ProductTaxSlice;
  taxHo?: ProductTaxSlice;
}

export interface WholesaleStoreFile {
  generatedAt: string;
  differentials: DiffRow[];
  worksheets: Record<string, TerminalWorksheet>;
}

export type ValueOrigin = "typed" | "default" | "board" | "derived" | null;
export type TakeKey =
  | "freight"
  | "rackMargin"
  | "jobberMargin"
  | "taxFederal"
  | "taxState"
  | "taxOther"
  | "tax"
  | "remaining";
export type RungRole = "start" | "take" | "level" | "leftover";
export type TaxMode = "split" | "oneline";

export interface WaterfallStep {
  key: string;
  label: string;
  cents: Cents;
  kind: "input" | "derived" | "margin" | "take";
  source: ValueOrigin;
  sourceLabel?: string | null;
}

export interface WaterfallRung {
  key: string;
  label: string;
  cents: Cents;
  role: RungRole;
  origin: ValueOrigin;
  sourceLabel: string | null;
  takeKey: TakeKey | null;
}

export interface RankedTake {
  key: TakeKey;
  label: string;
  cents: number;
}

export interface LabeledCents {
  cents: Cents;
  origin: ValueOrigin;
  sourceLabel: string | null;
}

export interface DefaultTaxPart {
  cents: Cents;
  origin: "default" | null;
  label: string;
  asOf: string | null;
  citation: string;
}

export interface DefaultTaxForTerminal {
  federal: DefaultTaxPart;
  state: DefaultTaxPart;
  note: string;
}

export interface ResolvedTax {
  federal: LabeledCents;
  state: LabeledCents;
  other: LabeledCents;
  oneLine: LabeledCents;
  strip: LabeledCents;
  mode: TaxMode;
}

export interface BoardDockDefault {
  cents: number;
  dockId: string;
  dockName: string;
  productLabel: string;
  asOf: string | null;
  label: string;
}

export interface NetbackContext {
  state?: string;
  taxResolved?: ResolvedTax;
  inputOrigins?: Partial<Record<keyof ProductInputs, ValueOrigin>>;
  inputLabels?: Partial<Record<keyof ProductInputs, string | null>>;
}

export interface ProductNetback {
  product: WholesaleProduct;
  steps: WaterfallStep[];
  rungs: WaterfallRung[];
  takes: RankedTake[];
  fattestTake: TakeKey | null;
  terminalSpot: Cents;
  inboundRack: Cents;
  rackMargin: Cents;
  jobberMargin: Cents;
  dockExTax: Cents;
  dockRemaining: Cents;
  tax: Cents;
  taxFederal: Cents;
  taxState: Cents;
  taxOther: Cents;
  taxOneLine: Cents;
  taxMode: TaxMode;
  rackEquivalent: Cents;
  terminalEquivalent: Cents;
  impliedDiff: Cents;
  typedDiff: Cents;
  edgeVsTyped: Cents;
}

const emptyProduct = (): ProductInputs => ({
  nymexScreen: null,
  terminalDiff: null,
  inboundFreight: null,
  postedRack: null,
  jobberSell: null,
  dockPosted: null,
});

const emptyTax = (): TaxInputs => ({
  federal: null,
  state: null,
  other: null,
  oneLine: null,
});

export function emptyWorksheet(): TerminalWorksheet {
  return {
    rb: emptyProduct(),
    ho: emptyProduct(),
    tax: emptyTax(),
    taxRb: { federal: null, state: null },
    taxHo: { federal: null, state: null },
  };
}

export function normalizeWorksheet(sheet: TerminalWorksheet | undefined | null): TerminalWorksheet {
  const base = sheet ?? emptyWorksheet();
  return {
    rb: { ...emptyProduct(), ...base.rb },
    ho: { ...emptyProduct(), ...base.ho },
    tax: { ...emptyTax(), ...base.tax },
    taxRb: { federal: base.taxRb?.federal ?? null, state: base.taxRb?.state ?? null },
    taxHo: { federal: base.taxHo?.federal ?? null, state: base.taxHo?.state ?? null },
  };
}

export function emptyWholesaleStore(): WholesaleStoreFile {
  return { generatedAt: new Date().toISOString(), differentials: [], worksheets: {} };
}

let catalogCache: WholesaleCatalog | null = null;

export function loadWholesaleCatalog(): WholesaleCatalog {
  if (catalogCache) return catalogCache;
  const file = path.join(process.cwd(), "data", "wholesale-terminals.json");
  catalogCache = JSON.parse(readFileSync(file, "utf8")) as WholesaleCatalog;
  return catalogCache;
}

export function areaLabel(areaId: WholesaleAreaId): string {
  if (areaId in CORRIDORS) return CORRIDORS[areaId as CorridorId].label;
  return REGIONS[areaId as RegionId].label;
}

export function parseAreaId(raw: string | undefined): WholesaleAreaId {
  if (raw && (WHOLESALE_AREA_ORDER as string[]).includes(raw)) {
    return raw as WholesaleAreaId;
  }
  return "galveston-bay";
}

export function findArea(areaId: WholesaleAreaId): WholesaleArea {
  const catalog = loadWholesaleCatalog();
  const found = catalog.areas.find((area) => area.areaId === areaId);
  if (!found) {
    throw new Error(`Unknown wholesale area: ${areaId}`);
  }
  return found;
}

export function findTerminal(id: string): WholesaleTerminal | null {
  return loadWholesaleCatalog().terminals.find((row) => row.id === id) ?? null;
}

export function terminalsForArea(areaId: WholesaleAreaId): Array<{
  terminal: WholesaleTerminal;
  ref: AreaTerminalRef;
}> {
  const area = findArea(areaId);
  return area.terminals
    .map((ref) => {
      const terminal = findTerminal(ref.terminalId);
      return terminal ? { terminal, ref } : null;
    })
    .filter((row): row is { terminal: WholesaleTerminal; ref: AreaTerminalRef } => row !== null);
}

export function tcnLabel(terminal: WholesaleTerminal): string {
  if (terminal.tcnStatus === "unverified" || !terminal.tcnIrs) return "—";
  return terminal.tcnIrs;
}

export function parseOptionalCents(raw: string, unit: InputUnit = "cent"): Cents {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    throw new Error("Use a number, or leave the cell blank.");
  }
  const cents = unit === "dollar" ? value * 100 : value;
  if (Math.abs(cents) > 100_000) {
    throw new Error("That figure is out of range for ¢/gal.");
  }
  return cents;
}

export function readOptionalCents(raw: string | undefined, unit: InputUnit = "cent"): Cents {
  try {
    return parseOptionalCents(raw ?? "", unit);
  } catch {
    return null;
  }
}

export function taxCents(tax: TaxInputs): Cents {
  if (tax.oneLine != null) return tax.oneLine;
  const parts = [tax.federal, tax.state, tax.other].filter((part): part is number => part != null);
  if (parts.length === 0) return null;
  return parts.reduce((sum, part) => sum + part, 0);
}

export function addCents(...parts: Cents[]): Cents {
  if (parts.some((part) => part == null)) return null;
  return parts.reduce<number>((sum, part) => sum + (part as number), 0);
}

export function subCents(left: Cents, right: Cents): Cents {
  if (left == null || right == null) return null;
  return left - right;
}

function originOf(cents: Cents, hint?: ValueOrigin): ValueOrigin {
  if (cents == null) return null;
  return hint ?? "typed";
}

export function computeProductNetback(
  product: WholesaleProduct,
  input: ProductInputs,
  tax: TaxInputs,
  context: NetbackContext = {},
): ProductNetback {
  const resolved = context.taxResolved ?? resolveTaxForProduct(tax, product, {
    state: context.state,
    applyDefaults: Boolean(context.state),
  });
  const taxStrip = resolved.strip.cents;
  const terminalSpot = addCents(input.nymexScreen, input.terminalDiff);
  const inboundRack = addCents(terminalSpot, input.inboundFreight);
  const rackMargin = subCents(input.postedRack, inboundRack);
  const jobberMargin = subCents(input.jobberSell, input.postedRack);
  const dockExTax = subCents(input.dockPosted, taxStrip);
  const dockRemaining = subCents(dockExTax, input.jobberSell);
  const rackEquivalent = dockExTax;
  const terminalEquivalent = subCents(rackEquivalent, input.inboundFreight);
  const impliedDiff = subCents(terminalEquivalent, input.nymexScreen);
  const edgeVsTyped = subCents(impliedDiff, input.terminalDiff);
  const origins = context.inputOrigins ?? {};
  const labels = context.inputLabels ?? {};

  const steps: WaterfallStep[] = [
    { key: "nymex", label: "NYMEX screen", cents: input.nymexScreen, kind: "input", source: originOf(input.nymexScreen, origins.nymexScreen) },
    { key: "diff", label: "+ Terminal differential", cents: input.terminalDiff, kind: "input", source: originOf(input.terminalDiff, origins.terminalDiff) },
    { key: "spot", label: "= Terminal / spot", cents: terminalSpot, kind: "derived", source: terminalSpot == null ? null : "derived" },
    { key: "freight", label: "+ Inbound freight / pipeline / truck", cents: input.inboundFreight, kind: "input", source: originOf(input.inboundFreight, origins.inboundFreight) },
    { key: "inbound", label: "= Inbound rack cost", cents: inboundRack, kind: "derived", source: inboundRack == null ? null : "derived" },
    { key: "posted", label: "Posted rack", cents: input.postedRack, kind: "input", source: originOf(input.postedRack, origins.postedRack) },
    { key: "rackMargin", label: "Rack margin", cents: rackMargin, kind: "margin", source: rackMargin == null ? null : "derived" },
    { key: "jobber", label: "Jobber sell", cents: input.jobberSell, kind: "input", source: originOf(input.jobberSell, origins.jobberSell) },
    { key: "jobberMargin", label: "Jobber margin", cents: jobberMargin, kind: "margin", source: jobberMargin == null ? null : "derived" },
    {
      key: "dock",
      label: "Dock / retail posted",
      cents: input.dockPosted,
      kind: "input",
      source: originOf(input.dockPosted, origins.dockPosted),
      sourceLabel: labels.dockPosted ?? null,
    },
  ];

  if (resolved.mode === "oneline") {
    steps.push({
      key: "tax",
      label: "TAX",
      cents: resolved.oneLine.cents,
      kind: "take",
      source: resolved.oneLine.origin,
      sourceLabel: resolved.oneLine.sourceLabel,
    });
  } else {
    steps.push(
      {
        key: "taxFederal",
        label: "Federal tax",
        cents: resolved.federal.cents,
        kind: "take",
        source: resolved.federal.origin,
        sourceLabel: resolved.federal.sourceLabel,
      },
      {
        key: "taxState",
        label: "State tax",
        cents: resolved.state.cents,
        kind: "take",
        source: resolved.state.origin,
        sourceLabel: resolved.state.sourceLabel,
      },
    );
    if (resolved.other.cents != null) {
      steps.push({
        key: "taxOther",
        label: "Other tax",
        cents: resolved.other.cents,
        kind: "take",
        source: resolved.other.origin,
        sourceLabel: resolved.other.sourceLabel,
      });
    }
  }

  steps.push(
    { key: "exTax", label: "Dock ex-tax", cents: dockExTax, kind: "derived", source: dockExTax == null ? null : "derived" },
    { key: "remaining", label: "Dock / retail remaining", cents: dockRemaining, kind: "margin", source: dockRemaining == null ? null : "derived" },
  );

  const book: ProductNetback = {
    product,
    steps,
    rungs: [],
    takes: [],
    fattestTake: null,
    terminalSpot,
    inboundRack,
    rackMargin,
    jobberMargin,
    dockExTax,
    dockRemaining,
    tax: taxStrip,
    taxFederal: resolved.federal.cents,
    taxState: resolved.state.cents,
    taxOther: resolved.other.cents,
    taxOneLine: resolved.oneLine.cents,
    taxMode: resolved.mode,
    rackEquivalent,
    terminalEquivalent,
    impliedDiff,
    typedDiff: input.terminalDiff,
    edgeVsTyped,
  };
  book.rungs = buildWaterfallRungs(book, resolved, input, origins, labels);
  book.takes = rankTakes(book.rungs);
  book.fattestTake = book.takes[0]?.key ?? null;
  return book;
}

export function computeWorksheet(
  sheet: TerminalWorksheet,
  context: {
    state?: string;
    areaId?: WholesaleAreaId;
    docks?: Dock[];
    saved?: TerminalWorksheet;
  } = {},
): Record<WholesaleProduct, ProductNetback> {
  const prepared = applyWorksheetDefaults(sheet, context);
  return {
    RB: computeProductNetback("RB", prepared.rb.input, prepared.taxInputs, {
      state: context.state,
      taxResolved: prepared.rb.tax,
      inputOrigins: prepared.rb.origins,
      inputLabels: prepared.rb.labels,
    }),
    HO: computeProductNetback("HO", prepared.ho.input, prepared.taxInputs, {
      state: context.state,
      taxResolved: prepared.ho.tax,
      inputOrigins: prepared.ho.origins,
      inputLabels: prepared.ho.labels,
    }),
  };
}

export function formatCents(value: Cents): string {
  if (value == null) return "—";
  const sign = value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)} ¢/gal`;
}

export function formatDollars(value: Cents): string {
  if (value == null) return "—";
  const sign = value < 0 ? "−" : "";
  return `${sign}$${(Math.abs(value) / 100).toFixed(4)}/gal`;
}

export function formatBoth(value: Cents): string {
  if (value == null) return "—";
  return `${formatCents(value)} · ${formatDollars(value)}`;
}

export function sourceLabel(step: WaterfallStep): string {
  if (step.cents == null) return "—";
  if (step.sourceLabel) return step.sourceLabel;
  if (step.source === "typed") return "typed";
  if (step.source === "default") return "default";
  if (step.source === "board") return "from the board";
  return "derived";
}

export function parseUnit(raw: string | undefined): InputUnit {
  return raw === "dollar" ? "dollar" : "cent";
}

export function displayInputValue(cents: Cents, unit: InputUnit): string {
  if (cents == null) return "";
  return unit === "dollar" ? (cents / 100).toString() : String(cents);
}

export function productInputsFromFields(
  fields: Record<string, string | undefined>,
  product: WholesaleProduct,
  unit: InputUnit,
): ProductInputs {
  const p = product.toLowerCase();
  return {
    nymexScreen: readOptionalCents(fields[`nymex_${p}`], unit),
    terminalDiff: readOptionalCents(fields[`diff_${p}`], unit),
    inboundFreight: readOptionalCents(fields[`freight_${p}`], unit),
    postedRack: readOptionalCents(fields[`rack_${p}`], unit),
    jobberSell: readOptionalCents(fields[`jobber_${p}`], unit),
    dockPosted: readOptionalCents(fields[`dock_${p}`], unit),
  };
}

export function taxFromFields(fields: Record<string, string | undefined>, unit: InputUnit): TaxInputs {
  return {
    federal: readOptionalCents(fields.tax_federal, unit),
    state: readOptionalCents(fields.tax_state, unit),
    other: readOptionalCents(fields.tax_other, unit),
    oneLine: readOptionalCents(fields.tax_one, unit),
  };
}

function productTaxFromFields(
  fields: Record<string, string | undefined>,
  product: WholesaleProduct,
  unit: InputUnit,
): ProductTaxSlice {
  const p = product.toLowerCase();
  return {
    federal: readOptionalCents(fields[`tax_federal_${p}`] ?? fields[`tax_federal${p}`], unit),
    state: readOptionalCents(fields[`tax_state_${p}`] ?? fields[`tax_state${p}`], unit),
  };
}

export function worksheetFromFields(
  fields: Record<string, string | undefined>,
  unit: InputUnit,
): TerminalWorksheet {
  return {
    rb: productInputsFromFields(fields, "RB", unit),
    ho: productInputsFromFields(fields, "HO", unit),
    tax: taxFromFields(fields, unit),
    taxRb: productTaxFromFields(fields, "RB", unit),
    taxHo: productTaxFromFields(fields, "HO", unit),
  };
}

export function diffsForTerminal(
  store: WholesaleStoreFile,
  terminalId: string,
  product?: WholesaleProduct,
): DiffRow[] {
  return store.differentials.filter(
    (row) => row.terminalId === terminalId && (product ? row.product === product : true),
  );
}

export function applyDiffRow(sheet: TerminalWorksheet, row: DiffRow | null): TerminalWorksheet {
  if (!row || row.centsVsScreen == null) return sheet;
  const next = normalizeWorksheet(sheet);
  if (row.product === "RB") next.rb.terminalDiff = row.centsVsScreen;
  else next.ho.terminalDiff = row.centsVsScreen;
  return next;
}

export function stepByKey(book: ProductNetback, key: string): WaterfallStep | undefined {
  return book.steps.find((step) => step.key === key);
}

export function sameCents(left: Cents, right: Cents): boolean {
  if (left == null || right == null) return left === right;
  return Math.abs(left - right) < 1e-6;
}

interface WholesaleTaxFile {
  retrievedAt: string;
  note: string;
  federal: {
    asOf: string;
    unchangedSince: string;
    label: string;
    source: string;
    url: string;
    gasolineCents: number;
    dieselCents: number;
  };
  state: {
    asOf: string;
    revised: string;
    label: string;
    source: string;
    url: string;
    rates: Record<string, { gasolineCents: number; dieselCents: number }>;
  };
}

let taxTableCache: WholesaleTaxFile | null = null;

export function loadWholesaleTax(): WholesaleTaxFile {
  if (taxTableCache) return taxTableCache;
  const file = path.join(process.cwd(), "data", "wholesale-tax.json");
  taxTableCache = JSON.parse(readFileSync(file, "utf8")) as WholesaleTaxFile;
  return taxTableCache;
}

export const MARINE_TAX_NOTE =
  "Highway undyed rates. Dyed / off-road diesel and local option taxes are not assumed. Marina diesel is not treated as tax-free.";

const emptyPart = (citation: string): DefaultTaxPart => ({
  cents: null,
  origin: null,
  label: "—",
  asOf: null,
  citation,
});

export function defaultTaxForTerminal(state: string, product: WholesaleProduct): DefaultTaxForTerminal {
  const table = loadWholesaleTax();
  const fuel = product === "HO" ? "dieselCents" : "gasolineCents";
  const federalCents = table.federal[fuel];
  const code = state.trim().toUpperCase();
  const row = code ? table.state.rates[code] : undefined;
  return {
    federal: {
      cents: federalCents,
      origin: "default",
      label: table.federal.label,
      asOf: table.federal.asOf,
      citation: table.federal.source,
    },
    state: row
      ? {
          cents: row[fuel],
          origin: "default",
          label: `${table.state.label} · ${code}`,
          asOf: table.state.asOf,
          citation: table.state.source,
        }
      : emptyPart(table.state.source),
    note: table.note,
  };
}

function labeled(
  cents: Cents,
  origin: ValueOrigin,
  sourceLabel: string | null = null,
): LabeledCents {
  return { cents, origin: cents == null ? null : origin, sourceLabel: cents == null ? null : sourceLabel };
}

function coalesceTaxPart(
  typed: Cents,
  saved: Cents,
  fallback: DefaultTaxPart | undefined,
): LabeledCents {
  if (typed != null && saved != null) return labeled(typed, "typed", "typed");
  if (typed != null && fallback && sameCents(typed, fallback.cents)) {
    return labeled(typed, "default", fallback.label);
  }
  if (typed != null) return labeled(typed, "typed", "typed");
  if (fallback?.cents != null) return labeled(fallback.cents, "default", fallback.label);
  return labeled(null, null, null);
}

export function resolveTaxForProduct(
  tax: TaxInputs,
  product: WholesaleProduct,
  options: {
    state?: string;
    applyDefaults?: boolean;
    slice?: ProductTaxSlice;
    saved?: TaxInputs;
    savedSlice?: ProductTaxSlice;
  } = {},
): ResolvedTax {
  const oneLine = labeled(tax.oneLine, tax.oneLine == null ? null : "typed", tax.oneLine == null ? null : "typed");
  const defaults =
    options.applyDefaults && options.state
      ? defaultTaxForTerminal(options.state, product)
      : null;
  const typedFederal = options.slice?.federal ?? tax.federal;
  const typedState = options.slice?.state ?? tax.state;
  const savedFederal = options.savedSlice?.federal ?? options.saved?.federal ?? null;
  const savedState = options.savedSlice?.state ?? options.saved?.state ?? null;
  const federal = coalesceTaxPart(typedFederal, savedFederal, defaults?.federal);
  const state = coalesceTaxPart(typedState, savedState, defaults?.state);
  const other = labeled(tax.other, tax.other == null ? null : "typed", tax.other == null ? null : "typed");

  if (oneLine.cents != null) {
    return {
      federal,
      state,
      other,
      oneLine,
      strip: oneLine,
      mode: "oneline",
    };
  }

  const parts = [federal.cents, state.cents, other.cents];
  const present = parts.filter((part): part is number => part != null);
  const stripCents = present.length === 0 ? null : present.reduce((sum, part) => sum + part, 0);
  const stripOrigin =
    stripCents == null
      ? null
      : [federal, state, other].some((part) => part.cents != null && part.origin === "typed")
        ? "typed"
        : "default";
  return {
    federal,
    state,
    other,
    oneLine,
    strip: labeled(stripCents, stripOrigin, stripOrigin === "default" ? "default" : stripOrigin === "typed" ? "typed" : null),
    mode: "split",
  };
}

export function docksInWholesaleArea(docks: Dock[], areaId: WholesaleAreaId): Dock[] {
  if (areaId === "galveston-bay" || areaId === "upper-keys") {
    return docks.filter((dock) => dock.corridor === areaId);
  }
  return docks.filter((dock) => dock.region === areaId);
}

function postedQuotesForProduct(dock: Dock, product: WholesaleProduct) {
  return dock.quotes.filter((quote) => {
    if (quote.status !== "posted" || quote.pricePerGallon == null) return false;
    return product === "HO" ? quote.product === "diesel" : quote.product !== "diesel";
  });
}

export function boardDockDefault(
  docks: Dock[],
  areaId: WholesaleAreaId,
  product: WholesaleProduct,
): BoardDockDefault | null {
  const inArea = docksInWholesaleArea(docks, areaId);
  const postedDocks = inArea.filter((dock) => postedQuotesForProduct(dock, product).length > 0);
  if (postedDocks.length !== 1) return null;
  const dock = postedDocks[0]!;
  const quotes = postedQuotesForProduct(dock, product);
  const gradeOrder = ["87", "89", "90", "91", "93", "diesel"];
  quotes.sort((a, b) => gradeOrder.indexOf(a.product) - gradeOrder.indexOf(b.product));
  const quote = quotes[0];
  if (!quote || quote.pricePerGallon == null) return null;
  const grade = quote.product;
  const asOf = dock.lastVerifiedAt;
  return {
    cents: quote.pricePerGallon * 100,
    dockId: dock.id,
    dockName: dock.name,
    productLabel: grade,
    asOf,
    label: `from the board · ${dock.name} ${grade}${asOf ? ` · as of ${asOf}` : ""}`,
  };
}

export interface PreparedProduct {
  input: ProductInputs;
  tax: ResolvedTax;
  origins: Partial<Record<keyof ProductInputs, ValueOrigin>>;
  labels: Partial<Record<keyof ProductInputs, string | null>>;
}

export interface PreparedWorksheet {
  rb: PreparedProduct;
  ho: PreparedProduct;
  taxInputs: TaxInputs;
  sheet: TerminalWorksheet;
}

function prepareProduct(
  input: ProductInputs,
  tax: TaxInputs,
  slice: ProductTaxSlice | undefined,
  product: WholesaleProduct,
  context: {
    state?: string;
    areaId?: WholesaleAreaId;
    docks?: Dock[];
    saved?: TerminalWorksheet;
  },
): PreparedProduct {
  const origins: Partial<Record<keyof ProductInputs, ValueOrigin>> = {};
  const labels: Partial<Record<keyof ProductInputs, string | null>> = {};
  const next = { ...input };
  const savedInput = product === "RB" ? context.saved?.rb : context.saved?.ho;

  (["nymexScreen", "terminalDiff", "inboundFreight", "postedRack", "jobberSell"] as const).forEach((key) => {
    if (input[key] != null) origins[key] = "typed";
  });

  if (input.dockPosted != null && savedInput?.dockPosted != null) {
    origins.dockPosted = "typed";
  } else if (input.dockPosted == null && context.areaId && context.docks) {
    const fromBoard = boardDockDefault(context.docks, context.areaId, product);
    if (fromBoard) {
      next.dockPosted = fromBoard.cents;
      origins.dockPosted = "board";
      labels.dockPosted = fromBoard.label;
    }
  } else if (input.dockPosted != null && context.areaId && context.docks) {
    const fromBoard = boardDockDefault(context.docks, context.areaId, product);
    if (fromBoard && sameCents(input.dockPosted, fromBoard.cents) && savedInput?.dockPosted == null) {
      origins.dockPosted = "board";
      labels.dockPosted = fromBoard.label;
    } else {
      origins.dockPosted = "typed";
    }
  }

  const resolved = resolveTaxForProduct(tax, product, {
    state: context.state,
    applyDefaults: Boolean(context.state),
    slice,
    saved: context.saved?.tax,
    savedSlice: product === "RB" ? context.saved?.taxRb : context.saved?.taxHo,
  });

  return { input: next, tax: resolved, origins, labels };
}

export function applyWorksheetDefaults(
  sheet: TerminalWorksheet,
  context: {
    state?: string;
    areaId?: WholesaleAreaId;
    docks?: Dock[];
    saved?: TerminalWorksheet;
  } = {},
): PreparedWorksheet {
  const normalized = normalizeWorksheet(sheet);
  return {
    rb: prepareProduct(normalized.rb, normalized.tax, normalized.taxRb, "RB", context),
    ho: prepareProduct(normalized.ho, normalized.tax, normalized.taxHo, "HO", context),
    taxInputs: normalized.tax,
    sheet: normalized,
  };
}

export function stripUnchangedDefaults(
  sheet: TerminalWorksheet,
  state: string,
  context: { areaId?: WholesaleAreaId; docks?: Dock[] } = {},
): TerminalWorksheet {
  const normalized = normalizeWorksheet(sheet);
  const rbDefault = defaultTaxForTerminal(state, "RB");
  const hoDefault = defaultTaxForTerminal(state, "HO");
  const stripPart = (value: Cents, fallback: Cents): Cents =>
    value != null && fallback != null && sameCents(value, fallback) ? null : value;
  const rbBoard =
    context.areaId && context.docks ? boardDockDefault(context.docks, context.areaId, "RB") : null;
  const hoBoard =
    context.areaId && context.docks ? boardDockDefault(context.docks, context.areaId, "HO") : null;

  return {
    ...normalized,
    rb: {
      ...normalized.rb,
      dockPosted: stripPart(normalized.rb.dockPosted, rbBoard?.cents ?? null),
    },
    ho: {
      ...normalized.ho,
      dockPosted: stripPart(normalized.ho.dockPosted, hoBoard?.cents ?? null),
    },
    taxRb: {
      federal: stripPart(normalized.taxRb?.federal ?? null, rbDefault.federal.cents),
      state: stripPart(normalized.taxRb?.state ?? null, rbDefault.state.cents),
    },
    taxHo: {
      federal: stripPart(normalized.taxHo?.federal ?? null, hoDefault.federal.cents),
      state: stripPart(normalized.taxHo?.state ?? null, hoDefault.state.cents),
    },
    tax: {
      ...normalized.tax,
      federal: stripPart(normalized.tax.federal, rbDefault.federal.cents),
      state: stripPart(normalized.tax.state, rbDefault.state.cents),
    },
  };
}

function rung(
  key: string,
  label: string,
  cents: Cents,
  role: RungRole,
  origin: ValueOrigin,
  sourceLabel: string | null,
  takeKey: TakeKey | null,
): WaterfallRung {
  return { key, label, cents, role, origin, sourceLabel, takeKey };
}

export function buildWaterfallRungs(
  book: ProductNetback,
  resolved: ResolvedTax,
  input: ProductInputs,
  origins: Partial<Record<keyof ProductInputs, ValueOrigin>> = {},
  labels: Partial<Record<keyof ProductInputs, string | null>> = {},
): WaterfallRung[] {
  const rungs: WaterfallRung[] = [
    rung("spot", "Terminal / spot", book.terminalSpot, "start", book.terminalSpot == null ? null : "derived", null, null),
    rung(
      "freight",
      "Inbound freight / pipeline / truck",
      input.inboundFreight,
      "take",
      originOf(input.inboundFreight, origins.inboundFreight),
      null,
      "freight",
    ),
    rung("inbound", "Inbound rack cost", book.inboundRack, "level", book.inboundRack == null ? null : "derived", null, null),
    rung(
      "rackMargin",
      "Rack margin",
      book.rackMargin,
      "take",
      book.rackMargin == null ? null : "derived",
      book.rackMargin == null ? null : "posted rack − inbound rack",
      "rackMargin",
    ),
    rung(
      "jobberMargin",
      "Jobber margin",
      book.jobberMargin,
      "take",
      book.jobberMargin == null ? null : "derived",
      book.jobberMargin == null ? null : "jobber sell − posted rack",
      "jobberMargin",
    ),
  ];

  if (resolved.mode === "oneline") {
    rungs.push(
      rung("tax", "TAX", resolved.oneLine.cents, "take", resolved.oneLine.origin, resolved.oneLine.sourceLabel ?? "typed one line", "tax"),
    );
  } else {
    rungs.push(
      rung(
        "taxFederal",
        "Federal tax",
        resolved.federal.cents,
        "take",
        resolved.federal.origin,
        resolved.federal.sourceLabel,
        "taxFederal",
      ),
      rung(
        "taxState",
        "State tax",
        resolved.state.cents,
        "take",
        resolved.state.origin,
        resolved.state.sourceLabel,
        "taxState",
      ),
    );
    if (resolved.other.cents != null) {
      rungs.push(
        rung("taxOther", "Other tax", resolved.other.cents, "take", resolved.other.origin, resolved.other.sourceLabel, "taxOther"),
      );
    }
  }

  rungs.push(
    rung(
      "remaining",
      "Dock / retail remaining",
      book.dockRemaining,
      "leftover",
      book.dockRemaining == null ? null : "derived",
      book.dockRemaining == null ? null : "dock posted − tax − jobber sell",
      "remaining",
    ),
  );
  void labels;
  return rungs;
}

export function rankTakes(rungs: WaterfallRung[]): RankedTake[] {
  return rungs
    .filter((row): row is WaterfallRung & { takeKey: TakeKey; cents: number } => row.takeKey != null && row.cents != null)
    .map((row) => ({ key: row.takeKey, label: row.label, cents: row.cents }))
    .sort((a, b) => Math.abs(b.cents) - Math.abs(a.cents) || a.label.localeCompare(b.label));
}

export function fattestTakeAcross(books: ProductNetback[]): number {
  let max = 0;
  for (const book of books) {
    for (const take of book.takes) {
      max = Math.max(max, Math.abs(take.cents));
    }
  }
  return max;
}

