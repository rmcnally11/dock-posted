import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  assignYards,
  seedYardFromRow,
  slugYardName,
  type HaulOutStoreFile,
  type HaulYard,
  type NamedStormPlan,
  type OwnerPlanInput,
  type YardLeftoverInput,
  type YardSeedRow,
} from "./haul-out";
import {
  emptyIncomeStore,
  type DeskCall,
  type IncomeStoreFile,
  type PinClaim,
  type PinInput,
  type WatchInput,
  type WaterWatch,
} from "./income";
import {
  readHaulOutFile,
  readIncomeFile,
  readOverlayFile,
  readReportFile,
  readWholesaleFile,
  writeHaulOutFile,
  writeIncomeFile,
  writeOverlayFile,
  writeReportFile,
  writeWholesaleFile,
} from "./persist";
import {
  emptyWholesaleStore,
  normalizeWorksheet,
  type DiffRow,
  type TerminalWorksheet,
  type WholesaleStoreFile,
} from "./wholesale";
import type {
  Dock,
  DockOverlay,
  DockStoreFile,
  PayKind,
  PriceReport,
  Product,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "docks.seed.json");
const YARDS_SEED_PATH = path.join(process.cwd(), "data", "yards.seed.json");

async function readSeed(): Promise<DockStoreFile> {
  const raw = await readFile(SEED_PATH, "utf8");
  return JSON.parse(raw) as DockStoreFile;
}

async function loadYardSeed(): Promise<HaulYard[]> {
  const raw = JSON.parse(await readFile(YARDS_SEED_PATH, "utf8")) as { yards: YardSeedRow[] };
  return raw.yards.map(seedYardFromRow);
}

async function emptyHaulOutStore(): Promise<HaulOutStoreFile> {
  return {
    generatedAt: new Date().toISOString(),
    yards: await loadYardSeed(),
    plans: [],
  };
}

function applyOverlay(dock: Dock, overlay: DockOverlay | undefined): Dock {
  if (!overlay) return dock;
  return {
    ...dock,
    quotes: overlay.quotes ? overlay.quotes.map((quote) => ({ ...quote })) : dock.quotes,
    ethanol: overlay.ethanol ?? dock.ethanol,
    lastVerifiedAt:
      overlay.lastVerifiedAt !== undefined ? overlay.lastVerifiedAt : dock.lastVerifiedAt,
    lastVerifiedSource:
      overlay.lastVerifiedSource !== undefined
        ? overlay.lastVerifiedSource
        : dock.lastVerifiedSource,
    sourceUrl: overlay.sourceUrl !== undefined ? overlay.sourceUrl : dock.sourceUrl,
    notes: overlay.notes !== undefined ? overlay.notes : dock.notes,
    hours: overlay.hours !== undefined ? overlay.hours : dock.hours,
    pay: overlay.pay !== undefined ? overlay.pay : dock.pay,
    closed: overlay.closed !== undefined ? overlay.closed : dock.closed,
  };
}

function overlayFromDock(dock: Dock): DockOverlay {
  return {
    quotes: dock.quotes.map((quote) => ({ ...quote })),
    ethanol: dock.ethanol,
    lastVerifiedAt: dock.lastVerifiedAt,
    lastVerifiedSource: dock.lastVerifiedSource,
    sourceUrl: dock.sourceUrl,
    notes: dock.notes,
    hours: dock.hours,
    pay: dock.pay ?? null,
    closed: dock.closed ?? false,
  };
}

export async function readDockStore(): Promise<DockStoreFile> {
  const seed = await readSeed();
  const { overlays } = await readOverlayFile();
  return {
    ...seed,
    generatedAt: new Date().toISOString(),
    docks: seed.docks.map((dock) => applyOverlay(dock, overlays[dock.id])),
  };
}

export async function readDocks(): Promise<Dock[]> {
  const store = await readDockStore();
  return store.docks;
}

export async function readReports(): Promise<PriceReport[]> {
  const file = await readReportFile();
  return file.reports;
}

