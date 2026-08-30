import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Dock,
  DockStoreFile,
  PriceReport,
  Product,
  ReportStoreFile,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "docks.seed.json");

function runtimeDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL) return "/tmp/dock-posted";
  return path.join(process.cwd(), "data", "runtime");
}

function docksPath() {
  return path.join(runtimeDir(), "docks.json");
}

function reportsPath() {
  return path.join(runtimeDir(), "reports.json");
}

async function ensureRuntime(): Promise<void> {
  await mkdir(runtimeDir(), { recursive: true });
  try {
    await readFile(docksPath(), "utf8");
  } catch {
    const seed = await readFile(SEED_PATH, "utf8");
    await writeFile(docksPath(), seed, "utf8");
  }
  try {
    await readFile(reportsPath(), "utf8");
  } catch {
    const empty: ReportStoreFile = { reports: [] };
    await writeFile(reportsPath(), JSON.stringify(empty, null, 2), "utf8");
  }
}

export async function readDockStore(): Promise<DockStoreFile> {
  await ensureRuntime();
  const raw = await readFile(docksPath(), "utf8");
  return JSON.parse(raw) as DockStoreFile;
}

export async function readDocks(): Promise<Dock[]> {
  const store = await readDockStore();
  return store.docks;
}

export async function readReports(): Promise<PriceReport[]> {
  await ensureRuntime();
  const raw = await readFile(reportsPath(), "utf8");
  const parsed = JSON.parse(raw) as ReportStoreFile;
  return parsed.reports;
}

export async function writeDockStore(store: DockStoreFile): Promise<void> {
  await ensureRuntime();
  await writeFile(docksPath(), JSON.stringify(store, null, 2), "utf8");
}

export async function writeReports(reports: PriceReport[]): Promise<void> {
  await ensureRuntime();
  const file: ReportStoreFile = { reports };
  await writeFile(reportsPath(), JSON.stringify(file, null, 2), "utf8");
}

export async function resetFromSeed(): Promise<DockStoreFile> {
  await mkdir(runtimeDir(), { recursive: true });
  const seedRaw = await readFile(SEED_PATH, "utf8");
  await writeFile(docksPath(), seedRaw, "utf8");
  await writeReports([]);
  return JSON.parse(seedRaw) as DockStoreFile;
}

function applyReportToDock(dock: Dock, report: PriceReport): Dock {
  const nextQuotes = dock.quotes.map((quote) => ({ ...quote }));
  const existing = nextQuotes.find((quote) => quote.product === report.product);
  const updated = {
    product: report.product,
    pricePerGallon: report.pricePerGallon,
    ethanol: report.ethanol,
    status: "posted" as const,
    taxIncluded: null,
  };

  if (existing) {
    Object.assign(existing, updated);
  } else {
    nextQuotes.push(updated);
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
    lastVerifiedSource: "user report",
    sourceUrl: null,
    notes: report.note
      ? `${dock.notes ? `${dock.notes} ` : ""}User report ${report.seenAt}: ${report.note}`.trim()
      : dock.notes,
  };
}

export async function addPriceReport(input: {
  dockId: string;
  product: Product;
  ethanol: PriceReport["ethanol"];
  pricePerGallon: number;
  seenAt: string;
  note: string | null;
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

  const updatedDock = applyReportToDock(store.docks[dockIndex], report);
  store.docks[dockIndex] = updatedDock;
  store.generatedAt = new Date().toISOString();

  const reports = await readReports();
  reports.unshift(report);

  await writeDockStore(store);
  await writeReports(reports);

  return { report, dock: updatedDock };
}
