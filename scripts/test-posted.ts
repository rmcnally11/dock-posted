import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import seed from "../data/docks.seed.json";
import { chicagoCivilDate, civilDate, formatPrice, sourceInstant, telHref } from "../src/lib/format";
import { freshness } from "../src/lib/freshness";
import {
  CALL_FIGURE,
  DATE_UNKNOWN,
  HOME_AREAS,
  NOT_SOLD_FIGURE,
  asOfText,
  callHref,
  cardsInArea,
  cardsNearest,
  directionsHref,
  dockTimeZone,
  gradeLabel,
  homeArea,
  homeAreaHref,
  homeCards,
  milesBetween,
  parseHomeArea,
  postedFigure,
  quotesOnHome,
  toPostedCard,
} from "../src/lib/posted";
import { readDocks } from "../src/lib/store";
import type { Dock, FuelQuote } from "../src/lib/types";
import { HomeWelcome } from "../src/components/home-welcome";
import { PostedHome } from "../src/components/posted-home";
import { SiteHeader } from "../src/components/site-header";

const docks = seed.docks as Dock[];
const readOn = Date.parse("2026-10-07T21:00:00Z");
const eightDays = Date.parse("2026-10-15T00:00:00Z");
const fourteenDays = Date.parse("2026-10-21T00:00:00Z");
const pastFourteen = Date.parse("2026-10-22T00:00:00Z");
const octNine = Date.parse("2026-10-21T00:00:00Z");
const octTen = Date.parse("2026-10-22T00:00:00Z");

const LEAK = /\brack\b|\binvoice\b|should-be|\bnymex\b|\bTCN\b|\bplatts\b|\bRIN\b/i;

function dockById(id: string): Dock {
  const dock = docks.find((item) => item.id === id);
  assert.ok(dock, `missing ${id}`);
  return dock;
}

function line(dockId: string, product: string, now = readOn) {
  const card = toPostedCard(dockById(dockId), now);
  assert.ok(card, `${dockId} should be on the home list`);
  const match = card.lines.find((item) => item.key.startsWith(`${product}-`));
  assert.ok(match, `${dockId} missing ${product}`);
  return { card, match };
}

assert.deepEqual(
  HOME_AREAS.map((area) => area.label),
  ["Galveston Bay", "Tampa Bay", "Northeast Florida"],
);
assert.equal(parseHomeArea(undefined), null);
assert.equal(parseHomeArea("nope"), null);
assert.equal(parseHomeArea("tampa-bay"), "tampa-bay");
assert.equal(homeAreaHref(null, {}), "/");
assert.equal(homeAreaHref("tampa-bay", {}), "/?waters=tampa-bay");
assert.equal(
  homeAreaHref("galveston-bay", { reported: "gym", waters: "tampa-bay" }),
  "/?reported=gym&waters=galveston-bay",
);

const cards = homeCards(docks, readOn);
assert.ok(cards.length > 4, `home list should grow past the priced docks, got ${cards.length}`);

for (const id of [
  "galveston-yacht-marina",
  "madeira-beach-municipal-marina",
  "lambs-yacht-center",
  "st-augustine-municipal-marina",
  "fernandina-harbor-marina",
  "clearwater-beach-marina",
  "st-pete-municipal-marina",
  "blue-marlin-seabrook",
  "houston-yacht-club",
]) {
  assert.ok(cards.some((card) => card.id === id), `${id} should come from the area, not a fixed list`);
}

for (const id of [
  "key-largo-harbor",
  "daytona-beach-marina",
  "marina-jack-sarasota",
  "destin-harbor-boardwalk",
  "naples-city-dock",
  "golden-isles-marina",
  "pleasure-island-marina",
]) {
  assert.equal(homeArea(dockById(id)), null, `${id} is outside the three areas`);
  assert.equal(toPostedCard(dockById(id), readOn), null);
}

