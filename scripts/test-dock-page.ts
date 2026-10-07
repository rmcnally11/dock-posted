import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import seed from "../data/docks.seed.json";
import {
  depthSourceLine,
  directionsHref,
  dockAnswerStats,
  dockCanonicalUrl,
  dockJsonLd,
  dockPageDescription,
  dockPageTitle,
  ethanolFreeAnswer,
  fuelsPosted,
  hoursSourceLine,
  postedDepth,
  priceCheckLine,
  priceChecks,
  priceHistoryLead,
  publicHours,
  type PostedDepth,
  type PriceCheck,
} from "../src/lib/dock-page";
import { gasWords } from "../src/lib/format";
import type { Dock, FuelQuote } from "../src/lib/types";

const docks = seed.docks as Dock[];
const now = Date.parse("2026-10-07T18:00:00Z");

function dockById(id: string): Dock {
  const dock = docks.find((row) => row.id === id);
  assert.ok(dock, id);
  return dock;
}

const gym = dockById("galveston-yacht-marina");
const bayland = dockById("bayland-marina");
const mangrove = dockById("mangrove-marina");
const southShore = dockById("south-shore-harbour");
const blueMarlin = dockById("blue-marlin-seabrook");
const arlington = dockById("arlington-marina");
const fernandina = dockById("fernandina-harbor-marina");
const eagle = dockById("eagle-point-san-leon");
const stingaree = dockById("stingaree-marina");
const lambs = dockById("lambs-yacht-center");
const madeira = dockById("madeira-beach-municipal-marina");
const landsEnd = dockById("lands-end-marina");
const pilot = dockById("pilot-house-marina");

assert.equal(ethanolFreeAnswer(gym), "Yes");
assert.equal(ethanolFreeAnswer(madeira), "Yes");
assert.equal(ethanolFreeAnswer(bayland), "Not stated");
assert.equal(ethanolFreeAnswer(arlington), "Not stated");
assert.equal(ethanolFreeAnswer(mangrove), "Not stated");
assert.equal(ethanolFreeAnswer(southShore), "Not stated");
assert.equal(ethanolFreeAnswer(blueMarlin), "Not stated");

const e10Gas: FuelQuote = {
  product: "87",
  pricePerGallon: null,
  ethanol: "E10",
  status: "call",
  taxIncluded: null,
};
const statedNo: Dock = {
  ...bayland,
  id: "fixture-ethanol-no",
  lastVerifiedSource: "marina site",
  quotes: [e10Gas],
};
assert.equal(ethanolFreeAnswer(statedNo), "No");
const statedYes: Dock = {
  ...bayland,
  id: "fixture-ethanol-yes",
  lastVerifiedSource: "marina site",
  quotes: [{ ...e10Gas, ethanol: "E0" }],
};
assert.equal(ethanolFreeAnswer(statedYes), "Yes");
const guideE0: Dock = {
  ...mangrove,
  lastVerifiedSource: "Waterway Guide",
};
assert.equal(ethanolFreeAnswer(guideE0), "Not stated");

assert.deepEqual(fuelsPosted(gym), [
  "Regular gas, 87 octane, ethanol not stated",
  "Gas, no ethanol, 93 octane",
  "Diesel",
]);
assert.deepEqual(fuelsPosted(bayland), []);
assert.deepEqual(fuelsPosted(fernandina), []);
assert.deepEqual(fuelsPosted(eagle), ["Gas"]);
assert.deepEqual(fuelsPosted(stingaree), ["Gas"]);
assert.deepEqual(fuelsPosted(mangrove), []);
assert.ok(fuelsPosted(blueMarlin).includes("Diesel"));
assert.ok(fuelsPosted(southShore).includes("Gas"));
assert.equal(fuelsPosted(eagle).includes("Diesel"), false);
assert.deepEqual(fuelsPosted(blueMarlin), [
  "Regular gas",
  "Premium gas (Supreme), 93 octane",
  "Diesel",
]);
assert.deepEqual(fuelsPosted(dockById("beach-marine")), [
  "Gas, no ethanol, 90 octane",
  "Off-road diesel (red dyed)",
]);
assert.deepEqual(fuelsPosted(dockById("marjorie-park-yacht-basin")), [
  "Mid-grade gas",
  "Off-road diesel (red dyed)",
]);
for (const dock of docks) {
  for (const name of fuelsPosted(dock)) {
    assert.equal(name.includes("Unleaded"), false, `${dock.id} ${name}`);
    assert.notEqual(name, "Supreme", dock.id);
    assert.notEqual(name, "Red dyed diesel", dock.id);
    assert.notEqual(name, "Off-road diesel", dock.id);
    if (name.includes("Supreme")) {
      assert.equal(name, "Premium gas (Supreme), 93 octane", dock.id);
    }
  }
}