function sameOverlay(left: Dock, right: Dock): boolean {
  return JSON.stringify(overlayFromDock(left)) === JSON.stringify(overlayFromDock(right));
}

export async function writeDockStore(store: DockStoreFile): Promise<void> {
  const seed = await readSeed();
  const { overlays } = await readOverlayFile();
  for (const dock of store.docks) {
    const baseline = seed.docks.find((item) => item.id === dock.id);
    if (!baseline) continue;
    if (sameOverlay(baseline, dock)) {
      delete overlays[dock.id];
    } else {
      overlays[dock.id] = overlayFromDock(dock);
    }
  }
  await writeOverlayFile({ overlays });
}

export async function writeReports(reports: PriceReport[]): Promise<void> {
  await writeReportFile({ reports });
}

export async function resetFromSeed(): Promise<DockStoreFile> {
  await writeReports([]);
  await writeOverlayFile({ overlays: {} });
  await writeHaulOutFile(await emptyHaulOutStore());
  await writeWholesaleFile(emptyWholesaleStore());
  await writeIncomeFile(emptyIncomeStore());
  return readDockStore();
}

export async function readWholesaleStore(): Promise<WholesaleStoreFile> {
  const file = await readWholesaleFile();
  return {
    ...file,
    worksheets: Object.fromEntries(
      Object.entries(file.worksheets).map(([id, sheet]) => [id, normalizeWorksheet(sheet)]),
    ),
  };
}

export async function writeWholesaleStore(store: WholesaleStoreFile): Promise<void> {
  store.generatedAt = new Date().toISOString();
  await writeWholesaleFile(store);
}

export async function saveTerminalWorksheet(
  terminalId: string,
  worksheet: TerminalWorksheet,
): Promise<void> {
  const store = await readWholesaleStore();
  store.worksheets[terminalId] = normalizeWorksheet(worksheet);
  await writeWholesaleStore(store);
}

export async function addWholesaleDiff(row: DiffRow): Promise<void> {
  const store = await readWholesaleStore();
  store.differentials.unshift(row);
  await writeWholesaleStore(store);
}

export async function removeWholesaleDiff(id: string): Promise<void> {
  const store = await readWholesaleStore();
  store.differentials = store.differentials.filter((row) => row.id !== id);
  await writeWholesaleStore(store);
}

export async function readHaulOutStore(): Promise<HaulOutStoreFile> {
  const seeded = await loadYardSeed();
  const current = await readHaulOutFile();
  const have = new Set(current.yards.map((yard) => yard.id));
  const missing = seeded.filter((yard) => !have.has(yard.id));
  if (current.yards.length === 0) {
    const fresh = await emptyHaulOutStore();
    fresh.plans = current.plans;
    return fresh;
  }
  if (missing.length === 0) return current;
  return {
    ...current,
    generatedAt: new Date().toISOString(),
    yards: [...current.yards, ...missing],
  };
}

export async function writeHaulOutStore(store: HaulOutStoreFile): Promise<void> {
  store.generatedAt = new Date().toISOString();
  await writeHaulOutFile(store);
}

export async function readYards(): Promise<HaulYard[]> {
  const store = await readHaulOutStore();
  return store.yards;
}

export async function readPlan(id: string): Promise<NamedStormPlan | null> {
  const store = await readHaulOutStore();
  return store.plans.find((plan) => plan.id === id) ?? null;
}

export async function addNamedStormPlan(input: OwnerPlanInput): Promise<NamedStormPlan> {
  const store = await readHaulOutStore();
  const match = assignYards(store.yards, input.lengthFt);
  const plan: NamedStormPlan = {
    id: randomUUID(),
    ownerName: input.ownerName,
    phone: input.phone,
    email: input.email,
    homeDock: input.homeDock,
    lengthFt: input.lengthFt,
    beamFt: input.beamFt,
    insuranceCarrier: input.insuranceCarrier,
    berth: input.berth,
    primaryYardId: match.primary?.id ?? null,
    backupYardId: match.backup?.id ?? null,
    createdAt: new Date().toISOString(),
  };
  store.plans.unshift(plan);
  await writeHaulOutStore(store);
  return plan;
}