const future: Dock = {
  ...dockById("madeira-beach-municipal-marina"),
  id: "future-tampa-pin",
  name: "Future Tampa Pin",
  lat: 27.95,
  lng: -82.55,
  corridor: null,
  phone: null,
  quotes: [
    {
      product: "87",
      pricePerGallon: 4.1,
      ethanol: "E10",
      status: "posted",
      taxIncluded: null,
    },
  ],
};
assert.equal(homeArea(future), "tampa-bay");
const withFuture = homeCards([...docks, future], readOn);
assert.ok(withFuture.some((card) => card.id === "future-tampa-pin"));
assert.equal(homeArea({ ...future, lat: 26.1, lng: -81.8 }), null);

const corridorOnly: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "future-bay-pin",
  lat: 40,
  lng: -70,
  corridor: "galveston-bay",
};
assert.equal(homeArea(corridorOnly), "galveston-bay");

const pricedIds = ["galveston-yacht-marina", "madeira-beach-municipal-marina", "lambs-yacht-center", "st-augustine-municipal-marina"];
for (const file of [
  "src/lib/posted.ts",
  "src/components/posted-home.tsx",
  "src/components/home-welcome.tsx",
  "src/lib/home-welcome.ts",
  "src/app/page.tsx",
  "src/app/board/page.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  for (const id of pricedIds) {
    assert.equal(text.includes(id), false, `${file} hardcoded ${id}`);
  }
  assert.doesNotMatch(text, LEAK, `${file} leaked a wholesale term`);
  assert.doesNotMatch(text, /dock\.notes/);
}

assert.equal(cardsInArea(cards, "galveston-bay")[0]?.id, "galveston-yacht-marina");
assert.equal(cardsInArea(cards, "tampa-bay")[0]?.id, "madeira-beach-municipal-marina");
assert.equal(cardsInArea(cards, "northeast-florida")[0]?.id, "arlington-marina");
assert.equal(cardsInArea(cards, "northeast-florida").at(-1)?.id, "palm-cove-marina");
assert.ok(cardsInArea(cards, "northeast-florida").some((card) => card.id === "lambs-yacht-center"));
assert.ok(cardsInArea(cards, "northeast-florida").some((card) => card.id === "fernandina-harbor-marina"));
assert.ok(cardsInArea(cards, "galveston-bay").every((card, index, list) => index === 0 || !card.hasPrice || list[index - 1]?.hasPrice));

const gym = line("galveston-yacht-marina", "87");
assert.equal(gym.match.label, "87");
assert.equal(gym.match.figure, "$4.83");
assert.equal(gym.match.asOf, "Oct 7, 2026");
assert.equal(gym.card.stale, false);
const gymE0 = line("galveston-yacht-marina", "93");
assert.equal(gymE0.match.label, "93 E0");
assert.equal(gymE0.match.figure, "$6.27");
assert.doesNotMatch(gymE0.match.label, /regular/i);
assert.equal(line("galveston-yacht-marina", "diesel").match.label, "Diesel");
assert.equal(line("galveston-yacht-marina", "diesel").match.figure, "$6.33");

const lambs = line("lambs-yacht-center", "90");
assert.equal(lambs.match.label, "90 E0");
assert.equal(lambs.match.figure, "$5.15");
assert.doesNotMatch(lambs.match.label, /regular/i);
assert.equal(lambs.card.stale, false);

const madeira = line("madeira-beach-municipal-marina", "gasoline");
assert.equal(madeira.match.label, "Gasoline E0");
assert.equal(madeira.match.figure, "$6.05");
assert.doesNotMatch(madeira.match.label, /regular/i);
assert.equal(madeira.card.stale, false);

const stAugustine = line("st-augustine-municipal-marina", "gasoline");
assert.equal(stAugustine.match.label, "Gasoline");
assert.equal(stAugustine.match.figure, "$6.59");
assert.equal(stAugustine.match.asOf, "Oct 7, 2026");
assert.doesNotMatch(stAugustine.match.label, /regular/i);

