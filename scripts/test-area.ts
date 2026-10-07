import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import seed from "../data/docks.seed.json";
import AreaPage, { generateMetadata } from "../src/app/area/[slug]/page";
import sitemap from "../src/app/sitemap";
import { AreaBoard } from "../src/components/area-board";
import { PostedHome } from "../src/components/posted-home";
import {
  AREA_CALL_HEADING,
  AREA_EMPTY_PRICES,
  AREA_PRICES_HEADING,
  areaIntro,
  areaCanonicalUrl,
  areaIndexJsonLd,
  areaPageJsonLd,
  areaTitle,
  buildAreaPage,
  marinaOrCityPosted,
  parseAreaSlug,
  postedSourceLabel,
  regularGasPrice,
} from "../src/lib/area";
import { DOCK_ORIGIN } from "../src/lib/dock-page";
import { formatPrice } from "../src/lib/format";
import { HOME_AREAS, areaPath, homeCards, toPostedCard } from "../src/lib/posted";
import type { Dock, FuelQuote } from "../src/lib/types";

const docks = seed.docks as Dock[];
const readOn = Date.parse("2026-10-07T21:00:00Z");
const eightDays = Date.parse("2026-10-15T00:00:00Z");
const octTen = Date.parse("2026-10-22T00:00:00Z");
const beforeArlingtonRead = Date.parse("2026-10-03T21:00:00Z");

const LEAK = /\brack\b|\binvoice\b|should-be|\bnymex\b|\bTCN\b|\bplatts\b|\bRIN\b/i;
const BANNED_PRICE_SOURCE = /wholesale|waterway guide|boater report|user report/i;

function dockById(id: string): Dock {
  const dock = docks.find((item) => item.id === id);
  assert.ok(dock, `missing ${id}`);
  return dock;
}

function quote(partial: Partial<FuelQuote> & Pick<FuelQuote, "product" | "pricePerGallon" | "status">): FuelQuote {
  return {
    ethanol: "unknown",
    taxIncluded: null,
    ...partial,
  };
}

assert.equal(DOCK_ORIGIN, "https://www.dockposted.com");
assert.deepEqual(
  HOME_AREAS.map((area) => areaTitle(area.id)),
  ["Galveston Bay / Clear Lake", "Tampa Bay", "Northeast Florida"],
);
assert.deepEqual(
  HOME_AREAS.map((area) => areaCanonicalUrl(area.id)),
  [
    "https://www.dockposted.com/area/galveston-bay",
    "https://www.dockposted.com/area/tampa-bay",
    "https://www.dockposted.com/area/northeast-florida",
  ],
);
assert.equal(areaPath("galveston-bay"), "/area/galveston-bay");
assert.equal(parseAreaSlug("tampa-bay"), "tampa-bay");
assert.equal(parseAreaSlug("nope"), null);
assert.equal(parseAreaSlug(undefined), null);

assert.equal(marinaOrCityPosted("marina site"), true);
assert.equal(marinaOrCityPosted("marina"), true);
assert.equal(marinaOrCityPosted("user report"), false);
assert.equal(marinaOrCityPosted("boater report (reviewed)"), false);
assert.equal(marinaOrCityPosted("Waterway Guide"), false);
assert.equal(marinaOrCityPosted(null), false);

const galveston = buildAreaPage(docks, "galveston-bay", readOn);
const tampa = buildAreaPage(docks, "tampa-bay", readOn);
const north = buildAreaPage(docks, "northeast-florida", readOn);

assert.equal(galveston.title, "Galveston Bay / Clear Lake");
assert.equal(tampa.title, "Tampa Bay");
assert.equal(north.title, "Northeast Florida");
assert.equal(
  galveston.intro,
  "Fuel docks in Galveston Bay / Clear Lake, cheapest posted price first. Docks with no posted price are listed below. Call before you go.",
);
assert.equal(
  tampa.intro,
  "Fuel docks in Tampa Bay, cheapest posted price first. Docks with no posted price are listed below. Call before you go.",
);
assert.equal(
  north.intro,
  "Fuel docks in Northeast Florida, cheapest posted price first. Docks with no posted price are listed below. Call before you go.",
);
assert.equal(AREA_PRICES_HEADING, "Posted fuel prices");
assert.equal(AREA_EMPTY_PRICES, "No price posted yet. Call the dock.");
assert.equal(AREA_CALL_HEADING, "More fuel docks, call ahead");
for (const intro of [galveston.intro, tampa.intro, north.intro]) {
  assert.equal(intro, areaIntro(intro.slice("Fuel docks in ".length, intro.indexOf(", cheapest"))));
  assert.doesNotMatch(intro, LEAK);
  assert.doesNotMatch(intro, /regular|octane|ethanol|corridor|slug/i);
}

