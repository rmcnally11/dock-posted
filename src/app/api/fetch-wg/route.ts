import { NextResponse } from "next/server";
import { readDockStore, writeDockStore } from "@/lib/store";
import {
  WG_REPORTS,
  fetchPublicReport,
  mergeParsedIntoDocks,
} from "@/lib/waterway-guide";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await Promise.all(
    Object.values(WG_REPORTS).map((report) => fetchPublicReport(report.url)),
  );

  const store = await readDockStore();
  const updatedIds: string[] = [];
  const skipped: string[] = [];
  let docks = store.docks;

  for (const result of results) {
    if (!result.ok) continue;
    const merged = mergeParsedIntoDocks(docks, result.parsed, result.url);
    docks = merged.docks;
    updatedIds.push(...merged.updatedIds);
    skipped.push(...merged.skipped);
  }

  if (updatedIds.length > 0) {
    store.docks = docks;
    store.generatedAt = new Date().toISOString();
    await writeDockStore(store);
  }

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    applied: updatedIds.length > 0,
    updatedIds,
    skipped,
    reports: results.map((result) => ({
      url: result.url,
      ok: result.ok,
      blocked: result.blocked,
      status: result.status,
      reason: result.reason,
      parsedCount: result.parsed.length,
    })),
  });
}
