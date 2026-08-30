import { readFile } from "node:fs/promises";
import path from "node:path";
import { isOutOfCorridor, parseFuelReportHtml } from "../src/lib/waterway-guide";

async function main() {
  const html = await readFile(
    path.join(process.cwd(), "data/fixtures/wg-sample.html"),
    "utf8",
  );
  const parsed = parseFuelReportHtml(html);

  const pilot = parsed.find((row) => row.dockId === "pilot-house-marina");
  const marinaBay = parsed.find((row) => row.dockId === "marina-bay-harbor");
  const rockport = parsed.find((row) => /cove harbor/i.test(row.name));

  if (!pilot || pilot.quotes.find((q) => q.product === "90")?.pricePerGallon !== 6.05) {
    throw new Error("Parser missed Pilot House 90-octane $6.050");
  }
  if (!marinaBay || marinaBay.quotes.find((q) => q.product === "87")?.status !== "no-report") {
    throw new Error("Parser missed Marina Bay Harbor no-report");
  }
  if (!rockport) {
    throw new Error(`Parser missed Cove Harbor block. Got: ${parsed.map((row) => row.name).join(", ")}`);
  }
  if (!isOutOfCorridor(rockport.name, rockport.city)) {
    throw new Error(`Rockport should be flagged out of corridor (city=${rockport.city})`);
  }

  console.log(`Parser fixture OK (${parsed.length} marinas).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