assert.deepEqual(
  galveston.priced.map((dock) => dock.id),
  ["galveston-yacht-marina"],
);
assert.deepEqual(
  tampa.priced.map((dock) => dock.id),
  ["madeira-beach-municipal-marina"],
);
assert.deepEqual(
  north.priced.map((dock) => dock.id),
  ["arlington-marina", "st-augustine-municipal-marina", "lambs-yacht-center"],
);
assert.ok((regularGasPrice(dockById("lambs-yacht-center")) ?? 0) === 0);
assert.equal(regularGasPrice(dockById("arlington-marina")), 6.399);
assert.equal(regularGasPrice(dockById("st-augustine-municipal-marina")), 6.59);
assert.ok(
  (regularGasPrice(dockById("arlington-marina")) ?? 0) <
    (regularGasPrice(dockById("st-augustine-municipal-marina")) ?? 0),
);
assert.equal(regularGasPrice(dockById("lambs-yacht-center")), null);

assert.equal(galveston.callAhead[0]?.id, "bayland-marina");
assert.equal(galveston.callAhead.at(-1)?.id, "watermans-harbor");
assert.equal(tampa.callAhead[0]?.id, "clearwater-beach-marina");
assert.equal(north.callAhead.at(-1)?.id, "palm-cove-marina");

const gym = galveston.priced[0];
assert.ok(gym);
assert.equal(gym.href, "/docks/galveston-yacht-marina");
assert.deepEqual(
  gym.lines.map((line) => `${line.label} ${line.figure}`),
  ["87 $4.83", "93 E0 $6.27", "Diesel $6.33"],
);
assert.equal(gym.asOf, "Oct 5, 2026");
assert.equal(gym.stillPosted, "Still posted on the marina's page Oct 7.");
assert.equal(gym.source, "Marina's website");
assert.equal(gym.sourceHref, "https://galvestonyachtbasin.com/");
assert.equal(gym.stale, false);
assert.equal(gym.stale, toPostedCard(dockById("galveston-yacht-marina"), readOn)?.stale);

const madeira = tampa.priced[0];
assert.ok(madeira);
assert.equal(madeira.source, "Marina's website");
assert.equal(madeira.stillPosted, null);
assert.equal(madeira.lines[0]?.figure, "$6.05");
assert.equal(madeira.lines[0]?.label, "Gasoline E0");
assert.doesNotMatch(madeira.lines[0]?.label ?? "", /regular/i);

const arlington = north.priced[0];
assert.ok(arlington);
assert.equal(arlington.id, "arlington-marina");
assert.equal(arlington.stale, false);
assert.equal(arlington.asOf, "Oct 5, 2026");
assert.equal(arlington.stillPosted, null);
assert.equal(arlington.lines[0]?.figure, "$6.399");
assert.equal(arlington.lines[1]?.figure, "$5.999");
assert.equal(arlington.source, "Marina's website");
assert.equal(arlington.stale, toPostedCard(dockById("arlington-marina"), readOn)?.stale);

const augustine = north.priced.find((row) => row.id === "st-augustine-municipal-marina");
assert.ok(augustine);
assert.equal(augustine.stale, false);
assert.equal(augustine.asOf, "Oct 7, 2026");
assert.equal(augustine.stillPosted, null);
assert.equal(augustine.source, "Marina's website");
assert.equal(augustine.lines.find((line) => line.label === "Gasoline")?.figure, "$6.59");
assert.equal(augustine.lines.find((line) => line.label === "Diesel")?.figure, "$6.99");

const earlyArlington = buildAreaPage(docks, "northeast-florida", beforeArlingtonRead).priced.find(
  (row) => row.id === "arlington-marina",
);
assert.equal(earlyArlington?.stale, true);
assert.equal(earlyArlington?.asOf, null);
assert.equal(earlyArlington?.stillPosted, null);
assert.equal(earlyArlington?.lines[0]?.figure, "$6.399");