assert.equal(postedDepth(gym), null);
assert.equal(postedDepth(bayland), null);
assert.equal(postedDepth({ depth: null }), null);
const hidden: PostedDepth = { text: "6 feet", sourceUrl: "", checkedOn: "2026-10-01" };
assert.equal(postedDepth({ depth: hidden }), null);
assert.equal(postedDepth({ depth: { text: "about 6 feet", sourceUrl: "https://example.com", checkedOn: "2026-10-01" } }), null);
const posted: PostedDepth = {
  text: "6 feet at the dock",
  sourceUrl: "https://galvestonyachtbasin.com/",
  checkedOn: "2026-10-01",
};
assert.equal(postedDepth({ depth: posted })?.text, "6 feet at the dock");
assert.equal(depthSourceLine(posted, now), "Marina's website, checked Oct 1");

const gymHistory = priceChecks(gym);
assert.deepEqual(
  gymHistory.map((check) => check.checkedOn),
  ["2026-10-05", "2026-10-03", "2026-08-30"],
);
assert.deepEqual(
  gymHistory[1]?.lines.map((line) => line.pricePerGallon),
  gym.quotes.map((quote) => quote.pricePerGallon),
);
assert.deepEqual(
  gymHistory[1]?.lines.map((line) => line.label),
  gym.quotes.map((quote) => gasWords(quote)),
);
assert.deepEqual(
  gymHistory[2]?.lines.map((line) => [line.label, line.pricePerGallon]),
  [
    ["Regular gas, 87 octane, ethanol not stated", 4.45],
    ["Gas, no ethanol, 93 octane", 5.79],
    ["Diesel", 5.28],
  ],
);
const gymPrices = gymHistory.flatMap((check) => check.lines.map((line) => line.pricePerGallon));
assert.equal(gymPrices.includes(5.14), false);
assert.equal(gymHistory[2]?.lines.some((line) => /89|tax included/i.test(line.label)), false);
assert.equal(priceHistoryLead(gymHistory.length), null);
assert.equal(
  priceCheckLine("Regular gas, 87 octane, ethanol not stated", 4.83),
  "Regular gas, 87 octane $4.83",
);
assert.equal(priceCheckLine("Gas, no ethanol, 93 octane", 6.27), "Gas, no ethanol, 93 octane $6.27");
assert.equal(priceCheckLine("Diesel", 6.33), "Diesel $6.33");
assert.doesNotMatch(dockPageDescription(gym, now), /ethanol not stated|tax not stated/);
assert.match(dockPageDescription(gym, now), /Gas, no ethanol, 93 octane \$6\.27/);
assert.equal(priceChecks(madeira).length, 1);
assert.equal(
  priceHistoryLead(priceChecks(madeira).length, priceChecks(madeira)[0]?.checkedOn ?? null),
  "Checked once, on Oct 3, 2026.",
);
assert.equal(priceHistoryLead(priceChecks(bayland).length), "No posted price yet.");
assert.equal(priceChecks(mangrove).length, 0);

const droppedGuide: PriceCheck = {
  checkedOn: "2026-01-01",
  source: "marina site",
  sourceUrl: null,
  lines: [{ label: "Diesel", pricePerGallon: 1 }],
};
const kept = priceChecks(bayland, [
  droppedGuide,
  { ...droppedGuide, source: "Waterway Guide" as PriceCheck["source"] },
]);
assert.deepEqual(
  kept.map((check) => check.checkedOn),
  ["2026-01-01"],
);

assert.deepEqual(publicHours(gym.hours), [
  "Fuel dock: Daily 6:00am–5:00pm",
  "Store and ramp: 6:00am–5:00pm",
  "Marina: Daily 9AM–7PM",
]);
assert.doesNotMatch(publicHours(gym.hours).join(" "), /Top of the page|Contact block/);
assert.equal(publicHours(lambs.hours)[0], "Fuel dock: 7 days a week, 8:30 AM–4:30 PM");
assert.doesNotMatch(publicHours(lambs.hours).join(" "), /Two clocks|The fuel dock says/);
assert.equal(publicHours(landsEnd.hours)[0], "Open seven days.");
assert.equal(publicHours("Daily 7am–6pm (club marina page)")[0], "Daily 7am–6pm");
assert.equal(hoursSourceLine(gym, now), "Marina's website, checked Oct 3");
assert.equal(hoursSourceLine(bayland, now), "Marina's website");
assert.equal(hoursSourceLine(pilot, now), "Marina's website");
assert.doesNotMatch(hoursSourceLine(pilot, now) ?? "", /Aug 25|2026-08-25/);