const beforeArlington = line("arlington-marina", "gasoline", Date.parse("2026-10-03T21:00:00Z"));
assert.equal(beforeArlington.match.figure, "$6.399");
assert.equal(beforeArlington.match.asOf, DATE_UNKNOWN);
assert.equal(beforeArlington.card.stale, true);
const arlingtonOn = Date.parse("2026-10-05T22:00:00Z");
const arlington = line("arlington-marina", "gasoline", arlingtonOn);
assert.equal(arlington.match.label, "Gasoline");
assert.equal(arlington.match.figure, "$6.399");
assert.equal(arlington.match.asOf, "Oct 5, 2026");
assert.equal(arlington.card.stale, false);
assert.equal(line("arlington-marina", "diesel", arlingtonOn).match.figure, "$5.999");
assert.equal(line("arlington-marina", "diesel", arlingtonOn).match.asOf, "Oct 5, 2026");

const hyC = line("houston-yacht-club", "89");
assert.equal(hyC.match.label, "89 E10");
assert.equal(hyC.match.figure, CALL_FIGURE);
assert.equal(hyC.match.asOf, DATE_UNKNOWN);
assert.equal(hyC.card.note, "Members’ dock");
assert.equal(hyC.card.stale, true);
assert.doesNotMatch(JSON.stringify(hyC.card), /reciprocal|Waterway Guide/i);

for (const dock of docks) {
  for (const quote of dock.quotes) {
    const label = gradeLabel(quote);
    assert.doesNotMatch(label, /regular/i, `${dock.id} ${quote.product} labeled Regular`);
    if (quote.ethanol === "E0") assert.match(label, /\bE0\b/);
  }
  const card = toPostedCard(dock, readOn);
  if (!card) continue;
  assert.equal(card.callHref, callHref(dock.phone));
  assert.equal(card.callHref, dock.phone ? telHref(dock.phone) : null);
  if (!card.callHref) assert.equal(card.phone, null);
  assert.match(card.directionsHref, new RegExp(`${dock.lat},${dock.lng}`));
  dock.quotes.forEach((quote, index) => {
    const row = card.lines[index];
    assert.ok(row);
    assert.equal(row.label, gradeLabel(quote));
    assert.equal(row.figure, postedFigure(quote));
    assert.equal(row.asOf, asOfText(dock, new Date(readOn)));
    if (quote.status !== "posted" || quote.pricePerGallon == null) {
      assert.doesNotMatch(row.figure, /\$/);
      assert.notEqual(row.figure, formatPrice(quote.pricePerGallon));
    } else {
      assert.equal(row.figure, formatPrice(quote.pricePerGallon));
    }
  });
  const dated = asOfText(dock, new Date(readOn)) !== DATE_UNKNOWN;
  assert.equal(card.stale, !dated || freshness(dock, readOn) === "stale");
}

for (const now of [eightDays, fourteenDays, pastFourteen, octNine, octTen]) {
  for (const dock of docks) {
    const card = toPostedCard(dock, now);
    if (!card) continue;
    const dated = asOfText(dock, new Date(now)) !== DATE_UNKNOWN;
    assert.equal(card.stale, !dated || freshness(dock, now) === "stale", `${dock.id} stale mark drifted`);
    if (freshness(dock, now) === "stale") {
      assert.ok(card.lines.some((item) => item.figure.startsWith("$")), `${dock.id} hid a stale price`);
    }
  }
}

