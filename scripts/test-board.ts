import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { boardHref, filterDocks, parseBoardQuery, matchesSearch, viewLabel } from "../src/lib/board-query";
import { formatQuote, telHref } from "../src/lib/format";
import { boardQuote, boardTally, freshness, freshnessLabel, pinTrust } from "../src/lib/freshness";
import { mergeParsedIntoDocks } from "../src/lib/waterway-guide";
import { DEFAULT_X_HANDLE, publicXHandle, xProfileUrl } from "../src/lib/x-handle";
import seed from "../data/docks.seed.json";
import { latToTileY, lngToTileX } from "../src/lib/geo";
import { tileGridForZoom, viewForBoard } from "../src/lib/map-view";
import { CORRIDORS, STATE_CODES, type Dock, type StateCode } from "../src/lib/types";

const docks = seed.docks as Dock[];

assert.ok(docks.length >= 90, `expected a coastal set, got ${docks.length}`);
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
assert.equal(formatQuote(marinaBay.quotes.find((quote) => quote.product === "87") ?? null), "Call");
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

const blueMarlin = docks.find((dock) => dock.id === "blue-marlin-seabrook");
assert.ok(blueMarlin);
assert.equal(pinTrust(blueMarlin), "unverified");
assert.equal(blueMarlin.hours, null);
assert.equal(blueMarlin.flags?.includes("last-pump"), true);
assert.equal(blueMarlin.flags?.includes("west-of-146"), true);
assert.equal(blueMarlin.flags?.includes("still-open"), false);
assert.equal(blueMarlin.ethanol, "E0");
assert.equal(freshnessLabel(blueMarlin), "Call the dock");
assert.ok(blueMarlin.quotes.every((quote) => quote.pricePerGallon == null));
assert.equal(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null)), "Call");
assert.equal(blueMarlin.lastVerifiedAt, "2026-08-28");

const lastMonth = Date.parse("2026-08-30T12:00:00Z") + 40 * 24 * 60 * 60 * 1000;
assert.equal(formatQuote(boardQuote(blueMarlin, blueMarlin.quotes[0] ?? null, lastMonth)), "Call");

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
assert.equal(formatQuote(southShore.quotes[0] ?? null), "Call");

const houstonYacht = docks.find((dock) => dock.id === "houston-yacht-club");
assert.ok(houstonYacht);
assert.equal(formatQuote(houstonYacht.quotes.find((quote) => quote.product === "89") ?? null), "Call");
assert.equal(freshness(houstonYacht), "never");
assert.equal(freshnessLabel(houstonYacht), "Call the dock");
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
assert.equal(formatQuote(bayland.quotes[0] ?? null), "Call");

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
assert.equal(formatQuote(keyLargoHarbor.quotes[0] ?? null), "Call");

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
  /cheapest fuel|bargain map|on this water|instrument family|field letter|almanac|onthiswater|wind is the tide|sister page|field board|us saltwater docks|the board at the dock|seven letter|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|RVO|throughput|gal\/slip|invoice|savings pitch|pasadena rack|text us every morning|Holds Fast|waterdogfuel\.com/i;
