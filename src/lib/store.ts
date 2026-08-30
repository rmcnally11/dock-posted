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
  PayKind,
  PriceReport,
  Product,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "docks.seed.json");

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
  return readDockStore();
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