const gymStale = line("galveston-yacht-marina", "87", eightDays);
assert.equal(gymStale.card.stale, true);
assert.equal(gymStale.match.figure, "$4.83");
assert.equal(line("lambs-yacht-center", "90", eightDays).card.stale, true);
assert.equal(line("lambs-yacht-center", "90", eightDays).match.figure, "$5.15");
assert.equal(line("madeira-beach-municipal-marina", "gasoline", eightDays).card.stale, false);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", fourteenDays).card.stale, false);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", fourteenDays).match.figure, "$6.05");
assert.equal(line("madeira-beach-municipal-marina", "gasoline", pastFourteen).card.stale, true);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", pastFourteen).match.figure, "$6.05");
assert.equal(line("st-augustine-municipal-marina", "gasoline", octNine).card.stale, false);
assert.equal(line("st-augustine-municipal-marina", "gasoline", octTen).card.stale, true);
assert.equal(line("st-augustine-municipal-marina", "gasoline", octTen).match.figure, "$6.59");

const blue = line("blue-marlin-seabrook", "93");
assert.equal(blue.match.label, "93 E0");
assert.equal(blue.match.figure, CALL_FIGURE);
assert.equal(blue.card.hasPrice, false);
assert.equal(blue.card.stale, false);
assert.ok(blue.card.lines.every((item) => item.figure === CALL_FIGURE));
assert.equal(blue.match.asOf, "Aug 28, 2026");

const guessed: FuelQuote = {
  product: "93",
  pricePerGallon: 9.99,
  ethanol: "E0",
  status: "call",
  taxIncluded: null,
};
assert.equal(postedFigure(guessed), CALL_FIGURE);
assert.equal(gradeLabel(guessed), "93 E0");
assert.doesNotMatch(gradeLabel(guessed), /regular/i);
assert.equal(
  postedFigure({ ...guessed, status: "posted", pricePerGallon: null }),
  CALL_FIGURE,
);
assert.equal(
  postedFigure({ ...guessed, status: "not-sold", pricePerGallon: 9.99 }),
  NOT_SOLD_FIGURE,
);

const mixed = toPostedCard(
  {
    ...dockById("galveston-yacht-marina"),
    id: "mixed-pin",
    quotes: [
      { product: "90", pricePerGallon: 5.15, ethanol: "E0", status: "posted", taxIncluded: null },
      { product: "diesel", pricePerGallon: null, ethanol: "unknown", status: "call", taxIncluded: null },
    ],
  },
  readOn,
);
assert.ok(mixed);
assert.equal(mixed.lines[0]?.figure, "$5.15");
assert.equal(mixed.lines[0]?.label, "90 E0");
assert.equal(mixed.lines[1]?.figure, CALL_FIGURE);
assert.notEqual(mixed.lines[1]?.figure, mixed.lines[0]?.figure);

const blankPhone = toPostedCard({ ...dockById("blue-marlin-seabrook"), id: "no-phone", phone: null }, readOn);
assert.ok(blankPhone);
assert.equal(blankPhone.callHref, null);
assert.equal(blankPhone.phone, null);
assert.match(blankPhone.directionsHref, /29\.54967,-95\.02667/);

const badPhone = toPostedCard(
  { ...dockById("blue-marlin-seabrook"), id: "bad-phone", phone: "ask the dock" },
  readOn,
);
assert.equal(badPhone?.callHref, null);

const noPoint = directionsHref({
  name: "Pier",
  city: "Tampa",
  state: "FL",
  lat: Number.NaN,
  lng: Number.NaN,
});
assert.match(noPoint, /Pier/);
assert.match(noPoint, /Tampa/);
assert.match(noPoint, /FL/);
assert.doesNotMatch(noPoint, /NaN/);

const empty = toPostedCard(
  { ...dockById("blue-marlin-seabrook"), id: "empty-quotes", quotes: [], phone: "(281) 291-7497" },
  readOn,
);
assert.ok(empty);
assert.equal(empty.lines[0]?.figure, CALL_FIGURE);
assert.equal(empty.hasPrice, false);
assert.equal(empty.callHref, "tel:+12812917497");
assert.doesNotMatch(empty.lines[0]?.figure ?? "", /\$/);