export async function postYardLeftover(input: YardLeftoverInput): Promise<HaulYard> {
  const store = await readHaulOutStore();
  const needle = input.name.trim().toLowerCase();
  let yard = store.yards.find(
    (row) => row.name.toLowerCase() === needle || row.id === slugYardName(input.name),
  );

  if (!yard) {
    yard = seedYardFromRow({
      id: slugYardName(input.name) || randomUUID(),
      name: input.name.trim(),
      area: "clear-lake",
      city: "",
      state: "TX",
    });
    store.yards.push(yard);
  }

  yard.indoorLeftover = input.indoorLeftover;
  yard.lotLeftover = input.lotLeftover;
  yard.maxLengthFt = input.maxLengthFt;
  yard.phone = input.phone;
  yard.leftoverPostedAt = new Date().toISOString();

  await writeHaulOutStore(store);
  return yard;
}

function applyReportToDock(
  dock: Dock,
  report: PriceReport,
  claim: {
    marinaOwned: boolean;
    hours: string | null;
    pay: PayKind | null;
    closed: boolean;
    dieselOnly: boolean;
  },
): Dock {
  const nextQuotes = dock.quotes.map((quote) => ({ ...quote }));
  if (report.pricePerGallon > 0) {
    const existing = nextQuotes.find((quote) => quote.product === report.product);
    const updated = {
      product: report.product,
      pricePerGallon: report.pricePerGallon,
      ethanol: report.ethanol,
      status: "posted" as const,
      taxIncluded: null,
    };
    if (existing) Object.assign(existing, updated);
    else nextQuotes.push(updated);
  }
  if (claim.dieselOnly) {
    for (const quote of nextQuotes) {
      if (quote.product !== "diesel") {
        quote.status = "not-sold";
        quote.pricePerGallon = null;
      }
    }
  }

  const ethanol =
    report.product === "diesel"
      ? dock.ethanol
      : report.ethanol === "unknown"
        ? dock.ethanol
        : report.ethanol;

  return {
    ...dock,
    quotes: nextQuotes,
    ethanol,
    lastVerifiedAt: report.seenAt,
    lastVerifiedSource: claim.marinaOwned ? "marina" : "user report",
    sourceUrl: null,
    notes: report.note
      ? `${dock.notes ? `${dock.notes} ` : ""}User report ${report.seenAt}: ${report.note}`.trim()
      : dock.notes,
    hours: claim.hours ?? dock.hours,
    pay: claim.marinaOwned ? (claim.pay ?? dock.pay ?? null) : dock.pay,
    closed: claim.marinaOwned ? claim.closed : dock.closed,
  };
}

export async function addPriceReport(input: {
  dockId: string;
  product: Product;
  ethanol: PriceReport["ethanol"];
  pricePerGallon: number;
  seenAt: string;
  note: string | null;
  marinaOwned?: boolean;
  hours?: string | null;
  pay?: PayKind | null;
  closed?: boolean;
  dieselOnly?: boolean;
}): Promise<{ report: PriceReport; dock: Dock }> {
  const store = await readDockStore();
  const dockIndex = store.docks.findIndex((dock) => dock.id === input.dockId);
  if (dockIndex === -1) {
    throw new Error("Unknown marina");
  }

  const report: PriceReport = {
    id: randomUUID(),
    dockId: input.dockId,
    product: input.product,
    ethanol: input.ethanol,
    pricePerGallon: input.pricePerGallon,
    seenAt: input.seenAt,
    note: input.note,
    createdAt: new Date().toISOString(),
  };

  const updatedDock = applyReportToDock(store.docks[dockIndex], report, {
    marinaOwned: Boolean(input.marinaOwned),
    hours: input.hours?.trim() || null,
    pay: input.pay ?? null,
    closed: Boolean(input.closed),
    dieselOnly: Boolean(input.dieselOnly),
  });
  store.docks[dockIndex] = updatedDock;
  store.generatedAt = new Date().toISOString();

  const reports = await readReports();
  reports.unshift(report);

  await writeDockStore(store);
  await writeReports(reports);

  return { report, dock: updatedDock };
}