for (const now of [readOn, eightDays, octTen, Date.now()]) {
  for (const id of HOME_AREAS.map((area) => area.id)) {
    const page = buildAreaPage(docks, id, now);
    for (const row of page.priced) {
      const card = toPostedCard(dockById(row.id), now);
      assert.equal(row.stale, card?.stale, `${row.id} stale flag drifted`);
      assert.equal(row.stillPosted, card?.stillPosted ?? null, `${row.id} still-posted line drifted`);
      assert.equal(row.href, `/docks/${row.id}`);
      assert.ok(row.lines.length > 0);
      assert.ok(row.lines.every((line) => line.figure.startsWith("$")));
      assert.equal(row.source === "Marina's website" || row.source === "Marina staff report, not checked", true);
    }
    const names = page.callAhead.map((row) => row.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    assert.deepEqual(names, sorted, `${id} call-ahead order`);
    for (const row of page.callAhead) {
      assert.equal(row.lines.length, 0);
      assert.equal(row.source, null);
    }
  }
}

const gymLater = buildAreaPage(docks, "galveston-bay", eightDays).priced[0];
assert.equal(gymLater?.stale, true);
assert.equal(gymLater?.lines[0]?.figure, "$4.83");
assert.equal(gymLater?.asOf, "Oct 5, 2026");
assert.equal(gymLater?.stillPosted, "Still posted on the marina's page Oct 7.");
const cityGalveston = buildAreaPage(
  docks.map((dock) =>
    dock.id === "galveston-yacht-marina"
      ? { ...dock, notes: "City page re-read 7 Oct 2026 with the same prices." }
      : dock,
  ),
  "galveston-bay",
  readOn,
).priced[0];
assert.equal(cityGalveston?.stillPosted, "Still posted on the city's page Oct 7.");
assert.equal(cityGalveston?.asOf, "Oct 5, 2026");
assert.equal(cityGalveston?.stale, false);
const augustineLater = buildAreaPage(docks, "northeast-florida", octTen).priced.find(
  (row) => row.id === "st-augustine-municipal-marina",
);
assert.equal(augustineLater?.stale, true);
assert.equal(augustineLater?.lines.some((line) => line.figure === "$6.59"), true);
assert.equal(augustineLater?.lines.some((line) => line.figure === "$6.99"), true);

const leaked: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "leaky-area-notes",
  name: "Leaky Notes Dock",
  notes: "NYMEX rack invoice should-be TCN Platts RIN wholesale",
};
const guide: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "guide-priced",
  name: "Guide Priced Dock",
  lastVerifiedSource: "Waterway Guide",
  quotes: [quote({ product: "87", pricePerGallon: 1.11, status: "posted" })],
};
const boater: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "boater-priced",
  name: "Boater Priced Dock",
  lastVerifiedSource: "boater report (reviewed)",
  quotes: [quote({ product: "87", pricePerGallon: 1.22, status: "posted" })],
};
const rawUser: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "user-priced",
  name: "User Priced Dock",
  lastVerifiedSource: "user report",
  quotes: [quote({ product: "87", pricePerGallon: 1.33, status: "posted" })],
};
const staff: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "staff-priced",
  name: "Aaa Staff Dock",
  lastVerifiedSource: "marina",
  lastVerifiedAt: "2026-10-03",
  sourceUrl: null,
  quotes: [quote({ product: "87", pricePerGallon: 3.5, status: "posted", ethanol: "E10" })],
};
const dieselOnly: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "diesel-only-priced",
  name: "Diesel Only Dock",
  lastVerifiedSource: "marina site",
  lastVerifiedAt: "2026-10-03",
  quotes: [quote({ product: "diesel", pricePerGallon: 1, status: "posted" })],
};
const priceyRegular: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "pricey-regular",
  name: "Pricey Regular Dock",
  quotes: [quote({ product: "87", pricePerGallon: 9, status: "posted" })],
};
const cheapPremium: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "cheap-premium",
  name: "Cheap Premium Dock",
  quotes: [quote({ product: "93", pricePerGallon: 2, status: "posted", ethanol: "E0" })],
};
const sameCheap: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "zeta-same",
  name: "Zeta Same Dock",
  quotes: [quote({ product: "gasoline", pricePerGallon: 4.83, status: "posted" })],
};
const sameAlpha: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "alpha-same",
  name: "Alpha Same Dock",
  quotes: [quote({ product: "87", pricePerGallon: 4.83, status: "posted" })],
};
const noPhone: Dock = {
  ...dockById("bayland-marina"),
  id: "no-phone-dock",
  name: "Aaa No Phone",
  phone: null,
};