const leaky = toPostedCard(
  {
    ...dockById("galveston-yacht-marina"),
    id: "leaky-notes",
    notes: "NYMEX rack invoice should-be TCN Platts RIN",
  },
  readOn,
);
assert.ok(leaky);
assert.doesNotMatch(JSON.stringify(leaky), LEAK);
assert.doesNotMatch(JSON.stringify(cards), LEAK);

const nearestTampa = cardsNearest(cards, 27.803974, -82.795903);
assert.equal(nearestTampa[0]?.id, "madeira-beach-municipal-marina");
assert.ok(
  nearestTampa.findIndex((card) => card.areaId === "galveston-bay") >
    nearestTampa.findIndex((card) => card.id === "st-pete-municipal-marina"),
);
const nearestBay = cardsNearest(cards, 29.319, -94.7789);
assert.equal(nearestBay[0]?.id, "galveston-yacht-marina");
assert.ok(milesBetween(29.319, -94.7789, 27.803974, -82.795903) > 500);
assert.ok(milesBetween(27.8, -82.8, 27.8, -82.8) < 0.01);

const client = readFileSync(path.join(process.cwd(), "src/components/posted-home.tsx"), "utf8");
assert.match(client, /getCurrentPosition/);
assert.match(client, /maximumAge:\s*0/);
assert.match(client, /data-testid="near-me"/);
assert.match(client, /data-testid="area-picker"/);
assert.match(client, />\s*Call\s*</);
assert.match(client, />\s*Directions\s*</);
assert.match(client, />\s*Stale\s*</);
assert.match(client, /As of /);
assert.match(client, /card\.callHref/);
assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|document\.cookie/);
assert.doesNotMatch(client, /useEffect/);
assert.doesNotMatch(client, /Regular/);
assert.match(client, /<details/);
assert.match(client, /More fuel docks, call ahead/);
assert.match(client, /Seen a price\? Report it/);
assert.doesNotMatch(client, /DATE_UNKNOWN \? DATE_UNKNOWN/);

const areaLinks = [
  { id: "all" as const, label: "All", href: "/" },
  ...HOME_AREAS.map((item) => ({
    id: item.id,
    label: item.label,
    href: `/?waters=${item.id}`,
  })),
];
const homeHtml = renderToStaticMarkup(
  createElement(PostedHome, { cards, area: null, links: areaLinks }),
);
assert.doesNotMatch(homeHtml, /Date unknown/);
assert.doesNotMatch(homeHtml, /<details[^>]*\sopen[\s=]/);
assert.match(homeHtml, /More fuel docks, call ahead/);
assert.match(homeHtml, /Seen a price\? Report it/);
assert.match(homeHtml, /id="dock-prices"/);
assert.match(homeHtml, /Fuel prices by dock/);
assert.match(homeHtml, /href="\/report"/);
assert.match(homeHtml, /Galveston Bay<\/a> · 12 docks/);
assert.match(homeHtml, /href="\/area\/galveston-bay"/);
assert.match(homeHtml, /Tampa Bay<\/a> · 6 docks/);
assert.match(homeHtml, /href="\/area\/tampa-bay"/);
assert.match(homeHtml, /Northeast Florida<\/a> · 9 docks/);
assert.match(homeHtml, /href="\/area\/northeast-florida"/);
assert.match(client, /areaPath\(group\.id\)/);
assert.match(client, /stopPropagation/);

function sliceBetween(html: string, start: string, end: string): string {
  const from = html.indexOf(start);
  assert.ok(from >= 0, `missing ${start}`);
  const to = end ? html.indexOf(end, from) : html.length;
  assert.ok(to > from, `missing ${end}`);
  return html.slice(from, to);
}

