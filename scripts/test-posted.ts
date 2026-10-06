import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import seed from "../data/docks.seed.json";
import { formatDate, formatPrice, telHref } from "../src/lib/format";
import { freshness } from "../src/lib/freshness";
import {
  CALL_FIGURE,
  HOME_AREAS,
  NOT_SOLD_FIGURE,
  callHref,
  cardsInArea,
  cardsNearest,
  directionsHref,
  gradeLabel,
  homeArea,
  homeAreaHref,
  homeCards,
  milesBetween,
  parseHomeArea,
  postedFigure,
  toPostedCard,
} from "../src/lib/posted";
import type { Dock, FuelQuote } from "../src/lib/types";

const docks = seed.docks as Dock[];
const readOn = Date.parse("2026-10-03T21:00:00Z");
const eightDays = Date.parse("2026-10-11T00:00:00Z");
const fourteenDays = Date.parse("2026-10-17T00:00:00Z");
const pastFourteen = Date.parse("2026-10-18T00:00:00Z");
const octNine = Date.parse("2026-10-09T00:00:00Z");
const octTen = Date.parse("2026-10-10T00:00:00Z");

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
for (const file of ["src/lib/posted.ts", "src/components/posted-home.tsx", "src/app/page.tsx"]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  for (const id of pricedIds) {
    assert.equal(text.includes(id), false, `${file} hardcoded ${id}`);
  }
  assert.doesNotMatch(text, LEAK, `${file} leaked a wholesale term`);
  assert.doesNotMatch(text, /dock\.notes/);
}

assert.equal(cardsInArea(cards, "galveston-bay")[0]?.id, "galveston-yacht-marina");
assert.equal(cardsInArea(cards, "tampa-bay")[0]?.id, "madeira-beach-municipal-marina");
assert.equal(cardsInArea(cards, "northeast-florida")[0]?.id, "lambs-yacht-center");
assert.equal(cardsInArea(cards, "northeast-florida").at(-1)?.id, "fernandina-harbor-marina");
assert.ok(cardsInArea(cards, "galveston-bay").every((card, index, list) => index === 0 || !card.hasPrice || list[index - 1]?.hasPrice));

const gym = line("galveston-yacht-marina", "87");
assert.equal(gym.match.label, "87");
assert.equal(gym.match.figure, "$4.830");
assert.equal(gym.match.asOf, "Oct 3, 2026");
assert.equal(gym.card.stale, false);
const gymE0 = line("galveston-yacht-marina", "93");
assert.equal(gymE0.match.label, "93 E0");
assert.equal(gymE0.match.figure, "$6.270");
assert.doesNotMatch(gymE0.match.label, /regular/i);
assert.equal(line("galveston-yacht-marina", "diesel").match.label, "Diesel");
assert.equal(line("galveston-yacht-marina", "diesel").match.figure, "$6.330");

const lambs = line("lambs-yacht-center", "90");
assert.equal(lambs.match.label, "90 E0");
assert.equal(lambs.match.figure, "$5.150");
assert.doesNotMatch(lambs.match.label, /regular/i);
assert.equal(lambs.card.stale, false);

const madeira = line("madeira-beach-municipal-marina", "gasoline");
assert.equal(madeira.match.label, "Gasoline E0");
assert.equal(madeira.match.figure, "$6.050");
assert.doesNotMatch(madeira.match.label, /regular/i);
assert.equal(madeira.card.stale, false);

const stAugustine = line("st-augustine-municipal-marina", "gasoline");
assert.equal(stAugustine.match.label, "Gasoline");
assert.equal(stAugustine.match.figure, "$6.590");
assert.equal(stAugustine.match.asOf, "Sep 25, 2026");
assert.doesNotMatch(stAugustine.match.label, /regular/i);

const hyC = line("houston-yacht-club", "89");
assert.equal(hyC.match.label, "89 E10");
assert.equal(hyC.match.figure, CALL_FIGURE);
assert.equal(hyC.match.asOf, "—");
assert.equal(hyC.card.note, "Members’ dock");
assert.equal(hyC.card.stale, false);
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
    assert.equal(row.asOf, formatDate(dock.lastVerifiedAt));
    if (quote.status !== "posted" || quote.pricePerGallon == null) {
      assert.doesNotMatch(row.figure, /\$/);
      assert.notEqual(row.figure, formatPrice(quote.pricePerGallon));
    } else {
      assert.equal(row.figure, formatPrice(quote.pricePerGallon));
    }
  });
  assert.equal(card.stale, freshness(dock, readOn) === "stale");
}

for (const now of [eightDays, fourteenDays, pastFourteen, octNine, octTen]) {
  for (const dock of docks) {
    const card = toPostedCard(dock, now);
    if (!card) continue;
    assert.equal(card.stale, freshness(dock, now) === "stale", `${dock.id} stale mark drifted`);
    if (card.stale) {
      assert.ok(card.lines.some((item) => item.figure.startsWith("$")), `${dock.id} hid a stale price`);
    }
  }
}

const gymStale = line("galveston-yacht-marina", "87", eightDays);
assert.equal(gymStale.card.stale, true);
assert.equal(gymStale.match.figure, "$4.830");
assert.equal(line("lambs-yacht-center", "90", eightDays).card.stale, true);
assert.equal(line("lambs-yacht-center", "90", eightDays).match.figure, "$5.150");
assert.equal(line("madeira-beach-municipal-marina", "gasoline", eightDays).card.stale, false);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", fourteenDays).card.stale, false);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", fourteenDays).match.figure, "$6.050");
assert.equal(line("madeira-beach-municipal-marina", "gasoline", pastFourteen).card.stale, true);
assert.equal(line("madeira-beach-municipal-marina", "gasoline", pastFourteen).match.figure, "$6.050");
assert.equal(line("st-augustine-municipal-marina", "gasoline", octNine).card.stale, false);
assert.equal(line("st-augustine-municipal-marina", "gasoline", octTen).card.stale, true);
assert.equal(line("st-augustine-municipal-marina", "gasoline", octTen).match.figure, "$6.590");

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
assert.equal(mixed.lines[0]?.figure, "$5.150");
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

const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(homeSource, /<PostedHome/);
assert.match(homeSource, /data-testid="landing"/);
assert.match(homeSource, /data-testid="hero-headline"/);
assert.doesNotMatch(homeSource, LEAK);

console.log(`posted ok — ${cards.length} docks on the home list`);
