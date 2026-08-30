import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  readOverlayFile,
  readReportFile,
  writeOverlayFile,
  writeReportFile,
} from "./persist";
import type {
  Dock,
  DockOverlay,
  DockStoreFile,
  PriceReport,
  Product,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "docks.seed.json");
const GULF_CALL_PATH = path.join(process.cwd(), "data", "gulf-call.json");

type CallDockRow = Pick<
  Dock,
  "id" | "name" | "corridor" | "city" | "state" | "lat" | "lng" | "phone" | "website"
>;

function expandCallDock(row: CallDockRow): Dock {
  return {
    ...row,
    hours: null,
    notes:
      "On the Texas–Florida chain. No public board captured — card says Call until someone posts what they saw.",
    access: "public",
    ethanol: "unknown",
    quotes: [
      { product: "90", pricePerGallon: null, ethanol: "unknown", status: "call", taxIncluded: null },
      { product: "diesel", pricePerGallon: null, ethanol: "unknown", status: "call", taxIncluded: null },
    ],
    lastVerifiedAt: null,
    lastVerifiedSource: null,
    sourceUrl: null,
  };
}

export async function loadCombinedSeed(): Promise<DockStoreFile> {
  const base = JSON.parse(await readFile(SEED_PATH, "utf8")) as DockStoreFile;
  const extra = JSON.parse(await readFile(GULF_CALL_PATH, "utf8")) as { docks: CallDockRow[] };
  const have = new Set(base.docks.map((dock) => dock.id));
  const added = extra.docks.filter((row) => !have.has(row.id)).map(expandCallDock);
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    docks: [...base.docks, ...added],
  };
}

async function readSeed(): Promise<DockStoreFile> {
  const raw = await readFile(SEED_PATH, "utf8");
  return JSON.parse(raw) as DockStoreFile;
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
  return readDockStore();
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