for (const [id, label] of [
  ["galveston-bay", "Galveston Bay"],
  ["tampa-bay", "Tampa Bay"],
  ["northeast-florida", "Northeast Florida"],
] as const) {
  const block = sliceBetween(homeHtml, `data-testid="posted-call-area-${id}"`, "</details>");
  const unpriced = cardsInArea(cards, id).filter((card) => !card.hasPrice);
  assert.equal((block.match(/<li\b/g) ?? []).length, unpriced.length, `${label} row count`);
  assert.doesNotMatch(block, /Date unknown|As of |Stale|posted-grade-|posted-price-/);
  for (const card of unpriced) {
    assert.equal(
      (block.match(new RegExp(`data-testid="posted-row-${card.id}"`, "g")) ?? []).length,
      1,
      `${card.name} should be one row`,
    );
    assert.equal(card.lines.length > 0, true);
    const row = sliceBetween(block, `data-testid="posted-row-${card.id}"`, "</li>");
    assert.doesNotMatch(row, /\$\d/);
    for (const line of card.lines) {
      assert.equal(row.includes(`>${line.label}<`), false, `${card.name} repeated ${line.label}`);
    }
    if (card.callHref) assert.match(row, /href="tel:/);
    else assert.doesNotMatch(row, />\s*Call\s*</);
    assert.match(row, />\s*Directions\s*</);
  }
}

const gymHtml = sliceBetween(homeHtml, 'data-testid="posted-card-galveston-yacht-marina"', "</article>");
assert.equal((gymHtml.match(/As of /g) ?? []).length, 1);
assert.match(gymHtml, /As of Oct 7, 2026/);
assert.doesNotMatch(gymHtml, /posted-asof-galveston-yacht-marina-87/);
const arlingtonHtml = sliceBetween(homeHtml, 'data-testid="posted-card-arlington-marina"', "</article>");
assert.doesNotMatch(arlingtonHtml, />\s*Stale\s*</);
assert.match(arlingtonHtml, /\$6\.399/);
assert.match(arlingtonHtml, /As of Oct 5, 2026/);
assert.doesNotMatch(arlingtonHtml, /Date unknown/);

const mixedDates = toPostedCard(dockById("galveston-yacht-marina"), readOn);
assert.ok(mixedDates);
mixedDates.id = "mixed-dates";
mixedDates.name = "Mixed Date Dock";
mixedDates.lines = [
  { ...mixedDates.lines[0], asOf: "Oct 1, 2026" },
  { ...mixedDates.lines[1], asOf: "Oct 2, 2026" },
];
const mixedHtml = renderToStaticMarkup(
  createElement(PostedHome, { cards: [mixedDates], area: null, links: areaLinks }),
);
const mixedCard = sliceBetween(mixedHtml, 'data-testid="posted-card-mixed-dates"', "</article>");
assert.doesNotMatch(mixedCard, /As of /);
assert.match(mixedCard, /Oct 1, 2026/);
assert.match(mixedCard, /Oct 2, 2026/);

const headerHtml = renderToStaticMarkup(createElement(SiteHeader));
assert.match(headerHtml, /data-testid="nav-wholesale"[^>]*href="\/wholesale"|href="\/wholesale"[^>]*data-testid="nav-wholesale"/);
assert.match(headerHtml, />\s*Wholesale\s*</);
const headerLabels = [...headerHtml.matchAll(/data-testid="nav-[^"]+"[^>]*>([\s\S]*?)<\/a>/g)].map((match) =>
  (match[1] ?? "").replace(/<[^>]*>/g, "").trim(),
);
assert.equal(headerLabels.at(-1), "Wholesale");
assert.ok(headerHtml.indexOf('href="/about"') < headerHtml.indexOf('href="/wholesale"'));
assert.match(headerHtml, /data-testid="nav-menu"/);
assert.match(headerHtml, /aria-expanded="false"/);
assert.match(headerHtml, /aria-controls="site-menu"/);
const menuHtml = headerHtml.slice(headerHtml.indexOf('data-testid="nav-menu-list"'));
assert.match(menuHtml, /href="\/wholesale"/);
assert.equal(
  [...menuHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((match) => (match[1] ?? "").replace(/<[^>]*>/g, "").trim()).at(-1),
  "Wholesale",
);
const headerSource = readFileSync(path.join(process.cwd(), "src/components/site-header.tsx"), "utf8");
assert.match(headerSource, /Escape/);
assert.match(headerSource, /setOpen\(false\)/);

const welcomeHtml = renderToStaticMarkup(createElement(HomeWelcome));
assert.match(welcomeHtml.replace(/<[^>]+>/g, ""), /Fuel prices at the dock, from Texas to Florida\./);
assert.match(welcomeHtml, /data-testid="home-hero-headline"/);
assert.match(welcomeHtml, /<button[^>]*data-testid="find-fuel-near-me"[^>]*>Find fuel near me<\/button>/);
assert.match(welcomeHtml, /<a[^>]*href="\/report"[^>]*>Report a price<\/a>/);
const welcomeSource = readFileSync(path.join(process.cwd(), "src/components/home-welcome.tsx"), "utf8");
assert.match(welcomeSource, /getElementById\("dock-prices"\)/);
assert.match(welcomeSource, /scrollIntoView/);
assert.match(welcomeSource, /\[data-testid=near-me\]/);
assert.doesNotMatch(welcomeSource, LEAK);

const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(homeSource, /<PostedHome/);
assert.match(homeSource, /See every fuel dock from Texas to Florida/);
assert.match(homeSource, /data-testid="see-every-dock"/);
assert.doesNotMatch(homeSource, /<DockBoard/);
assert.doesNotMatch(homeSource, /data-testid="landing"/);
assert.doesNotMatch(homeSource, LEAK);
const fuelPageSource = readFileSync(path.join(process.cwd(), "src/app/board/page.tsx"), "utf8");
assert.match(fuelPageSource, /data-testid="landing"/);
assert.match(fuelPageSource, /data-testid="hero-headline"/);
assert.doesNotMatch(fuelPageSource, LEAK);

const reportForm = readFileSync(path.join(process.cwd(), "src/components/report-form.tsx"), "utf8");
assert.match(reportForm, /defaultValue=\{today\}/);
assert.doesNotMatch(reportForm, /getDate\(\)/);
const reportPageSource = readFileSync(path.join(process.cwd(), "src/app/report/page.tsx"), "utf8");
assert.match(reportPageSource, /chicagoToday\(/);
const priceReportSource = readFileSync(path.join(process.cwd(), "src/lib/price-report.ts"), "utf8");
assert.match(priceReportSource, /America\/Chicago/);

const gymDock = dockById("galveston-yacht-marina");
assert.equal(gymDock.lastVerifiedAt, "2026-10-07");
assert.equal(gymDock.lastVerifiedSource, "marina site");
assert.equal(gymDock.sourceUrl, "https://galvestonyachtbasin.com/");
assert.equal(dockTimeZone(gymDock), "America/Chicago");
assert.equal(asOfText(gymDock, new Date()), "Oct 7, 2026");
const gymNow = toPostedCard(gymDock, Date.now());
assert.ok(gymNow);
assert.equal(gymNow.lines.length, 3);
for (const row of gymNow.lines) {
  assert.equal(row.asOf, "Oct 7, 2026");
  assert.equal(row.asOf, asOfText(gymDock, new Date()));
  assert.notEqual(row.figure, "$5.28");
  assert.notEqual(row.label, "90 E0");
}
assert.deepEqual(
  gymNow.lines.map((row) => `${row.label} ${row.figure}`),
  ["87 $4.83", "93 E0 $6.27", "Diesel $6.33"],
);

const noon = sourceInstant("2026-10-03");
assert.ok(noon);
const noonChicago = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
}).format(noon);
assert.equal(noonChicago, "Oct 3, 2026");
const utcMidnightInChicago = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
}).format(new Date("2026-10-03T00:00:00Z"));
assert.equal(utcMidnightInChicago, "Oct 2, 2026");
assert.notEqual(asOfText(gymDock, new Date()), utcMidnightInChicago);
assert.equal(
  civilDate(new Date("2026-10-06T02:43:20.452Z"), "America/Chicago"),
  "2026-10-05",
);