const directions = directionsHref(gym);
assert.ok(directions);
assert.equal(decodeURIComponent(directions), `https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`);
assert.match(directions, /api=1/);
assert.doesNotMatch(directions, /key=/i);
assert.equal(
  decodeURIComponent(directionsHref(bayland) ?? ""),
  `https://www.google.com/maps/search/?api=1&query=${bayland.lat},${bayland.lng}`,
);

assert.equal(dockCanonicalUrl(gym.id), "https://www.dockposted.com/docks/galveston-yacht-marina");
const gymLd = dockJsonLd(gym, now);
assert.equal(gymLd.url, "https://www.dockposted.com/docks/galveston-yacht-marina");
assert.equal(JSON.stringify(gymLd).includes("vercel.app"), false);
assert.equal(JSON.stringify(gymLd).includes("dock-posted.vercel.app"), false);
assert.equal(gymLd.address.addressLocality, "Galveston");
assert.equal(gymLd.address.addressRegion, "TX");
assert.equal(gymLd.geo.latitude, gym.lat);
assert.equal(gymLd.geo.longitude, gym.lng);
assert.equal(gymLd.telephone, "(409) 765-3000");
assert.match(gymLd.openingHours ?? "", /Fuel dock: Daily 6:00am–5:00pm/);
assert.match(dockPageTitle(gym, now), /Galveston Yacht Marina fuel prices, Galveston, Galveston Bay/);
assert.match(dockPageTitle(gym, now), /\$4\.83/);
assert.match(dockPageTitle(gym, now), /\$6\.27/);
assert.match(dockPageTitle(gym, now), /\$6\.33/);
assert.match(dockPageTitle(gym, now), /checked Oct 3, 2026/);
assert.match(dockPageDescription(gym, now), /fuel prices/i);
assert.match(dockPageDescription(gym, now), /Galveston Bay/);
assert.match(dockPageDescription(gym, now), /checked Oct 3, 2026/);
assert.equal(dockPageTitle(bayland, now), "Bayland Marina fuel prices, Baytown, Galveston Bay");
assert.match(dockPageDescription(bayland, now), /Fuel prices are not posted\. Call the dock\./);
assert.doesNotMatch(dockPageDescription(bayland, now), /\$\d/);
assert.doesNotMatch(dockPageDescription(pilot, now), /\$6\.05/);
assert.match(dockPageDescription(pilot, now), /Price over a week old/);

const baylandLd = dockJsonLd(bayland, now);
assert.equal(baylandLd.url, "https://www.dockposted.com/docks/bayland-marina");
assert.equal(JSON.stringify(baylandLd).includes("vercel.app"), false);
assert.equal(baylandLd.telephone, bayland.phone);
assert.match(baylandLd.openingHours ?? "", /Tue–Sun 8am–5pm/);

const pageSource = readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8");
assert.match(pageSource, /postedDepth/);
assert.doesNotMatch(pageSource, /data-testid="dock-depth"[\s\S]*Not posted/);
const sitemapSource = readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");
assert.match(sitemapSource, /\/docks\/\$\{dock\.id\}/);
const historyFile = readFileSync(path.join(process.cwd(), "data/price-history.json"), "utf8");
assert.doesNotMatch(historyFile, /platts|nymex|opis|argus|\brin\b|rack/i);
assert.equal(gym.quotes[0]?.pricePerGallon, 4.83);
assert.equal(gym.quotes[1]?.pricePerGallon, 6.27);
assert.equal(gym.quotes[2]?.pricePerGallon, 6.33);

const stats = dockAnswerStats(docks);
assert.equal(stats.docks, 163);
assert.equal(stats.directions, 163);
assert.equal(stats.ethanolYes, 11);
assert.equal(stats.ethanolNo, 0);
assert.equal(stats.ethanolNotStated, 152);
assert.equal(stats.depth, 0);
assert.equal(stats.historyMany, 1);
console.log(JSON.stringify(stats));
console.log("dock page checks passed");