const mixed = buildAreaPage(
  [...docks, leaked, guide, boater, rawUser, staff, dieselOnly, priceyRegular, cheapPremium, sameCheap, sameAlpha, noPhone],
  "galveston-bay",
  readOn,
);
assert.deepEqual(
  mixed.priced.map((dock) => dock.id),
  [
    "staff-priced",
    "alpha-same",
    "galveston-yacht-marina",
    "leaky-area-notes",
    "zeta-same",
    "pricey-regular",
    "cheap-premium",
    "diesel-only-priced",
  ],
);
assert.equal(mixed.priced.find((dock) => dock.id === "staff-priced")?.source, "Marina staff report, not checked");
assert.equal(mixed.priced.find((dock) => dock.id === "staff-priced")?.lines[0]?.figure, formatPrice(3.5));
assert.equal(postedSourceLabel(staff), "Marina staff report, not checked");
const hidden = new Set(["guide-priced", "boater-priced", "user-priced"]);
for (const id of hidden) {
  assert.equal(mixed.priced.some((dock) => dock.id === id), false, `${id} showed a price`);
  assert.equal(mixed.callAhead.some((dock) => dock.id === id), true);
}
assert.equal(mixed.callAhead.some((dock) => dock.id === "no-phone-dock"), true);
assert.equal(mixed.callAhead.find((dock) => dock.id === "no-phone-dock")?.callHref, null);
assert.doesNotMatch(JSON.stringify(mixed), LEAK);
assert.doesNotMatch(JSON.stringify(mixed), /\$1\.11|\$1\.22|\$1\.33/);
assert.equal(JSON.stringify(mixed).includes("1.11"), false);