const chicagoToday = chicagoCivilDate(new Date());
for (const dock of docks) {
  const card = toPostedCard(dock, Date.now());
  if (!card) continue;
  for (const row of card.lines) {
    if (row.asOf === DATE_UNKNOWN) continue;
    const instant = sourceInstant(dock.lastVerifiedAt ?? "");
    assert.ok(instant, `${dock.id} rendered ${row.asOf} without a stored date`);
    const day = civilDate(instant, dockTimeZone(dock));
    assert.ok(day <= chicagoToday, `${dock.id} ${row.label} ${row.asOf} is after ${chicagoToday}`);
    assert.equal(row.asOf, asOfText(dock, new Date()));
  }
}

const undated = toPostedCard(
  { ...gymDock, id: "missing-source-date", lastVerifiedAt: null },
  Date.now(),
);
assert.ok(undated);
assert.equal(undated.stale, true);
assert.ok(undated.lines.every((row) => row.asOf === DATE_UNKNOWN));
assert.equal(undated.lines[0]?.figure, "$4.83");

const laterDay = "2099-01-01";
assert.ok(laterDay > chicagoToday);
const futureDated = toPostedCard(
  { ...gymDock, id: "future-source-date", lastVerifiedAt: laterDay },
  Date.now(),
);
assert.ok(futureDated);
assert.equal(futureDated.stale, true);
for (const row of futureDated.lines) {
  assert.equal(row.asOf, DATE_UNKNOWN);
  assert.notEqual(row.asOf, "Jan 1, 2099");
}

