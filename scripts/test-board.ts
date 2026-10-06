import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { boardHref, dockPath, filterDocks, parseBoardQuery, matchesSearch, viewLabel } from "../src/lib/board-query";
import { ethanolCopy, formatDate, formatGallonPrice, formatQuote, quoteParts, telHref } from "../src/lib/format";
import {
  boardQuote,
  boardTally,
  displayGas,
  freshness,
  freshnessLabel,
  hasEthanolFreeGas,
  isMarinaSite,
  heroCountLine,
  pinAriaLabel,
  pinKind,
  pinQuoteSlots,
  pinTrust,
  publicBadge,
  publicCallLine,
  publicSource,
} from "../src/lib/freshness";
import { mergeParsedIntoDocks } from "../src/lib/waterway-guide";
import { DEFAULT_X_HANDLE, publicXHandle, xProfileUrl } from "../src/lib/x-handle";
import seed from "../data/docks.seed.json";
import { latToTileY, lngToTileX } from "../src/lib/geo";
import { tileGridForZoom, viewForBoard } from "../src/lib/map-view";
import { CORRIDORS, STATE_CODES, type Dock, type StateCode } from "../src/lib/types";
import { briefCoastsFor, conditionsHref, sisterHomeHref } from "../src/lib/sister";

const docks = seed.docks as Dock[];

const galvestonLine = conditionsHref({ corridor: "galveston-bay" });
assert.equal(galvestonLine.label, "This morning on Galveston");
assert.match(galvestonLine.href, /theater=texas/);
assert.match(galvestonLine.href, /area=galveston/);
assert.match(galvestonLine.href, /utm_source=dockposted/);
assert.equal(conditionsHref({ city: "Port Arthur", state: "TX" }).area, "sabine");
assert.equal(conditionsHref({ city: "Key Largo", corridor: "upper-keys" }).area, "key-largo");
assert.equal(conditionsHref({ city: "Key West", region: "keys" }).area, "key-west");
assert.equal(conditionsHref({ city: "Rockport", region: "texas" }).area, "aransas");
assert.equal(conditionsHref({ region: "louisiana" }).area, "venice");
assert.equal(conditionsHref({ region: "west-florida" }).area, "boca-grande");
assert.deepEqual(briefCoastsFor({ region: "texas" }), [
  "sabine",
  "galveston",
  "matagorda",
  "aransas",
  "corpus",
  "baffin",
  "lower-laguna",
]);
assert.deepEqual(briefCoastsFor({ corridor: "galveston-bay" }), ["galveston"]);
assert.match(sisterHomeHref(), /^https:\/\/onthiswater\.com\/\?utm_source=dockposted/);
assert.match(
  readFileSync(path.join(process.cwd(), "src/components/dock-board.tsx"), "utf8"),
  /SisterHandoff/,
);
assert.match(
  readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8"),
  /SisterHandoff/,
);
assert.match(
  readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8"),
  /sisterHomeHref/,
);

assert.ok(docks.length >= 90, `expected a coastal set, got ${docks.length}`);

const chicagoToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const readMonths: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};
for (const dock of docks) {
  if (dock.lastVerifiedAt) {
    assert.match(dock.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${dock.id} date is not YYYY-MM-DD`);
    assert.ok(
      dock.lastVerifiedAt <= chicagoToday,
      `${dock.id} lastVerifiedAt ${dock.lastVerifiedAt} is after ${chicagoToday} in America/Chicago`,
    );
  }
  for (const match of (dock.notes ?? "").matchAll(/read (\d{1,2}) ([A-Z][a-z]{2}) (\d{4})/g)) {
    const month = readMonths[match[2] ?? ""];
    assert.ok(month, `${dock.id} read date has an unknown month ${match[2]}`);
    const iso = `${match[3]}-${month}-${(match[1] ?? "").padStart(2, "0")}`;
    assert.ok(
      iso <= chicagoToday,
      `${dock.id} read date ${iso} is after ${chicagoToday} in America/Chicago`,
    );
  }
}

assert.ok(docks.every((dock) => dock.region && dock.state && dock.city));
assert.ok(docks.every((dock) => Number.isFinite(dock.lat) && Number.isFinite(dock.lng)));
assert.ok(!docks.some((dock) => dock.id === "kemah-boardwalk-marina"));
assert.ok(!docks.some((dock) => dock.id === "watergate-yachting-center"));
assert.ok(!docks.some((dock) => /waterford|legend point|portofino|tcyc|corinthian/i.test(`${dock.id} ${dock.name}`)));

for (const dock of docks) {
  for (const quote of dock.quotes) {
    if (quote.status === "posted") {
      assert.ok(quote.pricePerGallon != null, `${dock.id} posted without a number`);
      assert.ok(dock.sourceUrl, `${dock.id} posted without a sourceUrl`);
    }
    if (quote.pricePerGallon != null) {
      assert.equal(quote.status, "posted", `${dock.id} has a dollar with status ${quote.status}`);
    }
  }
}

const coast = filterDocks(docks, parseBoardQuery({}));
assert.equal(coast.inCorridor.length, docks.length);
assert.equal(coast.visible.length, docks.length);
assert.ok(coast.visible.length > 90, `bare / should show the full seed, got ${coast.visible.length}`);
assert.ok(coast.visible.some((dock) => dock.corridor === "galveston-bay"));
assert.ok(coast.visible.some((dock) => dock.corridor === "upper-keys"));
assert.ok(coast.visible.some((dock) => dock.state === "ME"));
assert.ok(coast.visible.some((dock) => dock.id === "pleasure-island-marina"));
assert.equal(viewLabel(parseBoardQuery({})), "Sabine to Maine");
assert.equal(parseBoardQuery({}).corridor, null);

const texas = filterDocks(docks, parseBoardQuery({ corridor: "galveston-bay" }));
assert.ok(texas.inCorridor.length > 7, `bay corridor should densify past 7, got ${texas.inCorridor.length}`);
assert.equal(texas.visible.length, texas.inCorridor.length);
assert.ok(texas.visible.every((dock) => dock.corridor === "galveston-bay"));
assert.deepEqual(
  texas.visible.slice(0, 5).map((dock) => dock.id),
  [
    "marina-bay-harbor",
    "blue-marlin-seabrook",
    "south-shore-harbour",
    "bayland-marina",
    "marinemax-houston",
  ],
);
assert.equal(texas.visible[0].name, "Marina Bay Harbor");
assert.equal(texas.visible[1].name, "Blue Marlin Fuel Dock");
assert.equal(texas.visible[2].name, "South Shore Harbour Fuel Pier");
assert.equal(texas.visible.at(-1)?.id, "galveston-yacht-marina");
assert.ok(texas.visible.some((dock) => dock.id === "harborwalk-hitchcock"));
assert.ok(texas.visible.some((dock) => dock.id === "eagle-point-san-leon"));
assert.ok(texas.visible.some((dock) => dock.id === "pelican-rest-marina"));

const keys = filterDocks(docks, parseBoardQuery({ corridor: "upper-keys" }));
assert.equal(keys.inCorridor.length, 7);
assert.ok(keys.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(keys.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(keys.visible.some((dock) => dock.id === "ocean-reef-club"));
assert.ok(!keys.visible.some((dock) => dock.corridor === "galveston-bay"));
assert.ok(!keys.visible.some((dock) => dock.city === "Islamorada"));
assert.deepEqual(
  keys.visible.slice(0, 5).map((dock) => dock.id),
  [
    "key-largo-harbor",
    "marina-del-mar",
    "pilot-house-marina",
    "garden-cove-marina",
    "ocean-reef-club",
  ],
);

const keysRegion = filterDocks(docks, parseBoardQuery({ region: "keys" }));
assert.ok(keysRegion.visible.some((dock) => dock.id === "islamarina"));
assert.ok(keysRegion.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(docks.every((dock) => !/cavalier/i.test(`${dock.id} ${dock.name}`)));

const oceanReef = docks.find((dock) => dock.id === "ocean-reef-club");
assert.ok(oceanReef);
assert.equal(oceanReef.access, "members");
assert.ok(oceanReef.quotes.every((quote) => quote.pricePerGallon == null));
assert.ok(/members only/i.test(oceanReef.notes ?? ""));
assert.match(oceanReef.hours ?? "", /7am–6pm/);

const marinaDelMar = docks.find((dock) => dock.id === "marina-del-mar");
assert.ok(marinaDelMar);
assert.ok(marinaDelMar.quotes.every((quote) => quote.pricePerGallon == null));

const e0 = filterDocks(docks, parseBoardQuery({ e0: "1" }));
assert.ok(e0.visible.length < e0.inCorridor.length);
assert.ok(e0.visible.every((dock) => dock.ethanol === "E0"));
assert.ok(!e0.visible.some((dock) => dock.id === "south-shore-harbour"));

const fresh = filterDocks(docks, parseBoardQuery({ fresh: "1" }));
assert.ok(fresh.visible.length < fresh.inCorridor.length);
assert.ok(fresh.visible.every((dock) => dock.lastVerifiedAt));
assert.ok(fresh.visible.every((dock) => freshness(dock) === "fresh"));

const texasState = filterDocks(docks, parseBoardQuery({ state: "TX" }));
assert.ok(texasState.inCorridor.length > texas.inCorridor.length);
assert.ok(texasState.visible.every((dock) => dock.state === "TX"));
assert.ok(texasState.visible.some((dock) => dock.id === "cove-harbor-rockport"));
assert.ok(!texasState.visible.some((dock) => dock.id === "kemah-boardwalk-marina"));

const newEngland = filterDocks(docks, parseBoardQuery({ region: "new-england" }));
assert.ok(newEngland.visible.length >= 8);
assert.ok(newEngland.visible.every((dock) => dock.region === "new-england"));

const search = filterDocks(docks, parseBoardQuery({ q: "key largo" }));
assert.ok(search.visible.some((dock) => dock.id === "key-largo-harbor"));
assert.ok(search.visible.some((dock) => dock.id === "marina-del-mar"));
assert.ok(search.visible.every((dock) => matchesSearch(dock, "key largo")));

const statesPresent = new Set(docks.map((dock) => dock.state));
for (const state of STATE_CODES) {
  assert.ok(statesPresent.has(state as StateCode), `missing state ${state}`);
}

const marinaBay = docks.find((dock) => dock.id === "marina-bay-harbor");
assert.ok(marinaBay);
assert.equal(
  formatQuote(marinaBay.quotes.find((quote) => quote.product === "87") ?? null),
  "Gas: no price posted. Call the dock.",
);
assert.equal(marinaBay.flags?.includes("last-pump"), true);
assert.equal(marinaBay.flags?.includes("still-open"), false);
assert.match(marinaBay.hours ?? "", /store only, not the hose/);
assert.equal(marinaBay.phone, "(281) 535-2222");
assert.doesNotMatch(marinaBay.phone ?? "", /549-4772/);
assert.equal(pinTrust(marinaBay), "unverified");

const hemingwayHome = ["key-west-bight-marina", "conch-harbor-marina", "galleon-marina"];
for (const id of hemingwayHome) {
  const dock = docks.find((row) => row.id === id);
  assert.ok(dock, `missing Hemingway home dock ${id}`);
  assert.equal(dock.access, "public", `${id} must stay unlocked`);
}

const gym = docks.find((dock) => dock.id === "galveston-yacht-marina");
assert.ok(gym);
assert.equal(pinTrust(gym), "verified");
assert.equal(gym.lastVerifiedAt, "2026-10-03");
assert.equal(gym.lastVerifiedSource, "marina site");
assert.equal(gym.sourceUrl, "https://galvestonyachtbasin.com/");
assert.deepEqual(
  gym.quotes.map((quote) => [quote.product, quote.pricePerGallon, quote.ethanol, quote.taxIncluded]),
  [
    ["87", 4.83, "unknown", null],
    ["93", 6.27, "E0", null],
    ["diesel", 6.33, "unknown", null],
  ],
);
assert.match(gym.hours ?? "", /Daily 9AM–7PM/);
assert.match(gym.hours ?? "", /fuel dock Daily 6:00am–5:00pm/);
assert.match(gym.hours ?? "", /store and ramp 6:00am–5:00pm/);
assert.match(gym.notes ?? "", /Diesel \$6\.33/);
assert.match(gym.notes ?? "", /Regular 87 \$4\.83/);
assert.match(gym.notes ?? "", /Non-Ethanol 93 \$6\.27/);
assert.match(gym.notes ?? "", /don't agree/);
assert.doesNotMatch(`${gym.hours ?? ""} ${gym.notes ?? ""}`, /waterdog/i);
assert.equal(displayGas(gym)?.product, "93");
assert.equal(displayGas(gym)?.pricePerGallon, 6.27);
const gymSlots = pinQuoteSlots(gym, Date.parse("2026-10-03T18:00:00Z"));
assert.deepEqual(
  gymSlots.map((slot) => [slot.id, slot.label, slot.quote?.product, slot.quote?.pricePerGallon]),
  [
    ["gas-87", "Regular gas, 87 octane, ethanol not stated", "87", 4.83],
    ["gas-93", "Gas, no ethanol, 93 octane", "93", 6.27],
    ["diesel", "Diesel", "diesel", 6.33],
  ],
);
assert.equal(
  formatQuote(gymSlots.find((slot) => slot.id === "gas-87")?.quote ?? null),
  "$4.83 a gallon. Regular gas, 87 octane, ethanol not stated, tax not stated",
);
assert.equal(
  formatQuote(gymSlots.find((slot) => slot.id === "gas-93")?.quote ?? null),
  "$6.27 a gallon. Gas, no ethanol, 93 octane, tax not stated",
);
assert.equal(formatQuote(gymSlots.find((slot) => slot.id === "diesel")?.quote ?? null), "$6.33 a gallon. Diesel, tax not stated");
assert.ok(gymSlots.every((slot) => slot.label !== "Regular"));
const mangrove = docks.find((dock) => dock.id === "mangrove-marina");
assert.ok(mangrove);
assert.deepEqual(
  pinQuoteSlots(mangrove, Date.parse("2026-08-28T18:00:00Z")).map((slot) => [
    slot.id,
    slot.label,
    slot.quote?.product,
    slot.quote?.pricePerGallon,
  ]),
  [
    ["gas-90", "Gas, no ethanol, 90 octane", "90", 6.27],
    ["diesel", "Diesel", "diesel", 6.18],
  ],
);

const stAugustine = docks.find((dock) => dock.id === "st-augustine-municipal-marina");
assert.ok(stAugustine);
assert.equal(stAugustine.region, "east-florida");
assert.equal(stAugustine.lastVerifiedAt, "2026-09-25");
assert.equal(stAugustine.lastVerifiedSource, "marina site");
assert.equal(stAugustine.sourceUrl, "https://www.citystaug.com/338/Rates");
assert.equal(stAugustine.website, "https://www.citystaug.com/marina");
assert.equal(stAugustine.ethanol, "unknown");
assert.deepEqual(
  stAugustine.quotes.map((quote) => [
    quote.product,
    quote.pricePerGallon,
    quote.ethanol,
    quote.taxIncluded,
    quote.status,
  ]),
  [
    ["gasoline", 6.59, "unknown", null, "posted"],
    ["diesel", 7.39, "unknown", null, "posted"],
  ],
);
assert.equal(formatDate("2026-09-25"), "Sep 25, 2026");
assert.equal(formatDate("2026-10-03"), "Oct 3, 2026");
assert.equal(formatDate("2022-08-26"), "Aug 26, 2022");
assert.equal(formatDate(null), "—");
const readOn = Date.parse("2026-10-03T21:00:00Z");
assert.equal(freshness(stAugustine, readOn), "fresh");
assert.equal(pinTrust(stAugustine), "verified");
const stAugustineSlots = pinQuoteSlots(stAugustine, readOn);
assert.deepEqual(
  stAugustineSlots.map((slot) => [slot.id, slot.label, slot.quote?.product, slot.quote?.pricePerGallon]),
  [
    ["gas-gasoline", "Gas, octane and ethanol not stated", "gasoline", 6.59],
    ["diesel", "Diesel", "diesel", 7.39],
  ],
);
assert.equal(
  formatQuote(stAugustineSlots[0]?.quote ?? null),
  "$6.59 a gallon. Gas, octane and ethanol not stated, tax not stated",
);
assert.equal(formatQuote(stAugustineSlots[1]?.quote ?? null), "$7.39 a gallon. Diesel, tax not stated");
assert.deepEqual(
  stAugustine.quotes.map((quote) => quote.product),
  ["gasoline", "diesel"],
);
assert.ok(stAugustine.quotes.every((quote) => quote.ethanol === "unknown" && quote.taxIncluded == null));
assert.ok(
  stAugustineSlots.every(
    (slot) => slot.label === "Gas, octane and ethanol not stated" || slot.label === "Diesel",
  ),
);
assert.equal(freshness(stAugustine, Date.parse("2026-10-10T00:00:00Z")), "stale");
assert.equal(
  boardQuote(stAugustine, stAugustine.quotes[0] ?? null, Date.parse("2026-10-10T00:00:00Z"))?.pricePerGallon,
  null,
);
assert.equal(freshness(gym, Date.parse("2026-10-11T00:00:00Z")), "stale");
const withoutStAugustine = docks.filter((dock) => dock.id !== "st-augustine-municipal-marina");
assert.equal(
  boardTally(docks, readOn).postedThisWeek,
  boardTally(withoutStAugustine, readOn).postedThisWeek + 1,
);

const madeira = docks.find((dock) => dock.id === "madeira-beach-municipal-marina");
assert.ok(madeira);
assert.equal(madeira.region, "west-florida");
assert.equal(madeira.corridor, null);
assert.equal(madeira.city, "Madeira Beach");
assert.equal(madeira.state, "FL");
assert.equal(madeira.lat, 27.803974);
assert.equal(madeira.lng, -82.795903);
assert.equal(madeira.phone, "(727) 399-2631");
assert.equal(madeira.website, "https://madeirabeachfl.gov/departments/marina/");
assert.equal(madeira.sourceUrl, "https://madeirabeachfl.gov/departments/marina/");
assert.equal(madeira.lastVerifiedAt, "2026-10-03");
assert.equal(madeira.lastVerifiedSource, "marina site");
assert.equal(madeira.ethanol, "E0");
assert.equal(
  madeira.hours,
  "Open 7 days. Monday–Thursday 7:00 AM–7:00 PM, Friday–Sunday 7:00 AM–8:00 PM. Closed Thanksgiving and Christmas Day.",
);
assert.match(madeira.notes ?? "", /did not date the price/);
assert.match(madeira.notes ?? "", /read 3 Oct 2026/);
assert.match(madeira.notes ?? "", /bcrabtree@madeirabeachfl.gov/);
assert.match(madeira.notes ?? "", /27\.803974, -82\.795903/);
assert.match(madeira.notes ?? "", /named node is the pin/);
assert.doesNotMatch(madeira.notes ?? "", /as of/i);
assert.deepEqual(
  madeira.quotes.map((quote) => [
    quote.product,
    quote.pricePerGallon,
    quote.ethanol,
    quote.taxIncluded,
    quote.status,
  ]),
  [
    ["gasoline", 6.05, "E0", null, "posted"],
    ["diesel", 6.65, "unknown", null, "posted"],
  ],
);
assert.ok(madeira.quotes.every((quote) => quote.product === "gasoline" || quote.product === "diesel"));
assert.equal(pinTrust(madeira), "verified");
assert.equal(freshness(madeira, readOn), "fresh");
const madeiraSlots = pinQuoteSlots(madeira, readOn);
assert.deepEqual(
  madeiraSlots.map((slot) => [slot.id, slot.label, slot.quote?.product, slot.quote?.pricePerGallon, slot.quote?.ethanol]),
  [
    ["gas-gasoline", "Gas, no ethanol, octane not stated", "gasoline", 6.05, "E0"],
    ["diesel", "Diesel", "diesel", 6.65, "unknown"],
  ],
);
assert.equal(
  formatQuote(madeiraSlots[0]?.quote ?? null),
  "$6.05 a gallon. Gas, no ethanol, octane not stated, tax not stated",
);
assert.equal(formatQuote(madeiraSlots[1]?.quote ?? null), "$6.65 a gallon. Diesel, tax not stated");
assert.equal(
  quoteParts(madeiraSlots[0]?.quote ?? null).rest,
  "Gas, no ethanol, octane not stated, tax not stated",
);
assert.equal(ethanolCopy(madeira.ethanol), "E0");
assert.ok(
  madeiraSlots.every(
    (slot) => slot.label === "Gas, no ethanol, octane not stated" || slot.label === "Diesel",
  ),
);
assert.ok(!madeiraSlots.some((slot) => /87|89|90|93/.test(`${slot.label} ${slot.quote?.product ?? ""}`)));
const eightDays = Date.parse("2026-10-11T00:00:00Z");
const fourteenDays = Date.parse("2026-10-17T00:00:00Z");
const pastFourteen = Date.parse("2026-10-18T00:00:00Z");
assert.equal(freshness(madeira, eightDays), "fresh");
assert.equal(freshness(madeira, fourteenDays), "fresh");
assert.equal(freshness(madeira, pastFourteen), "stale");
assert.equal(boardQuote(madeira, madeira.quotes[0] ?? null, eightDays)?.pricePerGallon, 6.05);
assert.equal(boardQuote(madeira, madeira.quotes[0] ?? null, pastFourteen)?.pricePerGallon, null);
assert.equal(freshness(gym, eightDays), "stale");
assert.equal(
  boardQuote(gym, gym.quotes.find((quote) => quote.product === "87") ?? null, eightDays)?.pricePerGallon,
  null,
);
assert.equal(
  boardQuote(gym, gym.quotes.find((quote) => quote.product === "87") ?? null, eightDays)?.status,
  "call",
);
const withoutMadeira = docks.filter((dock) => dock.id !== "madeira-beach-municipal-marina");
assert.equal(
  boardTally(docks, readOn).postedThisWeek,
  boardTally(withoutMadeira, readOn).postedThisWeek + 1,
);
assert.ok(
  filterDocks(docks, parseBoardQuery({ region: "west-florida" })).visible.some(
    (dock) => dock.id === "madeira-beach-municipal-marina",
  ),
);

const lambs = docks.find((dock) => dock.id === "lambs-yacht-center");
assert.ok(lambs);
assert.equal(lambs.name, "Lamb's Yacht Center");
assert.equal(lambs.region, "east-florida");
assert.equal(lambs.corridor, null);
assert.equal(lambs.city, "Jacksonville");
assert.equal(lambs.state, "FL");
assert.equal(lambs.lat, 30.273784);
assert.equal(lambs.lng, -81.721019);
assert.equal(lambs.phone, "(904) 327-2285");
assert.doesNotMatch(lambs.phone ?? "", /384-5577/);
assert.equal(lambs.website, "https://www.lambsyachtcenter.com/fuel/");
assert.equal(lambs.sourceUrl, "https://www.lambsyachtcenter.com/fuel/");
assert.equal(lambs.lastVerifiedAt, "2026-10-03");
assert.equal(lambs.lastVerifiedSource, "marina site");
assert.equal(lambs.ethanol, "E0");
assert.equal(
  lambs.hours,
  "Two clocks on their fuel page. One is Monday–Friday 8–5, Saturday and Sunday 8:30–4:30. The fuel dock says 7 days a week, 8:30 AM–4:30 PM.",
);
assert.match(lambs.hours ?? "", /Monday–Friday 8–5, Saturday and Sunday 8:30–4:30/);
assert.match(lambs.hours ?? "", /7 days a week, 8:30 AM–4:30 PM/);
assert.doesNotMatch(lambs.hours ?? "", /Near the price|Lower on the page/);
assert.match(lambs.notes ?? "", /did not date the price/);
assert.match(lambs.notes ?? "", /read 3 Oct 2026/);
assert.match(lambs.notes ?? "", /did not choose/);
assert.match(lambs.notes ?? "", /murphy@lambsyachtcenter.com/);
assert.match(lambs.notes ?? "", /\(904\) 384-5577/);
assert.match(lambs.notes ?? "", /10% off Diesel for MTOA and AGLCA members/);
assert.match(lambs.notes ?? "", /30\.273784, -81\.721019/);
assert.match(lambs.notes ?? "", /interpolated across 3354–3480/);
assert.match(lambs.notes ?? "", /not a rooftop/);
assert.match(lambs.notes ?? "", /Pump out \$10 is not fuel/);
assert.doesNotMatch(lambs.notes ?? "", /as of/i);
assert.doesNotMatch(lambs.notes ?? "", /as-of/i);
assert.deepEqual(
  lambs.quotes.map((quote) => [
    quote.product,
    quote.pricePerGallon,
    quote.ethanol,
    quote.taxIncluded,
    quote.status,
  ]),
  [
    ["90", 5.15, "E0", null, "posted"],
    ["diesel", 5.5, "unknown", null, "posted"],
  ],
);
assert.deepEqual(
  lambs.quotes.map((quote) => quote.product),
  ["90", "diesel"],
);
assert.ok(lambs.quotes.every((quote) => quote.taxIncluded == null));
assert.ok(!lambs.quotes.some((quote) => quote.pricePerGallon === 10));
assert.equal(pinTrust(lambs), "verified");
assert.equal(freshness(lambs, readOn), "fresh");
const lambsSlots = pinQuoteSlots(lambs, readOn);
assert.deepEqual(
  lambsSlots.map((slot) => [slot.id, slot.label, slot.quote?.product, slot.quote?.pricePerGallon, slot.quote?.ethanol]),
  [
    ["gas-90", "Gas, no ethanol, 90 octane", "90", 5.15, "E0"],
    ["diesel", "Diesel", "diesel", 5.5, "unknown"],
  ],
);
assert.equal(
  formatQuote(lambsSlots[0]?.quote ?? null),
  "$5.15 a gallon. Gas, no ethanol, 90 octane, tax not stated",
);
assert.equal(formatQuote(lambsSlots[1]?.quote ?? null), "$5.50 a gallon. Diesel, tax not stated");
assert.equal(quoteParts(lambsSlots[0]?.quote ?? null).rest, "Gas, no ethanol, 90 octane, tax not stated");
assert.equal(formatGallonPrice(5.659), "$5.659");
assert.equal(formatGallonPrice(6.59), "$6.59");
assert.equal(formatGallonPrice(6.59), "$6.59");
assert.notEqual(lambs.quotes.find((quote) => quote.product === "90")?.pricePerGallon, 5.659);
assert.equal(ethanolCopy(lambs.ethanol), "E0");
assert.ok(!lambsSlots.some((slot) => /87|89|93|gasoline/i.test(`${slot.label} ${slot.quote?.product ?? ""}`)));
assert.equal(freshness(lambs, eightDays), "stale");
assert.equal(
  boardQuote(lambs, lambs.quotes.find((quote) => quote.product === "90") ?? null, eightDays)?.pricePerGallon,
  null,
);
assert.equal(
  boardQuote(lambs, lambs.quotes.find((quote) => quote.product === "90") ?? null, eightDays)?.status,
  "call",
);
assert.equal(freshness(lambs, fourteenDays), "stale");
assert.equal(freshness(gym, eightDays), "stale");
assert.equal(
  boardQuote(gym, gym.quotes.find((quote) => quote.product === "93") ?? null, eightDays)?.pricePerGallon,
  null,
);
assert.equal(freshness(madeira, eightDays), "fresh");
assert.equal(freshness(madeira, fourteenDays), "fresh");
assert.equal(freshness(stAugustine, readOn), "fresh");
assert.equal(freshness(stAugustine, Date.parse("2026-10-09T00:00:00Z")), "fresh");
assert.equal(freshness(stAugustine, Date.parse("2026-10-10T00:00:00Z")), "stale");
const withoutLambs = docks.filter((dock) => dock.id !== "lambs-yacht-center");
assert.equal(
  boardTally(docks, readOn).postedThisWeek,
  boardTally(withoutLambs, readOn).postedThisWeek + 1,
);
assert.ok(
  filterDocks(docks, parseBoardQuery({ region: "east-florida" })).visible.some(
    (dock) => dock.id === "lambs-yacht-center",
  ),
);

const arlington = docks.find((dock) => dock.id === "arlington-marina");
assert.ok(arlington);
assert.equal(arlington.name, "Arlington Marina");
assert.equal(arlington.region, "east-florida");
assert.equal(arlington.corridor, null);
assert.equal(arlington.city, "Jacksonville");
assert.equal(arlington.state, "FL");
assert.equal(arlington.lat, 30.333893);
assert.equal(arlington.lng, -81.611545);
assert.equal(arlington.phone, "(904) 743-2628");
assert.equal(arlington.website, "https://arlingtonmarina.com/");
assert.equal(arlington.sourceUrl, "https://arlingtonmarina.com/");
assert.equal(arlington.lastVerifiedAt, "2026-10-05");
assert.equal(arlington.lastVerifiedSource, "marina site");
assert.equal(arlington.ethanol, "unknown");
assert.equal(arlington.hours, "Daily 8:00 am–6:00 pm.");
assert.match(arlington.notes ?? "", /read 5 Oct 2026/);
assert.match(arlington.notes ?? "", /Unleaded \$6\.399/);
assert.match(arlington.notes ?? "", /Diesel \$5\.999/);
assert.match(arlington.notes ?? "", /did not date the price/);
assert.doesNotMatch(arlington.notes ?? "", /as of/i);
assert.doesNotMatch(arlington.notes ?? "", /as-of/i);
assert.deepEqual(
  arlington.quotes.map((quote) => [
    quote.product,
    quote.pricePerGallon,
    quote.ethanol,
    quote.taxIncluded,
    quote.status,
  ]),
  [
    ["gasoline", 6.399, "unknown", null, "posted"],
    ["diesel", 5.999, "unknown", null, "posted"],
  ],
);
assert.ok(!arlington.quotes.some((quote) => quote.product === "87" || quote.product === "90" || quote.product === "93"));
assert.ok(arlington.quotes.every((quote) => quote.taxIncluded == null));
assert.equal(pinTrust(arlington), "verified");
const arlingtonRead = Date.parse("2026-10-05T22:00:00Z");
assert.equal(freshness(arlington, arlingtonRead), "fresh");
const arlingtonSlots = pinQuoteSlots(arlington, arlingtonRead);
assert.deepEqual(
  arlingtonSlots.map((slot) => [slot.id, slot.label, slot.quote?.product, slot.quote?.pricePerGallon]),
  [
    ["gas-gasoline", "Gas, octane and ethanol not stated", "gasoline", 6.399],
    ["diesel", "Diesel", "diesel", 5.999],
  ],
);
assert.equal(
  formatQuote(arlingtonSlots[0]?.quote ?? null),
  "$6.399 a gallon. Gas, octane and ethanol not stated, tax not stated",
);
assert.equal(formatQuote(arlingtonSlots[1]?.quote ?? null), "$5.999 a gallon. Diesel, tax not stated");
assert.equal(freshness(arlington, Date.parse("2026-10-19T00:00:00Z")), "fresh");
assert.equal(freshness(arlington, Date.parse("2026-10-20T00:00:00Z")), "stale");
assert.equal(freshness(gym, Date.parse("2026-10-11T00:00:00Z")), "stale");
const withoutArlington = docks.filter((dock) => dock.id !== "arlington-marina");
assert.equal(
  boardTally(docks, arlingtonRead).postedThisWeek,
  boardTally(withoutArlington, arlingtonRead).postedThisWeek + 1,
);
assert.ok(
  filterDocks(docks, parseBoardQuery({ region: "east-florida" })).visible.some(
    (dock) => dock.id === "arlington-marina",
  ),
);

const coverageCallIds = [
  "stingaree-marina",
  "marjorie-park-yacht-basin",
  "port-tarpon-marina",
  "anclote-village-marina",
  "belle-harbour-marina",
  "lands-end-marina",
  "marker-1-marina",
  "mariners-cove-marina",
  "shell-point-marina",
  "beach-marine",
  "morningstar-mayport",
  "palm-cove-marina",
  "doctors-lake-marina",
  "camachee-cove-yacht-harbor",
  "cats-paw-marina",
  "met-park-marina",
  "amelia-island-marina",
] as const;
for (const id of coverageCallIds) {
  const dock = docks.find((row) => row.id === id);
  assert.ok(dock, `missing coverage dock ${id}`);
  assert.equal(dock.access, "public", `${id} fuel dock stays public`);
  assert.equal(dock.lastVerifiedAt, null, `${id} has no dated price`);
  assert.equal(dock.lastVerifiedSource, "marina site");
  assert.ok(dock.sourceUrl, `${id} needs the page that proves the hose`);
  assert.ok(dock.quotes.every((quote) => quote.pricePerGallon == null && quote.taxIncluded == null));
  assert.equal(freshness(dock, arlingtonRead), "never");
  assert.equal(freshnessLabel(dock, arlingtonRead), "No price posted");
}

const stingaree = docks.find((dock) => dock.id === "stingaree-marina");
assert.ok(stingaree);
assert.equal(stingaree.corridor, "galveston-bay");
assert.equal(stingaree.city, "Crystal Beach");
assert.equal(stingaree.lead, 12);
assert.equal(gym.lead, 13);
assert.equal(stingaree.quotes.find((quote) => quote.product === "gasoline")?.status, "call");
assert.equal(stingaree.quotes.find((quote) => quote.product === "diesel")?.status, "not-sold");
assert.ok(texas.visible.some((dock) => dock.id === "stingaree-marina"));
assert.equal(texas.visible.at(-1)?.id, "galveston-yacht-marina");
assert.notEqual(texas.visible.at(-2)?.id, "galveston-yacht-marina");

const stPete = docks.find((dock) => dock.id === "st-pete-municipal-marina");
assert.ok(stPete);
assert.equal(stPete.ethanol, "E0");
assert.equal(stPete.sourceUrl, "https://www.stpete.org/residents/parking___transportation/marina.php");
assert.deepEqual(
  stPete.quotes.map((quote) => [quote.product, quote.pricePerGallon, quote.ethanol, quote.status]),
  [
    ["90", null, "E0", "call"],
    ["diesel", null, "unknown", "call"],
  ],
);
assert.ok(!stPete.quotes.some((quote) => quote.product === "87"));

const fernandina = docks.find((dock) => dock.id === "fernandina-harbor-marina");
assert.ok(fernandina);
assert.equal(fernandina.phone, "(904) 310-3300");
assert.equal(fernandina.website, "https://www.fernandinaharbormarina.com/");
assert.equal(fernandina.lastVerifiedAt, null);
assert.deepEqual(
  fernandina.quotes.map((quote) => [quote.product, quote.pricePerGallon, quote.status]),
  [
    ["gasoline", null, "call"],
    ["diesel", null, "call"],
  ],
);
assert.ok(!fernandina.quotes.some((quote) => quote.product === "87"));

const anclote = docks.find((dock) => dock.id === "anclote-village-marina");
assert.ok(anclote);
assert.equal(anclote.ethanol, "E0");
assert.equal(anclote.quotes.find((quote) => quote.product === "90")?.ethanol, "E0");
const beachMarine = docks.find((dock) => dock.id === "beach-marine");
assert.ok(beachMarine);
assert.equal(beachMarine.quotes.find((quote) => quote.product === "90")?.ethanol, "E0");
assert.ok(!beachMarine.quotes.some((quote) => quote.product === "87"));
const shellPoint = docks.find((dock) => dock.id === "shell-point-marina");
assert.ok(shellPoint);
assert.equal(shellPoint.access, "public");

const blueMarlin = docks.find((dock) => dock.id === "blue-marlin-seabrook");
assert.ok(blueMarlin);
assert.equal(pinTrust(blueMarlin), "unverified");
assert.equal(blueMarlin.hours, null);
assert.equal(blueMarlin.flags?.includes("last-pump"), true);
assert.equal(blueMarlin.flags?.includes("west-of-146"), true);
assert.equal(blueMarlin.flags?.includes("still-open"), false);
assert.equal(blueMarlin.ethanol, "E0");
assert.equal(freshnessLabel(blueMarlin), "No price posted");
assert.ok(blueMarlin.quotes.every((quote) => quote.pricePerGallon == null));
assert.equal(
  formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null)),
  "Gas: no price posted. Call the dock.",
);
assert.equal(blueMarlin.lastVerifiedAt, "2026-08-28");

const lastMonth = Date.parse("2026-08-30T12:00:00Z") + 40 * 24 * 60 * 60 * 1000;
assert.equal(
  formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null, lastMonth)),
  "Gas: no price posted. Call the dock.",
);

const wgReplay = mergeParsedIntoDocks(
  [blueMarlin],
  [
    {
      name: "Blue Marlin Fuel Dock",
      city: "Seabrook, TX",
      comments: "stale sample",
      lastUpdate: "2026-08-14",
      nonEthanol: true,
      dockId: "blue-marlin-seabrook",
      quotes: [
        {
          product: "93",
          pricePerGallon: 5.99,
          ethanol: "E0",
          status: "posted",
          taxIncluded: true,
        },
      ],
    },
  ],
  "https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx",
);
assert.equal(wgReplay.docks[0]?.quotes.find((quote) => quote.product === "93")?.pricePerGallon, null);
assert.equal(wgReplay.docks[0]?.lastVerifiedAt, "2026-08-14");
assert.notEqual(wgReplay.docks[0]?.notes, "stale sample");

const southShore = docks.find((dock) => dock.id === "south-shore-harbour");
assert.ok(southShore);
assert.equal(southShore.ethanol, "E10");
assert.ok(southShore.quotes.every((quote) => quote.pricePerGallon == null));
assert.match(southShore.hours ?? "", /8am–6pm \(summer\)/);
assert.match(southShore.hours ?? "", /Winter 8am–4:30pm/);
assert.equal(southShore.lastVerifiedAt, "2026-08-28");
assert.doesNotMatch(formatQuote(southShore.quotes[0] ?? null), /\$/);

const houstonYacht = docks.find((dock) => dock.id === "houston-yacht-club");
assert.ok(houstonYacht);
assert.equal(
  formatQuote(houstonYacht.quotes.find((quote) => quote.product === "89") ?? null),
  "Gas: no price posted. Call the dock.",
);
assert.equal(freshness(houstonYacht), "never");
assert.equal(freshnessLabel(houstonYacht), "No price posted");
assert.equal(pinTrust(houstonYacht), "unverified");
assert.equal(houstonYacht.access, "members");

const lakewood = docks.find((dock) => dock.id === "lakewood-yacht-club");
assert.ok(lakewood);
assert.equal(lakewood.access, "private");
assert.equal(lakewood.phone, "(832) 256-6923");
assert.ok(lakewood.quotes.every((quote) => quote.pricePerGallon == null));

const bayland = docks.find((dock) => dock.id === "bayland-marina");
assert.ok(bayland);
assert.equal(bayland.corridor, "galveston-bay");
assert.equal(bayland.city, "Baytown");
assert.equal(bayland.access, "public");
assert.equal(bayland.phone, "(281) 422-8900");
assert.match(bayland.hours ?? "", /Tue–Sun 8am–5pm/);
assert.ok(bayland.quotes.every((quote) => quote.pricePerGallon == null && quote.status === "call"));
assert.doesNotMatch(formatQuote(bayland.quotes[0] ?? null), /\$/);

const marineMax = docks.find((dock) => dock.id === "marinemax-houston");
assert.ok(marineMax);
assert.equal(marineMax.corridor, "galveston-bay");
assert.equal(marineMax.city, "Seabrook");
assert.equal(marineMax.access, "members");
assert.equal(marineMax.hours, null);
assert.ok(marineMax.quotes.every((quote) => quote.pricePerGallon == null && quote.status === "call"));
assert.match(marineMax.notes ?? "", /not a public pump/i);

const harborwalk = docks.find((dock) => dock.id === "harborwalk-hitchcock");
assert.ok(harborwalk);
assert.equal(harborwalk.corridor, "galveston-bay");
assert.ok(harborwalk.quotes.every((quote) => quote.pricePerGallon == null));

const eaglePoint = docks.find((dock) => dock.id === "eagle-point-san-leon");
assert.ok(eaglePoint);
assert.equal(eaglePoint.quotes.find((quote) => quote.product === "diesel")?.status, "not-sold");
assert.ok(eaglePoint.quotes.every((quote) => quote.pricePerGallon == null));

const pelicanRest = docks.find((dock) => dock.id === "pelican-rest-marina");
assert.ok(pelicanRest);
assert.ok(pelicanRest.quotes.every((quote) => quote.pricePerGallon == null));

const keyLargoHarbor = docks.find((dock) => dock.id === "key-largo-harbor");
assert.ok(keyLargoHarbor);
assert.ok(keyLargoHarbor.quotes.every((quote) => quote.pricePerGallon == null));
assert.equal(keyLargoHarbor.lastVerifiedAt, "2022-08-26");
assert.equal(formatQuote(keyLargoHarbor.quotes[0] ?? null), "Gas: no price posted. Call the dock.");

const labelNow = Date.parse("2026-10-06T15:00:00Z");
assert.equal(heroCountLine(0, 145), "0 of 145 docks have a current posted price. For the rest, call the dock.");
assert.equal(heroCountLine(1, 145), "1 of 145 docks has a current posted price. For the rest, call the dock.");
assert.equal(heroCountLine(4, 145), "4 of 145 docks have a current posted price. For the rest, call the dock.");
assert.equal(formatGallonPrice(5.659), "$5.659");
assert.equal(formatGallonPrice(6.59), "$6.59");
assert.equal(formatGallonPrice(5.5), "$5.50");
assert.equal(
  formatQuote({
    product: "90",
    pricePerGallon: 5.659,
    ethanol: "E0",
    status: "posted",
    taxIncluded: true,
  }),
  "$5.659 a gallon. Gas, no ethanol, 90 octane, tax included",
);
assert.equal(
  formatQuote({
    product: "diesel",
    pricePerGallon: 4.84,
    ethanol: "unknown",
    status: "posted",
    taxIncluded: false,
  }),
  "$4.84 a gallon. Diesel, tax not included",
);
assert.doesNotMatch(formatQuote({
  product: "90",
  pricePerGallon: 5.659,
  ethanol: "E0",
  status: "posted",
  taxIncluded: null,
}), /\$5\.66/);

assert.equal(publicBadge(gym, labelNow), "Marina's price");
assert.equal(publicSource(gym, labelNow), "Posted on the marina's website, checked Oct 3");
assert.equal(publicCallLine(gym, labelNow), "(409) 765-3000");
assert.equal(pinKind(gym, labelNow), "marina-site");
assert.equal(pinAriaLabel(gym, readOn), "Galveston Yacht Marina: marina's price, checked Oct 3");
assert.equal(publicBadge(gym, readOn), "Marina's price");
assert.equal(publicSource(gym, readOn), "Posted on the marina's website, checked Oct 3");
assert.equal(pinKind(gym, readOn), "marina-site");
assert.notEqual(publicBadge(gym, readOn), "Verified");
const gymStaleAt = Date.parse("2026-10-11T00:00:00Z");
assert.equal(publicBadge(gym, gymStaleAt), "Price over a week old");
assert.equal(publicSource(gym, gymStaleAt), "Posted on the marina's website, checked Oct 3");
assert.equal(publicCallLine(gym, gymStaleAt), "Too old to show. Call the dock: (409) 765-3000");
assert.equal(pinKind(gym, gymStaleAt), "stale");
assert.equal(pinAriaLabel(gym, gymStaleAt), "Galveston Yacht Marina: price over a week old, call the dock");

assert.equal(publicBadge(lambs, readOn), "Marina's price");
assert.equal(publicSource(lambs, readOn), "Posted on the marina's website, checked Oct 3");
assert.equal(publicBadge(madeira, readOn), "Marina's price");
assert.equal(publicSource(stAugustine, readOn), "Posted on the marina's website, checked Sep 25");
assert.equal(publicBadge(stAugustine, readOn), "Marina's price");

assert.equal(publicBadge(marinaBay, labelNow), "No price posted");
assert.equal(publicSource(marinaBay, labelNow), "Waterway Guide, Aug 28");
assert.equal(pinAriaLabel(marinaBay, labelNow), "Marina Bay Harbor: no price posted, call the dock");
assert.doesNotMatch(publicSource(marinaBay, labelNow), /Verified|Last seen|Unverified/);

assert.equal(publicBadge(keyLargoHarbor, labelNow), "No price posted");
assert.equal(publicSource(keyLargoHarbor, labelNow), "Waterway Guide, Aug 26, 2022");
assert.equal(pinAriaLabel(keyLargoHarbor, labelNow), "Key Largo Harbor Marina: no price posted, call the dock");
assert.match(publicSource(keyLargoHarbor, labelNow), /2022/);
assert.doesNotMatch(`${publicBadge(keyLargoHarbor, labelNow)} ${publicSource(keyLargoHarbor, labelNow)}`, /Verified|Last seen/);

const pilotHouse = docks.find((dock) => dock.id === "pilot-house-marina");
assert.ok(pilotHouse);
assert.equal(freshness(pilotHouse, labelNow), "stale");
assert.equal(publicBadge(pilotHouse, labelNow), "Price over a week old");
assert.equal(publicSource(pilotHouse, labelNow), "Waterway Guide listed a price Aug 25");
assert.equal(publicCallLine(pilotHouse, labelNow), "Too old to show. Call the dock: (305) 747-4359");
assert.equal(pinKind(pilotHouse, labelNow), "stale");
assert.equal(pinAriaLabel(pilotHouse, labelNow), "Pilot House Marina & Restaurant: price over a week old, call the dock");
assert.equal(boardQuote(pilotHouse, pilotHouse.quotes[0] ?? null, labelNow)?.pricePerGallon, null);
assert.equal(pilotHouse.quotes[0]?.pricePerGallon, 6.05);

const staffReport = {
  ...gym,
  lastVerifiedSource: "marina" as const,
  lastVerifiedAt: "2026-10-06",
};
const boaterReport = {
  ...gym,
  lastVerifiedSource: "user report" as const,
  lastVerifiedAt: "2026-10-06",
};
assert.notEqual(pinTrust(staffReport), "verified");
assert.equal(pinTrust(staffReport), "last-seen");
assert.equal(publicBadge(staffReport, labelNow), "Marina staff report, not checked");
assert.equal(publicSource(staffReport, labelNow), "Marina staff report, not checked, Oct 6");
assert.equal(pinKind(staffReport, labelNow), "report");
assert.equal(publicBadge(boaterReport, labelNow), "Boater report");
assert.equal(publicSource(boaterReport, labelNow), "Boater report, Oct 6");
assert.notEqual(pinTrust(boaterReport), "verified");
assert.equal(pinKind(boaterReport, labelNow), "report");

const reviewedReport = {
  ...gym,
  lastVerifiedSource: "boater report (reviewed)" as const,
  lastVerifiedAt: "2026-10-06",
};
assert.equal(isMarinaSite(reviewedReport), false);
assert.equal(publicBadge(reviewedReport, labelNow), "Boater report, checked");
assert.equal(publicSource(reviewedReport, labelNow), "Boater report, checked, Oct 6");
assert.equal(pinAriaLabel(reviewedReport, labelNow), "Galveston Yacht Marina: boater report, checked, Oct 6");
assert.notEqual(pinTrust(reviewedReport), "verified");
assert.equal(pinKind(reviewedReport, labelNow), "report");

const blendOnly = {
  ...marinaBay,
  id: "blend-only",
  ethanol: "E0" as const,
  quotes: marinaBay.quotes.map((quote) => ({ ...quote, ethanol: "unknown" as const })),
};
assert.equal(hasEthanolFreeGas(blendOnly), false);
assert.equal(hasEthanolFreeGas(marinaBay), true);
assert.equal(
  filterDocks([blendOnly, lambs], parseBoardQuery({ e0: "1" })).visible.some((dock) => dock.id === "blend-only"),
  false,
);
assert.equal(
  filterDocks([blendOnly, lambs], parseBoardQuery({ e0: "1" })).visible.some((dock) => dock.id === "lambs-yacht-center"),
  true,
);

const tiles = readFileSync(
  path.join(process.cwd(), "src/app/api/tiles/[z]/[x]/[y]/route.ts"),
  "utf8",
);
assert.match(tiles, /tile\.openstreetmap\.de/);
assert.match(tiles, /a\.tile\.openstreetmap\.fr\/osmfr/);
assert.match(tiles, /DockPosted\/1\.0 \(\+https:\/\/github\.com\/rmcnally11\/dock-posted\)/);
assert.match(tiles, /cache: "no-store"/);
assert.doesNotMatch(tiles, /tile\.openstreetmap\.org/);
assert.doesNotMatch(tiles, /force-cache/);
assert.doesNotMatch(tiles, /carto|basemaps\.cartocdn|mapbox|maptiler|googleapis|maps\.google/i);

const fuelMap = readFileSync(path.join(process.cwd(), "src/components/fuel-map.tsx"), "utf8");
assert.match(fuelMap, /\/api\/tiles\/\$\{zoom\}\/\$\{tile\.x\}\/\$\{tile\.y\}\.png\?v=2/);
assert.match(fuelMap, /© OpenStreetMap/);
assert.doesNotMatch(fuelMap, /carto|basemaps\.cartocdn|mapbox|maptiler|googleapis|maps\.google/i);

const paidTiles = /carto|basemaps\.cartocdn|mapbox|maptiler|googleapis\.com\/maps|maps\.google/i;
for (const file of [
  "src/app/api/tiles/[z]/[x]/[y]/route.ts",
  "src/components/fuel-map.tsx",
  "src/lib/map-view.ts",
  "src/lib/types.ts",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, paidTiles, `${file} has a paid or keyed tile URL`);
}

function pinPercent(
  lng: number,
  lat: number,
  view: { center: [number, number]; zoom: number },
): { left: number; top: number; zoom: number; startX: number; startY: number } {
  const zoom = Math.max(5, Math.min(14, Math.round(view.zoom)));
  const { cols, rows } = tileGridForZoom(zoom);
  const centerX = lngToTileX(view.center[0], zoom);
  const centerY = latToTileY(view.center[1], zoom);
  const startX = Math.floor(centerX - cols / 2);
  const startY = Math.floor(centerY - rows / 2);
  return {
    left: ((lngToTileX(lng, zoom) - startX) / cols) * 100,
    top: ((latToTileY(lat, zoom) - startY) / rows) * 100,
    zoom,
    startX,
    startY,
  };
}

assert.deepEqual(CORRIDORS["galveston-bay"].center, [-95.03, 29.56]);
assert.equal(CORRIDORS["galveston-bay"].zoom, 11.2);
assert.deepEqual(CORRIDORS["upper-keys"].center, [-80.53, 25.02]);
assert.equal(CORRIDORS["upper-keys"].zoom, 9.6);

const galvestonView = viewForBoard([], parseBoardQuery({ corridor: "galveston-bay" }));
assert.deepEqual(galvestonView.center, [-95.03, 29.56]);
assert.equal(galvestonView.zoom, 11.2);

const coastView = viewForBoard(docks, parseBoardQuery({}));
assert.ok(coastView.zoom <= 6, `coast zoom should fit Sabine to Maine, got ${coastView.zoom}`);
assert.notEqual(coastView.center[0], CORRIDORS["galveston-bay"].center[0]);
assert.notEqual(coastView.center[1], CORRIDORS["galveston-bay"].center[1]);

const lakeMouth = pinPercent(-95.03, 29.56, galvestonView);
assert.equal(lakeMouth.zoom, 11);
assert.notEqual(`${lakeMouth.startX}/${lakeMouth.startY}`, "239/422");
assert.ok(lakeMouth.left > 40 && lakeMouth.left < 75, `lake mouth left ${lakeMouth.left}`);
assert.ok(lakeMouth.top > 40 && lakeMouth.top < 80, `lake mouth top ${lakeMouth.top}`);

const waller = pinPercent(-95.85, 30.0, galvestonView);
assert.ok(waller.left < -2 || waller.left > 102 || waller.top < -2 || waller.top > 102);

const lakeMouthIds = new Set([
  "marina-bay-harbor",
  "blue-marlin-seabrook",
  "south-shore-harbour",
  "houston-yacht-club",
  "lakewood-yacht-club",
  "watermans-harbor",
  "marinemax-houston",
]);
for (const dock of texas.visible.filter((item) => lakeMouthIds.has(item.id))) {
  const pin = pinPercent(dock.lng, dock.lat, galvestonView);
  assert.ok(
    pin.left >= -2 && pin.left <= 102 && pin.top >= -2 && pin.top <= 102,
    `${dock.id} fell off the Clear Lake frame (${pin.left.toFixed(1)}, ${pin.top.toFixed(1)})`,
  );
}

const sabine = docks.find((dock) => dock.id === "pleasure-island-marina");
const maine = docks.find((dock) => dock.id === "bar-harbor-town-pier");
assert.ok(sabine && maine);
const sabinePin = pinPercent(sabine.lng, sabine.lat, coastView);
const mainePin = pinPercent(maine.lng, maine.lat, coastView);
assert.ok(
  sabinePin.left >= -2 && sabinePin.left <= 102 && sabinePin.top >= -2 && sabinePin.top <= 102,
  `Sabine fell off the coast frame (${sabinePin.left.toFixed(1)}, ${sabinePin.top.toFixed(1)})`,
);
assert.ok(
  mainePin.left >= -2 && mainePin.left <= 102 && mainePin.top >= -2 && mainePin.top <= 102,
  `Maine fell off the coast frame (${mainePin.left.toFixed(1)}, ${mainePin.top.toFixed(1)})`,
);

const fence =
  /cheapest fuel|bargain map|on this water|instrument family|field letter|almanac|onthiswater|wind is the tide|sister page|field board|us saltwater docks|the board at the dock|seven letter|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|RVO|throughput|gal\/slip|invoice|savings pitch|pasadena rack|text us every morning|Holds Fast|waterdogfuel\.com|should-be|Fair hose/i;
for (const file of [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/about/page.tsx",
  "src/app/report/page.tsx",
  "src/app/safe-fuel/page.tsx",
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/app/docks/[id]/page.tsx",
  "src/components/site-header.tsx",
  "src/components/report-form.tsx",
  "src/components/freshness-badge.tsx",
  "src/components/x-timeline.tsx",
  "src/lib/x-handle.ts",
  "src/app/report/page.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, fence, `${file} leaked a fuel-desk term`);
}

const pinWall =
  /waterdog|coastal cavaliers|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|nymex|\bTCN\b|pasadena rack|should-be|Fair hose|\binvoice\b/i;
for (const file of [
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/fuel-map.tsx",
  "src/app/docks/[id]/page.tsx",
  "src/components/freshness-badge.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, pinWall, `${file} put a supplier mark on the board`);
}

const headerSource = readFileSync(path.join(process.cwd(), "src/components/site-header.tsx"), "utf8");
assert.match(headerSource, /Dock Posted/);
assert.doesNotMatch(headerSource, /What the dock posted/);
assert.match(headerSource, /Fuel Prices/);
assert.match(headerSource, /href="\/#board"/);
assert.match(headerSource, /Report a Price/);
assert.match(headerSource, /Trip Fuel Cost/);
assert.match(headerSource, /Ethanol Guide/);
assert.match(headerSource, /Storm Haul-Out/);
assert.match(headerSource, /For Marinas/);
assert.match(headerSource, /href="\/about"/);
assert.match(headerSource, />\s*About\s*</);
assert.match(headerSource, /data-testid="nav-about"/);
assert.doesNotMatch(headerSource, /Locked door/);
assert.doesNotMatch(headerSource, /nav-wholesale|href="\/wholesale"|>\s*Wholesale\s*</);
assert.doesNotMatch(headerSource, />Haul-out</);
assert.doesNotMatch(headerSource, />Board</);
assert.doesNotMatch(headerSource, />Report</);
assert.doesNotMatch(headerSource, /Fuel Near You|What's at the Pump|Boaters Say/);
const navOrder = [
  "Fuel Prices",
  "Report a Price",
  "Trip Fuel Cost",
  "Ethanol Guide",
  "Storm Haul-Out",
  "For Marinas",
  "About",
];
let navAt = -1;
for (const label of navOrder) {
  const next = headerSource.indexOf(label);
  assert.ok(next > navAt, `${label} is out of menu order`);
  navAt = next;
}

const haulSource =
  readFileSync(path.join(process.cwd(), "src/app/haul-out/page.tsx"), "utf8") +
  readFileSync(path.join(process.cwd(), "src/components/how-it-works.tsx"), "utf8");
assert.match(haulSource, /Leftover seats/);
assert.match(haulSource, /data-testid="haul-out-headline"[\s\S]*Yard seats/);
assert.match(haulSource, /When they name a storm, yards fill up/);
assert.match(haulSource, /If you won.t say the number, the boats don.t come/);
assert.match(haulSource, /Wet slips stay Coastal Cavaliers/);
assert.match(haulSource, /File the boat/);
assert.match(haulSource, /Two yards that fit/);
assert.match(haulSource, /When they name it, we tell you what.s left/);
assert.match(haulSource, /You call the yard\. We don.t pull her\./);
assert.doesNotMatch(haulSource, /Four doors\. One cone\./);
assert.doesNotMatch(haulSource, /\bKill\b/);
assert.match(haulSource, /Five yards still have not said/);
assert.doesNotMatch(haulSource, /Named storm parking/);
assert.doesNotMatch(haulSource, /A leftover seat, said out loud/);

const layoutSource = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
assert.match(layoutSource, /lg:h-full/);
assert.match(layoutSource, /scroll-smooth/);
assert.doesNotMatch(layoutSource, /body className="flex h-full min-h-full/);
assert.match(layoutSource, /default: "Dock Posted — Marina fuel"/);
assert.doesNotMatch(layoutSource, /Dock Posted — Sabine to Key West/);
assert.match(
  layoutSource,
  /What they wrote on the pump\. If they didn.t, ask the dock\./,
);

const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(homeSource, /data-testid="landing"/);
assert.match(homeSource, /data-testid="hero-kicker"/);
assert.match(homeSource, /data-testid="hero-headline"/);
assert.match(homeSource, /data-testid="hero-deck"/);
assert.match(homeSource, /data-testid="hero-geo"/);
assert.match(homeSource, /Marina fuel/);
assert.match(homeSource, /What they wrote on the pump/);
assert.match(
  homeSource,
  /Diesel and gas from the dock\. If they didn.t put a number up, we leave it blank\. Call the dock\./,
);
assert.match(homeSource, /data-testid="hero-geo"[\s\S]*Sabine to Key West\./);
assert.match(homeSource, /Then the rest of the saltwater coast\./);
assert.match(homeSource, /<Masthead/);
const wordmarkSource = readFileSync(path.join(process.cwd(), "src/components/wordmark.tsx"), "utf8");
assert.match(wordmarkSource, /data-testid="masthead"/);
assert.match(wordmarkSource, /\/logo\.svg/);
assert.match(homeSource, /heroCountLine\(tally\.postedThisWeek, docks\.length\)/);
assert.doesNotMatch(homeSource, /That.s normal\. That.s why the phone is on the\s+card\./);
assert.doesNotMatch(
  homeSource,
  /data-testid="hero-headline"[\s\S]*Sabine to Key West[\s\S]*data-testid="hero-deck"/,
);
assert.doesNotMatch(homeSource, /What the dock posted/);
assert.doesNotMatch(homeSource, /The last number they wrote on the board/);
assert.doesNotMatch(homeSource, /FREEZE|HOME_TRIO_LOCKED|copyLock/);
assert.match(homeSource, /We don.t sell fuel\. We don.t pull your boat\./);
assert.match(homeSource, /data-testid="hero-extra"/);
assert.match(homeSource, /See today.s docks/);
assert.match(homeSource, /data-testid="see-the-board"[\s\S]*href="#board"/);
assert.match(homeSource, /data-testid="landing-report"[\s\S]*href="\/report"/);
assert.match(homeSource, /id="board"/);
assert.match(homeSource, /data-testid="board"/);
assert.match(homeSource, /<DockBoard/);
assert.match(homeSource, /Who writes this\./);
assert.match(homeSource, /href="\/about"/);
assert.match(homeSource, /data-testid="who-writes-this"/);
assert.match(homeSource, /data-testid="landing-links"/);
assert.match(homeSource, /data-testid="landing-link-board"[\s\S]*href="#board"/);
assert.match(homeSource, /data-testid="landing-link-named-storm"[\s\S]*href="\/haul-out"/);
assert.match(homeSource, />\s*Fuel Prices\s*</);
assert.match(homeSource, />\s*Storm Haul-Out\s*</);
assert.match(homeSource, />\s*For Marinas\s*</);
assert.match(homeSource, />\s*Trip Fuel Cost\s*</);
assert.doesNotMatch(homeSource, />\s*When they name it\s*</);
assert.match(homeSource, /data-testid="landing-link-about"[\s\S]*href="\/about"/);
assert.doesNotMatch(homeSource, /Twitter feed|social/i);
assert.doesNotMatch(homeSource, /waterdog|Waterdog/i);
assert.doesNotMatch(homeSource, /waitlist|stripe|email capture|newsletter/i);
assert.doesNotMatch(homeSource, /four-door|campaign card|grid-cols-4/i);
assert.doesNotMatch(homeSource, /href="\/board"/);
assert.equal(existsSync(path.join(process.cwd(), "src/app/board/page.tsx")), false);
assert.equal(existsSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx")), true);
assert.equal(existsSync(path.join(process.cwd(), "public/brand/cover.jpg")), true);
assert.doesNotMatch(homeSource, /cover\.jpg|BrandPhoto/);
assert.match(homeSource, /lg:overflow-hidden/);
assert.match(homeSource, /lg:h-\[calc\(100dvh-3\.6rem\)\]/);
assert.doesNotMatch(homeSource, /flex-col overflow-hidden/);
assert.doesNotMatch(homeSource, /flex min-h-0 flex-1 flex-col overflow-hidden/);

assert.equal(
  boardHref({
    corridor: "galveston-bay",
    state: null,
    region: null,
    q: "",
    e0Only: false,
    freshOnly: false,
    dock: null,
    reported: null,
  }),
  "/?corridor=galveston-bay#board",
);
assert.equal(
  boardHref({
    corridor: null,
    state: null,
    region: null,
    q: "",
    e0Only: false,
    freshOnly: false,
    dock: null,
    reported: null,
  }),
  "/#board",
);
assert.equal(dockPath("marina-bay-harbor"), "/docks/marina-bay-harbor");
assert.equal(dockPath("galveston-yacht-marina"), "/docks/galveston-yacht-marina");

const reportSource = readFileSync(path.join(process.cwd(), "src/app/report/page.tsx"), "utf8");
const safeSource = readFileSync(path.join(process.cwd(), "src/app/safe-fuel/page.tsx"), "utf8");
const footerSource = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.doesNotMatch(reportSource, /What the dock posted/);
assert.doesNotMatch(safeSource, /What the dock posted/);
assert.match(safeSource, /Don.t guess the hose/);
assert.match(safeSource, /E15 walk away\. E10 runs\. E0 sits better\. If it isn.t labeled, ask the dock\./);
assert.match(reportSource, /You were there/);
assert.match(reportSource, /What did they have on the hose\./);
assert.match(reportSource, /If they did not post, leave it blank/);
assert.doesNotMatch(reportSource, /submit a price/i);
assert.doesNotMatch(reportSource, /If you saw it, write it/);
const reportActions = readFileSync(path.join(process.cwd(), "src/app/report/actions.ts"), "utf8");
assert.match(reportActions, /redirect\(`\/\?reported=\$\{dockId\}#board`\)/);
assert.match(footerSource, /If they didn.t put a number up, we leave it blank\. Call the dock\./);
assert.match(footerSource, /OpenStreetMap/);
assert.match(footerSource, /Waterdog Fuel\. Opens 2027\./);

function linkLabels(source: string): Map<string, string> {
  const labels = new Map<string, string>();
  for (const match of source.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const href = (match[1] ?? "").match(/href="([^"]+)"/)?.[1];
    const text = (match[2] ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (!href || !text) continue;
    labels.set(href, text);
  }
  return labels;
}

const headerLinks = linkLabels(headerSource);
const footerLinks = linkLabels(footerSource);
const sharedMenu = [...headerLinks.keys()]
  .filter((href) => footerLinks.has(href))
  .map((href) => [href, headerLinks.get(href), footerLinks.get(href)]);
assert.deepEqual(sharedMenu, [
  ["/run", "Trip Fuel Cost", "Trip Fuel Cost"],
  ["/haul-out", "Storm Haul-Out", "Storm Haul-Out"],
  ["/pin", "For Marinas", "For Marinas"],
]);
assert.equal(headerLinks.has("/wholesale"), false);
assert.equal(footerLinks.get("/wholesale"), "Wholesale");
assert.equal(footerLinks.get("/how"), "How It Works");
assert.equal(footerLinks.get("/pin"), headerLinks.get("/pin"));
assert.equal(footerLinks.get("/run"), headerLinks.get("/run"));
assert.equal(footerLinks.get("/haul-out"), headerLinks.get("/haul-out"));
assert.match(footerSource, /https:\/\/coastalcavaliers\.com/);
assert.match(footerSource, /data-testid="sister-credit"/);
assert.match(footerSource, /On This Water/);
assert.match(footerSource, /sisterHomeHref/);
assert.doesNotMatch(footerSource, /waterdogfuel\.com|RJMtweets11|Holds Fast/i);
assert.doesNotMatch(footerSource, /We publish the pin/);
assert.doesNotMatch(footerSource, /What the boater saw/);
const campaign =
  /The take|The book|Open the book|Come in|Where the cents went|Four doors\. One cone|We publish the pin|Call is the honest number|fat cut lights up|should-be|Fair hose/;
const aboutSource = readFileSync(path.join(process.cwd(), "src/app/about/page.tsx"), "utf8");
const xTimelineSource = readFileSync(path.join(process.cwd(), "src/components/x-timeline.tsx"), "utf8");
const xHandleSource = readFileSync(path.join(process.cwd(), "src/lib/x-handle.ts"), "utf8");
assert.match(aboutSource, /data-testid="about-headline"[\s\S]*Who writes this/);
assert.match(aboutSource, /What they wrote on the pump\. If they didn.t, ask the dock\./);
assert.match(
  aboutSource,
  /Dock Posted is the number on the pump\. Sabine to Key West, then\s+the rest of the saltwater coast\./,
);
assert.match(aboutSource, /We don.t sell fuel\. We don.t pull your boat/);
assert.match(
  aboutSource,
  /Yard seats are leftover spots in the shed or on the lot\. When they name a storm, you\s+call the yard\./,
);
assert.match(aboutSource, /What it cost and what they posted lives behind a locked door\./);
assert.match(aboutSource, /If you were at the dock, send the number\./);
assert.match(aboutSource, /href="\/report"/);
assert.match(aboutSource, />I was there</);
assert.match(aboutSource, />Waterdog Fuel</);
assert.match(
  aboutSource,
  /Waterdog Fuel brings the gallon from the Houston rack to the first-water dock\. Clear\s+Lake, Kemah, Seabrook\. Opens 2027\. Not selling gallons yet\./,
);
assert.match(aboutSource, /mailto:orders@coastalcavaliers\.com/);
assert.match(aboutSource, /Reach them at/);
assert.match(
  aboutSource,
  /Waterdog does not set the number on the hose\./,
);
const waterdogAt = aboutSource.indexOf('data-testid="waterdog-fuel"');
const onXImport = aboutSource.indexOf("<XTimeline");
assert.ok(waterdogAt > 0 && onXImport > waterdogAt, "Waterdog block sits before On X");
assert.doesNotMatch(aboutSource, /waterdogfuel\.com|RJMtweets11|Holds Fast|HoldsFast/i);
assert.match(xTimelineSource, />On X</);
assert.match(xTimelineSource, /Nothing on X yet\./);
assert.match(xTimelineSource, /platform\.twitter\.com\/widgets\.js/);
assert.match(xTimelineSource, /twitter-timeline/);
assert.match(xTimelineSource, /publish\.twitter\.com|platform\.twitter\.com|twitter\.com\//);
assert.match(xHandleSource, /NEXT_PUBLIC_X_HANDLE/);
assert.match(xHandleSource, /DockPosted/);
assert.doesNotMatch(aboutSource, /Twitter feed|\bsocial\b|OTW|on this water/i);
assert.doesNotMatch(xTimelineSource, /Twitter feed|\bsocial\b|RJMtweets11|goodpiratesalma/);
assert.doesNotMatch(aboutSource, /nymex|differential|\bTCN\b|platts|opis|argus|jobber/i);
assert.doesNotMatch(xTimelineSource, /nymex|platts|\brack\b|opis/i);
assert.equal(DEFAULT_X_HANDLE, "DockPosted");
assert.equal(publicXHandle(undefined), "DockPosted");
assert.equal(publicXHandle(""), "DockPosted");
assert.equal(publicXHandle("@DockPosted"), "DockPosted");
assert.equal(publicXHandle("RJMtweets11"), "DockPosted");
assert.equal(publicXHandle("@goodpiratesalma"), "DockPosted");
assert.equal(publicXHandle("SomeOther_1"), "SomeOther_1");
assert.equal(xProfileUrl("DockPosted"), "https://x.com/DockPosted");
const dockPageSource = readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8");
assert.match(dockPageSource, /data-testid="dock-page"/);
assert.match(dockPageSource, /DockQuoteGrid/);
assert.match(dockPageSource, /DockProvenance/);
assert.match(dockPageSource, /FreshnessBadge/);
assert.match(dockPageSource, /A blank is a fact\. Silence is not a price\./);
assert.match(dockPageSource, /dock\.hours \?\? "—"/);
assert.doesNotMatch(dockPageSource, /BrandPhoto|\/brand\/.*\.jpg/);
assert.doesNotMatch(dockPageSource, /should-be|invoice|\bNYMEX\b|\bTCN\b|Platts|Waterdog|Fair hose|\bDAP\b/i);
assert.doesNotMatch(homeSource, campaign);
assert.doesNotMatch(aboutSource, campaign);
assert.doesNotMatch(reportSource, campaign);
assert.doesNotMatch(safeSource, campaign);
assert.doesNotMatch(haulSource, campaign);
assert.doesNotMatch(dockPageSource, campaign);
assert.doesNotMatch(footerSource, campaign);

assert.match(aboutSource, /<BrandPhoto name="cover"/);
assert.match(reportSource, /<BrandPhoto name="board"/);
assert.match(safeSource, /<BrandPhoto name="pump"/);
assert.match(haulSource, /<BrandPhoto name="storm"/);
for (const file of ["src/app/page.tsx", "src/app/docks/[id]/page.tsx"]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, /BrandPhoto|\/brand\/(?:cover|board|pump|storm|close)\.jpg/, `${file} wired a missing brand JPEG`);
}

const cardSource = readFileSync(path.join(process.cwd(), "src/components/dock-card.tsx"), "utf8");
assert.match(cardSource, /DockQuoteGrid/);
assert.doesNotMatch(cardSource, />Blend</);
const freshnessSource = readFileSync(path.join(process.cwd(), "src/lib/freshness.ts"), "utf8");
assert.match(freshnessSource, /Marina's price/);
assert.match(freshnessSource, /Marina staff report, not checked/);
assert.match(freshnessSource, /Boater report/);
assert.match(freshnessSource, /Price over a week old/);
assert.match(freshnessSource, /Too old to show\. Call the dock: \$\{dock\.phone\}/);
assert.doesNotMatch(freshnessSource, /lastVerifiedSource === "marina site" \|\| dock\.lastVerifiedSource === "marina"/);
assert.match(cardSource, />Hours</);
assert.match(cardSource, /telHref/);
assert.match(cardSource, /publicCallLine/);
assert.match(cardSource, /quoteTone/);
assert.match(cardSource, /--signal/);
assert.match(cardSource, /--diesel/);
assert.match(cardSource, /DockHref/);
assert.equal(telHref("(281) 535-2222"), "tel:+12815352222");
assert.equal(telHref("(832) 256-6923"), "tel:+18322566923");
assert.equal(telHref("not a phone"), null);

const navScrollSource = readFileSync(path.join(process.cwd(), "src/components/nav-scroll.tsx"), "utf8");
assert.match(navScrollSource, /overflow-x-auto/);
assert.match(navScrollSource, /nav-scroll-hint/);
assert.doesNotMatch(headerSource, /flex-wrap items-center justify-between/);

const fuelMapSource = readFileSync(path.join(process.cwd(), "src/components/fuel-map.tsx"), "utf8");
assert.match(fuelMapSource, /fuel-map-board/);
assert.match(fuelMapSource, /dock-pin-dot/);
assert.match(fuelMapSource, /Map © OpenStreetMap/);
assert.match(fuelMapSource, /pinAriaLabel/);
assert.doesNotMatch(fuelMapSource, /z\$\{zoom\}/);
assert.doesNotMatch(fuelMapSource, />\s*No number\s*</);
assert.doesNotMatch(fuelMapSource, />\s*On the hose\s*</);
assert.doesNotMatch(fuelMapSource, />\s*Diesel\s*</);
assert.doesNotMatch(fuelMapSource, />\s*Gas\s*</);
assert.doesNotMatch(fuelMapSource, /status|trust level|map key|legend title/i);
assert.doesNotMatch(fuelMapSource, /leaflet|mapbox|webgl/i);

const boardSource = readFileSync(path.join(process.cwd(), "src/components/dock-board.tsx"), "utf8");
assert.match(boardSource, /action="\/#board"/);
assert.match(boardSource, /A blank is a fact\. Silence is not a price\./);
assert.match(boardSource, /dockPath\(dock\.id\)/);
assert.match(boardSource, /pin-legend/);
assert.match(boardSource, /Ethanol-free only/);
const legendSource = readFileSync(path.join(process.cwd(), "src/components/price-legend.tsx"), "utf8");
assert.match(legendSource, /PRICE_LEGEND/);
assert.match(freshnessSource, /Marina's price/);
assert.match(freshnessSource, /Waterway Guide or a report/);
assert.match(freshnessSource, /Price over a week old, call the dock/);
assert.match(freshnessSource, /No price posted, call the dock/);
assert.match(freshnessSource, /--gold/);
assert.match(freshnessSource, /--stale/);
assert.doesNotMatch(legendSource, />\s*Diesel\s*</);
assert.doesNotMatch(legendSource, />\s*Gas\s*</);
assert.doesNotMatch(boardSource, /waterdog|Waterdog|nymex|platts|\bTCN\b/i);
assert.match(boardSource, /text-base/);
assert.match(boardSource, /coast-jumps/);
assert.match(boardSource, /h-\[32vh\]/);
assert.doesNotMatch(boardSource, /h-\[46vh\]/);

const yardBoardSource = readFileSync(path.join(process.cwd(), "src/components/yard-board.tsx"), "utf8");
assert.match(yardBoardSource, /md:hidden/);
assert.match(yardBoardSource, /telHref/);
assert.match(yardBoardSource, /hidden overflow-x-auto md:block/);

const ownerFormSource = readFileSync(path.join(process.cwd(), "src/components/owner-plan-form.tsx"), "utf8");
assert.match(ownerFormSource, /min-h-11/);
assert.match(ownerFormSource, /h-5 w-5/);

const tally = boardTally(docks);
assert.ok(tally.postedThisWeek > 0);
assert.ok(tally.call > tally.postedThisWeek);

const cssSource = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
assert.match(cssSource, /--navy:\s*#0b1f33/i);
assert.match(cssSource, /--ink:\s*#16324a/i);
assert.match(cssSource, /--signal:\s*#e23b3b/i);
assert.match(cssSource, /--diesel:\s*#2f8fd6/i);
assert.match(cssSource, /--fog:\s*#f4f6f8/i);
assert.match(cssSource, /--cream:\s*#fbf8f3/i);
assert.doesNotMatch(cssSource, /--copper:/);
assert.doesNotMatch(cssSource, /--sea:/);

const logoSvg = readFileSync(path.join(process.cwd(), "public/logo.svg"), "utf8");
const markSvg = readFileSync(path.join(process.cwd(), "public/dp-mark.svg"), "utf8");
const faviconSvg = readFileSync(path.join(process.cwd(), "public/favicon.svg"), "utf8");
for (const [name, svg] of [
  ["logo.svg", logoSvg],
  ["dp-mark.svg", markSvg],
  ["favicon.svg", faviconSvg],
] as const) {
  assert.match(svg, /#E23B3B/i, `${name} missing signal red`);
  assert.match(svg, /#2F8FD6/i, `${name} missing diesel blue`);
  assert.ok((svg.match(/<path/g) ?? []).length >= 2, `${name} must keep the dual waterline`);
}
assert.match(logoSvg, /MARINA FUEL/);
assert.match(logoSvg, /Dock Posted/);
assert.doesNotMatch(logoSvg, /DOCK POSTED/);
assert.doesNotMatch(logoSvg, /\$\d|Regular|Diesel/);
assert.match(markSvg, />DP</);
assert.match(faviconSvg, />DP</);
assert.ok(existsSync(path.join(process.cwd(), "src/app/icon.svg")));
const appIcon = readFileSync(path.join(process.cwd(), "src/app/icon.svg"), "utf8");
assert.match(appIcon, />DP</);
assert.match(appIcon, /#E23B3B/i);
assert.match(appIcon, /#2F8FD6/i);
assert.match(layoutSource, /\/favicon\.svg/);
assert.match(layoutSource, /\/dp-mark\.svg/);

const waterlineSource = readFileSync(path.join(process.cwd(), "src/components/waterline.tsx"), "utf8");
assert.match(waterlineSource, /#E23B3B/);
assert.match(waterlineSource, /#2F8FD6/);
assert.match(waterlineSource, /translate\(0 8\)/);
assert.doesNotMatch(waterlineSource, /waterline-a|waterline-b/);

assert.match(headerSource, /BrandSpine|Waterline/);
assert.match(headerSource, /Wordmark/);

const galveston = conditionsHref({ corridor: "galveston-bay" });
assert.equal(galveston.label, "This morning on Galveston");
assert.match(galveston.href, /theater=texas/);
assert.match(galveston.href, /area=galveston/);
assert.match(galveston.href, /utm_source=dockposted/);
assert.equal(conditionsHref({ city: "Port Arthur", state: "TX" }).area, "sabine");
assert.equal(conditionsHref({ city: "Key Largo", corridor: "upper-keys" }).area, "key-largo");
assert.equal(conditionsHref({ city: "Key West", region: "keys" }).area, "key-west");
assert.equal(conditionsHref({ city: "Rockport", region: "texas" }).area, "aransas");
assert.equal(conditionsHref({ region: "louisiana" }).area, "venice");
assert.equal(conditionsHref({ region: "west-florida" }).area, "boca-grande");
assert.deepEqual(briefCoastsFor({ region: "texas" }), [
  "sabine",
  "galveston",
  "matagorda",
  "aransas",
  "corpus",
  "baffin",
  "lower-laguna",
]);
console.log(
  `board filters ok — seed ${docks.length}, coast ${coast.visible.length}, bay ${texas.visible.length}, keys ${keys.visible.length}, tx-state ${texasState.visible.length}, ne ${newEngland.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}, search ${search.visible.length}, posted-this-week ${tally.postedThisWeek}, call ${tally.call}, stale ${tally.stale}`,
);