const boardHtml = renderToStaticMarkup(createElement(AreaBoard, { page: north }));
assert.match(boardHtml, /data-testid="area-title"/);
assert.match(boardHtml, /Northeast Florida/);
assert.match(boardHtml, new RegExp(north.intro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(boardHtml, new RegExp(AREA_PRICES_HEADING));
assert.match(boardHtml, new RegExp(AREA_CALL_HEADING));
assert.doesNotMatch(boardHtml, /Date unknown|Regular|wholesale/i);
assert.doesNotMatch(boardHtml, LEAK);
assert.ok(boardHtml.indexOf("area-priced") < boardHtml.indexOf("area-call-ahead"));
assert.ok(
  boardHtml.indexOf("area-dock-arlington-marina") <
    boardHtml.indexOf("area-dock-st-augustine-municipal-marina"),
);
assert.ok(
  boardHtml.indexOf("area-dock-st-augustine-municipal-marina") < boardHtml.indexOf("area-dock-lambs-yacht-center"),
);
assert.doesNotMatch(boardHtml, /data-testid="area-stale-/);
assert.doesNotMatch(boardHtml, />\s*Stale\s*</);
assert.match(boardHtml, /\$6\.399/);
assert.match(boardHtml, /\$5\.999/);
assert.match(boardHtml, /\$6\.99/);
assert.match(boardHtml, /As of Oct 5, 2026/);
assert.match(boardHtml, /As of Oct 7, 2026/);
assert.doesNotMatch(boardHtml, /Still posted/);
const galvestonHtml = renderToStaticMarkup(createElement(AreaBoard, { page: galveston }));
assert.match(galvestonHtml, /As of Oct 5, 2026/);
assert.doesNotMatch(galvestonHtml, /As of Oct 7, 2026/);
assert.match(galvestonHtml, /Still posted on the marina(?:'|&#x27;)s page Oct 7\./);
assert.match(galvestonHtml, /data-testid="area-still-galveston-yacht-marina"/);
assert.doesNotMatch(boardHtml, /As of Sep 25, 2026/);
const earlyHtml = renderToStaticMarkup(
  createElement(AreaBoard, { page: buildAreaPage(docks, "northeast-florida", beforeArlingtonRead) }),
);
assert.match(earlyHtml, /data-testid="area-stale-arlington-marina"/);
assert.match(earlyHtml, />\s*Stale\s*</);
assert.match(boardHtml, /Marina(?:'|&#x27;)s website/);
assert.match(boardHtml, /href="\/docks\/lambs-yacht-center"/);
assert.match(boardHtml, /href="\/docks\/palm-cove-marina"/);
const callBlock = boardHtml.slice(boardHtml.indexOf('data-testid="area-call-ahead"'));
assert.doesNotMatch(callBlock, /\$\d|Stale|As of |Marina's website/);
assert.match(callBlock, /data-testid="area-call-fernandina-harbor-marina"/);
assert.match(callBlock, />\s*Call\s*</);
assert.match(callBlock, /href="tel:/);

const empty = buildAreaPage([], "tampa-bay", readOn);
const emptyHtml = renderToStaticMarkup(createElement(AreaBoard, { page: empty }));
assert.match(emptyHtml, new RegExp(AREA_EMPTY_PRICES));
assert.doesNotMatch(emptyHtml, /area-call-ahead/);

const cards = homeCards(docks, readOn);
const homeHtml = renderToStaticMarkup(
  createElement(PostedHome, {
    cards,
    area: null,
    links: [
      { id: "all" as const, label: "All", href: "/" },
      ...HOME_AREAS.map((area) => ({ id: area.id, label: area.label, href: `/?waters=${area.id}` })),
    ],
  }),
);
for (const area of HOME_AREAS) {
  assert.match(homeHtml, new RegExp(`data-testid="area-page-link-${area.id}"[^>]*href="/area/${area.id}"|href="/area/${area.id}"[^>]*data-testid="area-page-link-${area.id}"`));
}

const index = areaIndexJsonLd();
assert.deepEqual(
  index.itemListElement.map((item) => item.url),
  HOME_AREAS.map((area) => areaCanonicalUrl(area.id)),
);
const northLd = JSON.stringify(areaPageJsonLd(north));
assert.match(northLd, /https:\/\/www\.dockposted\.com\/area\/northeast-florida/);
assert.match(northLd, /https:\/\/www\.dockposted\.com\/docks\/arlington-marina/);
assert.match(northLd, /https:\/\/www\.dockposted\.com\/docks\/palm-cove-marina/);
assert.doesNotMatch(northLd, /vercel\.app|\$\d|4\.83|6\.399|wholesale|nymex|platts/i);
assert.doesNotMatch(northLd, LEAK);

for (const file of [
  "src/lib/area.ts",
  "src/components/area-board.tsx",
  "src/app/area/[slug]/page.tsx",
  "src/app/sitemap.ts",
  "src/app/layout.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, LEAK, file);
  assert.equal(text.includes("dock.notes"), false, file);
}
for (const file of ["src/components/site-header.tsx", "src/components/site-footer.tsx", "src/app/wholesale/page.tsx"]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.equal(text.includes("/area/"), false, `${file} should stay off the area pages`);
}

const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
assert.match(layout, /areaIndexJsonLd\(\)/);
const sitemapSource = readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");
assert.match(sitemapSource, /areaCanonicalUrl/);
assert.match(sitemapSource, /https:\/\/www\.dockposted\.com/);

const pricedIds = ["galveston-yacht-marina", "madeira-beach-municipal-marina", "lambs-yacht-center", "st-augustine-municipal-marina"];
for (const file of ["src/lib/area.ts", "src/components/area-board.tsx", "src/app/area/[slug]/page.tsx"]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  for (const id of pricedIds) assert.equal(text.includes(id), false, `${file} hardcoded ${id}`);
  assert.doesNotMatch(text, BANNED_PRICE_SOURCE);
}

async function renderPages() {
  const entries = await sitemap();
  for (const url of HOME_AREAS.map((area) => areaCanonicalUrl(area.id))) {
    assert.equal(entries.some((entry) => entry.url === url), true, url);
  }
  assert.ok(entries.every((entry) => entry.url.startsWith("https://www.dockposted.com")));
  assert.equal(entries.some((entry) => entry.url.includes("/wholesale")), false);

  const meta = await generateMetadata({ params: Promise.resolve({ slug: "galveston-bay" }) });
  assert.equal(meta.title, "Galveston Bay / Clear Lake");
  assert.equal(meta.description, galveston.intro);
  assert.equal(meta.alternates?.canonical, "https://www.dockposted.com/area/galveston-bay");

  const missing = await generateMetadata({ params: Promise.resolve({ slug: "nope" }) });
  assert.equal(missing.title, "Area");

  const html = renderToStaticMarkup(await AreaPage({ params: Promise.resolve({ slug: "tampa-bay" }) }));
  assert.match(html, /Tampa Bay/);
  assert.match(html, /Madeira Beach Municipal Marina/);
  assert.match(html, /href="\/docks\/madeira-beach-municipal-marina"/);
  assert.match(html, /\$6\.05/);
  assert.match(html, /https:\/\/www\.dockposted\.com\/area\/tampa-bay/);
  assert.match(html, /data-testid="area-call-clearwater-beach-marina"/);
  assert.doesNotMatch(html, /Date unknown/);
  assert.doesNotMatch(html, LEAK);
  const ld = html.slice(html.indexOf("application/ld+json"));
  assert.doesNotMatch(ld, /\$6\.05|6\.05/);

  let missingPage = false;
  try {
    renderToStaticMarkup(await AreaPage({ params: Promise.resolve({ slug: "not-an-area" }) }));
  } catch {
    missingPage = true;
  }
  assert.equal(missingPage, true);
}

renderPages().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