export async function readIncomeStore(): Promise<IncomeStoreFile> {
  return readIncomeFile();
}

export async function writeIncomeStore(store: IncomeStoreFile): Promise<void> {
  store.generatedAt = new Date().toISOString();
  await writeIncomeFile(store);
}

export async function addPinClaim(input: PinInput, dockName: string): Promise<PinClaim> {
  const store = await readIncomeStore();
  const pin: PinClaim = {
    id: randomUUID(),
    dockId: input.dockId,
    dockName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone,
    role: input.role,
    status: "filed",
    createdAt: new Date().toISOString(),
    paidAt: null,
    lastContactedAt: null,
    note: input.note,
  };
  store.pins.unshift(pin);
  await writeIncomeStore(store);
  return pin;
}

export async function addWaterWatch(input: WatchInput): Promise<WaterWatch> {
  const store = await readIncomeStore();
  const existing = store.watches.find(
    (row) =>
      row.email.toLowerCase() === input.email.toLowerCase() &&
      row.corridor === input.corridor &&
      row.region === input.region &&
      row.status !== "stopped",
  );
  if (existing) {
    existing.name = input.name;
    existing.gallons = input.gallons;
    await writeIncomeStore(store);
    return existing;
  }
  const watch: WaterWatch = {
    id: randomUUID(),
    email: input.email,
    name: input.name,
    corridor: input.corridor,
    region: input.region,
    gallons: input.gallons,
    status: "filed",
    createdAt: new Date().toISOString(),
    paidAt: null,
    note: null,
  };
  store.watches.unshift(watch);
  await writeIncomeStore(store);
  return watch;
}

export async function markPinPaid(id: string): Promise<PinClaim | null> {
  const store = await readIncomeStore();
  const pin = store.pins.find((row) => row.id === id);
  if (!pin) return null;
  pin.status = "paid";
  pin.paidAt = new Date().toISOString();
  await writeIncomeStore(store);
  return pin;
}

export async function markPinDead(id: string): Promise<PinClaim | null> {
  const store = await readIncomeStore();
  const pin = store.pins.find((row) => row.id === id);
  if (!pin) return null;
  if (pin.status === "paid") return pin;
  pin.status = "dead";
  await writeIncomeStore(store);
  return pin;
}

export async function markWatchPaid(id: string): Promise<WaterWatch | null> {
  const store = await readIncomeStore();
  const watch = store.watches.find((row) => row.id === id);
  if (!watch) return null;
  watch.status = "paid";
  watch.paidAt = new Date().toISOString();
  await writeIncomeStore(store);
  return watch;
}

export async function readPin(id: string): Promise<PinClaim | null> {
  const store = await readIncomeStore();
  return store.pins.find((row) => row.id === id) ?? null;
}

export async function addDeskCalls(
  rows: Array<Omit<DeskCall, "id" | "createdAt">>,
): Promise<DeskCall[]> {
  const store = await readIncomeStore();
  const created = rows.map((row) => ({
    ...row,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }));
  store.calls.unshift(...created);
  await writeIncomeStore(store);
  return created;
}

export async function attachIncomeAirtable(
  kind: "pin" | "watch" | "call",
  id: string,
  airtableId: string,
): Promise<void> {
  const store = await readIncomeStore();
  if (kind === "pin") {
    const row = store.pins.find((item) => item.id === id);
    if (row) row.airtableId = airtableId;
  } else if (kind === "watch") {
    const row = store.watches.find((item) => item.id === id);
    if (row) row.airtableId = airtableId;
  } else {
    const row = store.calls.find((item) => item.id === id);
    if (row) row.airtableId = airtableId;
  }
  await writeIncomeStore(store);
}