for (const file of [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/about/page.tsx",
  "src/app/report/page.tsx",
  "src/app/safe-fuel/page.tsx",
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/site-header.tsx",
  "src/components/site-footer.tsx",
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
  /waterdog|coastal cavaliers|opis|argus|platts|cents-over-rack|jobber|\bRIN\b|nymex|\bTCN\b|pasadena rack/i;
for (const file of [
  "src/components/dock-card.tsx",
  "src/components/dock-board.tsx",
  "src/components/fuel-map.tsx",
  "src/components/freshness-badge.tsx",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, pinWall, `${file} put a supplier mark on the board`);
}

const headerSource = readFileSync(path.join(process.cwd(), "src/components/site-header.tsx"), "utf8");
assert.match(headerSource, /Dock Posted/);
assert.doesNotMatch(headerSource, /What the dock posted/);
assert.match(headerSource, /The board/);
assert.match(headerSource, /href="\/#board"/);
assert.match(headerSource, /Named storm/);
assert.match(headerSource, /Post a number/);
assert.match(headerSource, /href="\/about"/);
assert.match(headerSource, />\s*About\s*</);
assert.match(headerSource, /data-testid="nav-about"/);
assert.doesNotMatch(headerSource, />Haul-out</);
assert.doesNotMatch(headerSource, />Board</);
assert.doesNotMatch(headerSource, />Report</);
const e15At = headerSource.indexOf("E15");
const aboutAt = headerSource.indexOf('href="/about"');
const wholesaleAt = headerSource.indexOf("Wholesale");
assert.ok(e15At >= 0 && aboutAt > e15At, "About sits after E15");
assert.ok(wholesaleAt > aboutAt, "About sits before Wholesale");

const haulSource = readFileSync(path.join(process.cwd(), "src/app/haul-out/page.tsx"), "utf8");
assert.match(haulSource, /Leftover seats/);
assert.match(haulSource, /data-testid="haul-out-headline"[\s\S]*Named storm/);
assert.match(haulSource, /When they name it, you need a hole/);
assert.match(haulSource, /If you won.t say the number, the boats don.t come/);
assert.match(haulSource, /Wet slips stay Coastal Cavaliers/);
assert.match(haulSource, /File the boat/);
assert.match(haulSource, /Two yards that fit/);
assert.match(haulSource, /When they name it, we text what.s left/);
assert.match(haulSource, /You call the yard\. We don.t lift her\./);
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
  /The price they posted\. Diesel and gas from the dock\. If they didn.t write a number, it stays Call\./,
);

const homeSource = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.match(homeSource, /data-testid="landing"/);
assert.match(homeSource, /data-testid="hero-kicker"/);
assert.match(homeSource, /data-testid="hero-headline"/);
assert.match(homeSource, /data-testid="hero-deck"/);
assert.match(homeSource, /data-testid="hero-geo"/);
assert.match(homeSource, /Marina fuel/);
assert.match(homeSource, /The price they posted/);
assert.match(
  homeSource,
  /Diesel and gas from the dock\. If they didn.t write a number, it stays Call\./,
);
assert.match(homeSource, /data-testid="hero-geo"[\s\S]*Sabine to Key West\./);
assert.match(homeSource, /Then the rest of the saltwater coast\./);
assert.match(homeSource, /<Masthead/);
const wordmarkSource = readFileSync(path.join(process.cwd(), "src/components/wordmark.tsx"), "utf8");
assert.match(wordmarkSource, /data-testid="masthead"/);
assert.match(wordmarkSource, /\/logo\.svg/);
assert.match(homeSource, /That is the\s+product working, not failing\./);
assert.doesNotMatch(
  homeSource,
  /data-testid="hero-headline"[\s\S]*Sabine to Key West[\s\S]*data-testid="hero-deck"/,
);
assert.doesNotMatch(homeSource, /What the dock posted/);
assert.doesNotMatch(homeSource, /The last number they wrote on the board/);
assert.doesNotMatch(homeSource, /FREEZE|HOME_TRIO_LOCKED|copyLock/);
assert.match(homeSource, /We don.t sell a gallon\. We don.t lift a boat\./);
assert.match(homeSource, /data-testid="hero-extra"/);
assert.match(homeSource, /See the board/);
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
assert.match(homeSource, />\s*When they name it\s*</);
assert.match(homeSource, /data-testid="landing-link-about"[\s\S]*href="\/about"/);
assert.doesNotMatch(homeSource, /Twitter feed|social/i);
assert.doesNotMatch(homeSource, /waterdog|Waterdog/i);
assert.doesNotMatch(homeSource, /waitlist|stripe|email capture|newsletter/i);
assert.doesNotMatch(homeSource, /four-door|campaign card|grid-cols-4/i);
assert.doesNotMatch(homeSource, /href="\/board"/);
assert.equal(existsSync(path.join(process.cwd(), "src/app/board/page.tsx")), false);
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

const reportSource = readFileSync(path.join(process.cwd(), "src/app/report/page.tsx"), "utf8");
const safeSource = readFileSync(path.join(process.cwd(), "src/app/safe-fuel/page.tsx"), "utf8");
const footerSource = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.doesNotMatch(reportSource, /What the dock posted/);
assert.doesNotMatch(safeSource, /What the dock posted/);
assert.match(safeSource, /Don.t guess the hose/);
assert.match(safeSource, /E15 walk away\. E10 runs\. E0 sits better\. Call if unlabeled\./);
assert.match(reportSource, /Post a number/);
assert.match(reportSource, /You were there\. What did they have up\./);
assert.match(reportSource, /Post the number\. Save the next boat a phone call\./);
assert.doesNotMatch(reportSource, /submit a price/i);
assert.doesNotMatch(reportSource, /If you saw it, write it/);
const reportActions = readFileSync(path.join(process.cwd(), "src/app/report/actions.ts"), "utf8");
assert.match(reportActions, /redirect\(`\/\?reported=\$\{dockId\}#board`\)/);
assert.match(footerSource, /If they didn.t post it, it.s Call\./);
assert.match(footerSource, /OpenStreetMap/);
assert.match(footerSource, /Waterdog Fuel\. Rack to dock\./);
assert.match(footerSource, /https:\/\/coastalcavaliers\.com/);
assert.doesNotMatch(footerSource, /waterdogfuel\.com|RJMtweets11|Holds Fast/i);
assert.doesNotMatch(footerSource, /We publish the pin/);
assert.doesNotMatch(footerSource, /What the boater saw/);
const campaign =
  /The take|The book|Open the book|Come in|Where the cents went|Four doors\. One cone|We publish the pin|Call is the honest number|fat cut lights up/;
const aboutSource = readFileSync(path.join(process.cwd(), "src/app/about/page.tsx"), "utf8");
const xTimelineSource = readFileSync(path.join(process.cwd(), "src/components/x-timeline.tsx"), "utf8");
const xHandleSource = readFileSync(path.join(process.cwd(), "src/lib/x-handle.ts"), "utf8");
assert.match(aboutSource, /data-testid="about-headline"[\s\S]*>\s*About\s*</);
assert.match(aboutSource, /We write what they posted\. If they didn.t, it.s Call\./);
assert.match(
  aboutSource,
  /Dock Posted is the number on the board at the fuel dock\. Sabine to Key West, then\s+the rest of the saltwater coast\./,
);
assert.match(aboutSource, /We don.t sell a gallon\. We don.t lift a boat\. A blank stays Call\./);
assert.match(
  aboutSource,
  /Named storm is leftover seats in the shed or on the lot\. When they name it, you\s+call the yard\./,
);
assert.match(aboutSource, /Wholesale is what it cost and what they posted\. That.s a locked door\./);
assert.match(aboutSource, /If you were at the dock, send the number\./);
assert.match(aboutSource, /href="\/report"/);
assert.match(aboutSource, />\s*Post a number\s*</);
assert.match(aboutSource, />Waterdog Fuel</);
assert.match(
  aboutSource,
  /Waterdog Fuel brings the gallon from the Houston rack to the first-water dock\. Clear\s+Lake, Kemah, Seabrook\. Opens 2027\. Not selling gallons yet\./,
);
assert.match(aboutSource, /mailto:orders@coastalcavaliers\.com/);
assert.match(aboutSource, /Reach them at/);
assert.match(
  aboutSource,
  /Rack to dock\. Same family as this board\. They do not set the number on the hose\./,
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
assert.doesNotMatch(homeSource, campaign);
assert.doesNotMatch(aboutSource, campaign);
assert.doesNotMatch(reportSource, campaign);
assert.doesNotMatch(safeSource, campaign);
assert.doesNotMatch(haulSource, campaign);
assert.doesNotMatch(footerSource, campaign);

const cardSource = readFileSync(path.join(process.cwd(), "src/components/dock-card.tsx"), "utf8");
assert.match(cardSource, />Regular</);
assert.match(cardSource, />Diesel</);
assert.match(cardSource, />Blend</);
assert.match(cardSource, />Hours</);
assert.match(cardSource, />Date</);
assert.match(cardSource, /telHref/);
assert.match(cardSource, /Call the dock · \$\{dock\.phone\}/);
assert.match(cardSource, /quoteTone/);
assert.match(cardSource, /--signal/);
assert.match(cardSource, /--diesel/);
assert.equal(telHref("(281) 535-2222"), "tel:+12815352222");
assert.equal(telHref("(832) 256-6923"), "tel:+18322566923");
assert.equal(telHref("not a phone"), null);

assert.match(headerSource, /overflow-x-auto/);
assert.doesNotMatch(headerSource, /flex-wrap items-center justify-between/);

const fuelMapSource = readFileSync(path.join(process.cwd(), "src/components/fuel-map.tsx"), "utf8");
assert.match(fuelMapSource, /fuel-map-board/);
assert.match(fuelMapSource, /dock-pin-dot/);
assert.doesNotMatch(fuelMapSource, /leaflet|mapbox|webgl/i);

const boardSource = readFileSync(path.join(process.cwd(), "src/components/dock-board.tsx"), "utf8");
assert.match(boardSource, /action="\/#board"/);
assert.match(boardSource, /Call is a fact\. Silence is not a price\./);
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

console.log(
  `board filters ok — seed ${docks.length}, coast ${coast.visible.length}, bay ${texas.visible.length}, keys ${keys.visible.length}, tx-state ${texasState.visible.length}, ne ${newEngland.visible.length}, e0 ${e0.visible.length}, fresh ${fresh.visible.length}, search ${search.visible.length}, posted-this-week ${tally.postedThisWeek}, call ${tally.call}, stale ${tally.stale}`,
);
