import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HaulOutStoreFile } from "./haul-out";
import type { OverlayStoreFile, ReportStoreFile } from "./types";
import { emptyWholesaleStore, type WholesaleStoreFile } from "./wholesale";

const REPORTS_BLOB = "dock-posted/reports.json";
const OVERLAYS_BLOB = "dock-posted/overlays.json";
const HAUL_OUT_BLOB = "dock-posted/haul-out.json";
const WHOLESALE_BLOB = "dock-posted/wholesale.json";

function runtimeDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL) return "/tmp/dock-posted";
  return path.join(process.cwd(), "data", "runtime");
}

function reportsPath() {
  return path.join(runtimeDir(), "reports.json");
}

function overlaysPath() {
  return path.join(runtimeDir(), "overlays.json");
}

function haulOutPath() {
  return path.join(runtimeDir(), "haul-out.json");
}

function wholesalePath() {
  return path.join(runtimeDir(), "wholesale.json");
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function ensureRuntimeDir(): Promise<void> {
  await mkdir(runtimeDir(), { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await ensureRuntimeDir();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.stream == null) return null;
  const text = await new Response(result.stream as ReadableStream).text();
  return JSON.parse(text) as T;
}

async function writeBlobJson(pathname: string, value: unknown): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function readReportFile(): Promise<ReportStoreFile> {
  const empty: ReportStoreFile = { reports: [] };
  if (blobConfigured()) {
    try {
      return (await readBlobJson<ReportStoreFile>(REPORTS_BLOB)) ?? empty;
    } catch (error) {
      console.warn("Blob reports read failed; using empty list.", error);
      return empty;
    }
  }
  return readJsonFile(reportsPath(), empty);
}

export async function writeReportFile(file: ReportStoreFile): Promise<void> {
  if (blobConfigured()) {
    await writeBlobJson(REPORTS_BLOB, file);
    return;
  }
  await writeJsonFile(reportsPath(), file);
}

export async function readOverlayFile(): Promise<OverlayStoreFile> {
  const empty: OverlayStoreFile = { overlays: {} };
  if (blobConfigured()) {
    try {
      return (await readBlobJson<OverlayStoreFile>(OVERLAYS_BLOB)) ?? empty;
    } catch (error) {
      console.warn("Blob overlays read failed; using empty map.", error);
      return empty;
    }
  }
  return readJsonFile(overlaysPath(), empty);
}

export async function writeOverlayFile(file: OverlayStoreFile): Promise<void> {
  if (blobConfigured()) {
    await writeBlobJson(OVERLAYS_BLOB, file);
    return;
  }
  await writeJsonFile(overlaysPath(), file);
}

const emptyHaulOut = (): HaulOutStoreFile => ({
  generatedAt: new Date().toISOString(),
  yards: [],
  plans: [],
});

export async function readHaulOutFile(): Promise<HaulOutStoreFile> {
  const empty = emptyHaulOut();
  if (blobConfigured()) {
    try {
      return (await readBlobJson<HaulOutStoreFile>(HAUL_OUT_BLOB)) ?? empty;
    } catch (error) {
      console.warn("Blob haul-out read failed; using empty store.", error);
      return empty;
    }
  }
  return readJsonFile(haulOutPath(), empty);
}

export async function writeHaulOutFile(file: HaulOutStoreFile): Promise<void> {
  if (blobConfigured()) {
    await writeBlobJson(HAUL_OUT_BLOB, file);
    return;
  }
  await writeJsonFile(haulOutPath(), file);
}

export async function readWholesaleFile(): Promise<WholesaleStoreFile> {
  const empty = emptyWholesaleStore();
  if (blobConfigured()) {
    try {
      return (await readBlobJson<WholesaleStoreFile>(WHOLESALE_BLOB)) ?? empty;
    } catch (error) {
      console.warn("Blob wholesale read failed; using empty store.", error);
      return empty;
    }
  }
  return readJsonFile(wholesalePath(), empty);
}

export async function writeWholesaleFile(file: WholesaleStoreFile): Promise<void> {
  if (blobConfigured()) {
    await writeBlobJson(WHOLESALE_BLOB, file);
    return;
  }
  await writeJsonFile(wholesalePath(), file);
}
