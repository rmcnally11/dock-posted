import { readDockStore, writeDockStore } from "../src/lib/store";
import {
  WG_REPORTS,
  fetchPublicReport,
  mergeParsedIntoDocks,
} from "../src/lib/waterway-guide";

/**
 * Public Waterway Guide fuel-report fetcher.
 *
 * Hits the public weekly report pages only. No login, no paywall bypass.
 * Cloudflare often blocks unattended fetches. That is a real failure, not a
 * silent skip-with-fake-prices. Manual reports and the seed file keep working.
 */
async function main() {
  console.log("Fetching public Waterway Guide fuel reports…");
  const results = await Promise.all(Object.values(WG_REPORTS).map((report) => fetchPublicReport(report.url)));

  let anyOk = false;
  const store = await readDockStore();
  let docks = store.docks;
  const updatedIds: string[] = [];

  for (const result of results) {
    console.log(`\n${result.url}`);
    console.log(`  status=${result.status ?? "n/a"} blocked=${result.blocked} bytes=${result.htmlBytes}`);
    if (!result.ok) {
      console.log(`  FAIL: ${result.reason}`);
      continue;
    }
    anyOk = true;
    const merged = mergeParsedIntoDocks(docks, result.parsed, result.url);
    docks = merged.docks;
    updatedIds.push(...merged.updatedIds);
    console.log(`  parsed ${result.parsed.length} marinas; updated ${merged.updatedIds.length} seed docks`);
    if (merged.skipped.length) {
      console.log(`  skipped: ${merged.skipped.slice(0, 8).join("; ")}`);
    }
  }

  if (!anyOk) {
    console.log("\nNo report could be fetched. Leaving seed / runtime docks unchanged.");
    console.log("Report a price still works. Do not treat this as a successful scrape.");
    process.exitCode = 2;
    return;
  }

  store.docks = docks;
  store.generatedAt = new Date().toISOString();
  await writeDockStore(store);
  console.log(`\nWrote ${updatedIds.length} dock updates to the overlay store.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
