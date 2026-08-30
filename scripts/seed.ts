import { resetFromSeed } from "../src/lib/store";

async function main() {
  const store = await resetFromSeed();
  console.log(`Seeded ${store.docks.length} docks from data/docks.seed.json`);
  console.log(`Captured ${store.seedCapturedOn}. Runtime reports and haul-out filings cleared.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
