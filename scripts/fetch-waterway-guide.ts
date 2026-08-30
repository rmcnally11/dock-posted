import { readDockStore, writeDockStore } from "../src/lib/store";
import {
  WG_REPORTS,
  fetchPublicReport,
  mergeParsedIntoDocks,
} from "../src/lib/waterway-guide";

/**
 * Public Waterway Guide fuel-report fetcher.
 *
 * Only hits the two weekly report pages that do not require a login:
 *   https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx
 *   https://www.waterwayguide.com/fuel-price-report/7/florida-keys
 *
 * Cloudflare often blocks unattended fetches. That is a real failure, not a
 * silent skip-with-fake-prices. Manual reports and the seed file keep working.
 */
async function main() {
  console.log("Fetching public Waterway Guide fuel reports…");
  const results = await Promise.all([
    fetchPublicReport(WG_REPORTS.gulf.url),
    fetchPublicReport(WG_REPORTS.keys.url),
  ]);

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
    console.log(`  parsed ${result.parsed.length} marinas; updated ${merged.updatedIds.length} v1 docks`);
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
  console.log(`\nWrote ${updatedIds.length} dock updates to runtime store.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
