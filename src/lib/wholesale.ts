import { readFileSync } from "node:fs";
import path from "node:path";
import { CORRIDORS, REGIONS, type CorridorId, type RegionId } from "./types";

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

export interface TerminalWorksheet {
  rb: ProductInputs;
  ho: ProductInputs;
  tax: TaxInputs;
}

export interface WholesaleStoreFile {
  generatedAt: string;
  differentials: DiffRow[];
  worksheets: Record<string, TerminalWorksheet>;
}

export interface WaterfallStep {
  key: string;
  label: string;
  cents: Cents;
  kind: "input" | "derived" | "margin";
  source: "typed" | "derived" | null;
}

export interface ProductNetback {
  product: WholesaleProduct;
  steps: WaterfallStep[];
  terminalSpot: Cents;
  inboundRack: Cents;
  rackMargin: Cents;
  jobberMargin: Cents;
  dockExTax: Cents;
  dockRemaining: Cents;
  tax: Cents;
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
  return { rb: emptyProduct(), ho: emptyProduct(), tax: emptyTax() };
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

export function computeProductNetback(
  product: WholesaleProduct,
  input: ProductInputs,
  tax: TaxInputs,
): ProductNetback {
  const taxStrip = taxCents(tax);
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

  const steps: WaterfallStep[] = [
    { key: "nymex", label: "NYMEX screen", cents: input.nymexScreen, kind: "input", source: input.nymexScreen == null ? null : "typed" },
    { key: "diff", label: "+ Terminal differential", cents: input.terminalDiff, kind: "input", source: input.terminalDiff == null ? null : "typed" },
    { key: "spot", label: "= Terminal / spot", cents: terminalSpot, kind: "derived", source: terminalSpot == null ? null : "derived" },
    { key: "freight", label: "+ Inbound freight / pipeline / truck", cents: input.inboundFreight, kind: "input", source: input.inboundFreight == null ? null : "typed" },
    { key: "inbound", label: "= Inbound rack cost", cents: inboundRack, kind: "derived", source: inboundRack == null ? null : "derived" },
    { key: "posted", label: "Posted rack", cents: input.postedRack, kind: "input", source: input.postedRack == null ? null : "typed" },
    { key: "rackMargin", label: "Rack margin", cents: rackMargin, kind: "margin", source: rackMargin == null ? null : "derived" },
    { key: "jobber", label: "Jobber sell", cents: input.jobberSell, kind: "input", source: input.jobberSell == null ? null : "typed" },
    { key: "jobberMargin", label: "Jobber margin", cents: jobberMargin, kind: "margin", source: jobberMargin == null ? null : "derived" },
    { key: "dock", label: "Dock / retail posted", cents: input.dockPosted, kind: "input", source: input.dockPosted == null ? null : "typed" },
    { key: "tax", label: "Tax strip", cents: taxStrip, kind: "input", source: taxStrip == null ? null : "typed" },
    { key: "exTax", label: "Dock ex-tax", cents: dockExTax, kind: "derived", source: dockExTax == null ? null : "derived" },
    { key: "remaining", label: "Dock / retail remaining", cents: dockRemaining, kind: "margin", source: dockRemaining == null ? null : "derived" },
  ];

  return {
    product,
    steps,
    terminalSpot,
    inboundRack,
    rackMargin,
    jobberMargin,
    dockExTax,
    dockRemaining,
    tax: taxStrip,
    rackEquivalent,
    terminalEquivalent,
    impliedDiff,
    typedDiff: input.terminalDiff,
    edgeVsTyped,
  };
}

export function computeWorksheet(sheet: TerminalWorksheet): Record<WholesaleProduct, ProductNetback> {
  return {
    RB: computeProductNetback("RB", sheet.rb, sheet.tax),
    HO: computeProductNetback("HO", sheet.ho, sheet.tax),
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
  return step.source === "typed" ? "typed" : "derived";
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

export function worksheetFromFields(
  fields: Record<string, string | undefined>,
  unit: InputUnit,
): TerminalWorksheet {
  return {
    rb: productInputsFromFields(fields, "RB", unit),
    ho: productInputsFromFields(fields, "HO", unit),
    tax: taxFromFields(fields, unit),
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
  const next = {
    rb: { ...sheet.rb },
    ho: { ...sheet.ho },
    tax: { ...sheet.tax },
  };
  if (row.product === "RB") next.rb.terminalDiff = row.centsVsScreen;
  else next.ho.terminalDiff = row.centsVsScreen;
  return next;
}