const strayDock: Dock = {
  ...gymDock,
  id: "stray-rec-90",
  lastVerifiedSource: "user report",
  lastVerifiedAt: "2099-06-01",
  sourceUrl: null,
  quotes: [
    ...gymDock.quotes,
    { product: "90", pricePerGallon: 5.28, ethanol: "E0", status: "posted", taxIncluded: null },
  ],
};
assert.equal(quotesOnHome(strayDock).length, 0);
const reviewedDock: Dock = {
  ...strayDock,
  id: "reviewed-rec-90",
  lastVerifiedSource: "boater report (reviewed)",
};
assert.equal(
  quotesOnHome(reviewedDock).some((quote) => quote.pricePerGallon === 5.28),
  true,
);
assert.equal(
  quotesOnHome({ ...reviewedDock, lastVerifiedSource: "user report" }).some(
    (quote) => quote.pricePerGallon === 5.28,
  ),
  false,
);
const stray = toPostedCard(strayDock, Date.now());
assert.ok(stray);
assert.equal(stray.lines.length, 1);
assert.equal(stray.lines[0]?.figure, CALL_FIGURE);
assert.equal(stray.lines[0]?.asOf, DATE_UNKNOWN);
assert.equal(stray.stale, true);
assert.equal(
  stray.lines.some((row) => row.label === "90 E0" || row.figure === "$5.28"),
  false,
);

readDocks()
  .then((live) => {
    const liveGym = live.find((dock) => dock.id === "galveston-yacht-marina");
    assert.ok(liveGym);
    assert.equal(liveGym.lastVerifiedSource, "marina site");
    assert.equal(liveGym.lastVerifiedAt, "2026-10-07");
    assert.equal(liveGym.sourceUrl, "https://galvestonyachtbasin.com/");
    assert.equal(
      liveGym.quotes.some((quote) => quote.product === "90" || quote.pricePerGallon === 5.28),
      false,
    );
    const liveCard = toPostedCard(liveGym, Date.now());
    assert.ok(liveCard);
    for (const row of liveCard.lines) {
      assert.equal(row.asOf, "Oct 7, 2026");
      assert.notEqual(row.figure, "$5.28");
    }
    console.log(`posted ok — ${cards.length} docks on the home list`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
