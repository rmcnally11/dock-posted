import { DOCK_ORIGIN } from "@/lib/dock-page";
import { formatPrice } from "@/lib/format";
import {
  DATE_UNKNOWN,
  HOME_AREAS,
  areaPath,
  asOfText,
  callHref,
  gradeLabel,
  homeArea,
  parseHomeArea,
  postedIsStale,
  stillPostedLine,
  toPostedCard,
  type HomeAreaId,
} from "@/lib/posted";
import { CORRIDORS, type Dock, type FuelQuote, type SourceLabel } from "@/lib/types";

export function areaIntro(areaName: string): string {
  return `Fuel docks in ${areaName}, cheapest posted price first. Docks with no posted price are listed below. Call before you go.`;
}

export const AREA_PRICES_HEADING = "Posted fuel prices";

export const AREA_EMPTY_PRICES = "No price posted yet. Call the dock.";

/** Same sentence as the home list under the prices. */
export const AREA_CALL_HEADING = "More fuel docks, call ahead";

/** Same words as the dock page source line. A city harbor page is stored as this. */
const MARINA_SITE_SOURCE = "Marina's website";

/** Same words as the public badge for a marina that wrote the number in. */
const MARINA_STAFF_SOURCE = "Marina staff report, not checked";

export type AreaPriceLine = {
  key: string;
  label: string;
  figure: string;
  kind: "gas" | "diesel";
};

export type AreaDock = {
  id: string;
  name: string;
  city: string;
  state: string;
  href: string;
  callHref: string | null;
  stale: boolean;
  asOf: string | null;
  /** Set when a later re-read kept the same prices. Absent when the dates match. */
  stillPosted: string | null;
  source: string | null;
  sourceHref: string | null;
  note: string | null;
  lines: AreaPriceLine[];
};

export type AreaPageModel = {
  id: HomeAreaId;
  title: string;
  intro: string;
  priced: AreaDock[];
  callAhead: AreaDock[];
};

export function parseAreaSlug(slug: string | undefined): HomeAreaId | null {
  return parseHomeArea(slug);
}

/**
 * Home chip says Galveston Bay. The page uses the longer name already on the
 * corridor, Galveston Bay / Clear Lake. Tampa Bay and Northeast Florida stay
 * the home labels.
 */
export function areaTitle(id: HomeAreaId): string {
  if (id === "galveston-bay") return CORRIDORS["galveston-bay"].label;
  return HOME_AREAS.find((area) => area.id === id)?.label ?? id;
}

export function areaCanonicalUrl(id: HomeAreaId): string {
  return `${DOCK_ORIGIN}${areaPath(id)}`;
}

/**
 * A dollar stays only when a marina or a city already posted it.
 * City harbor pages are stored as "marina site". Any other stored source
 * stays off this page.
 */
export function marinaOrCityPosted(source: SourceLabel | null): boolean {
  return source === "marina site" || source === "marina";
}

function storedPrice(quote: FuelQuote): number | null {
  if (quote.status !== "posted" || quote.pricePerGallon == null || Number.isNaN(quote.pricePerGallon)) {
    return null;
  }
  return quote.pricePerGallon;
}

/**
 * Regular gas is 87 when they named it. Unlabeled gasoline is the pump they
 * called gas. A higher octane and diesel are not the sort key.
 */
export function regularGasPrice(dock: Dock): number | null {
  if (!marinaOrCityPosted(dock.lastVerifiedSource)) return null;
  const eightySeven = dock.quotes
    .filter((quote) => quote.product === "87")
    .map(storedPrice)
    .filter((price): price is number => price != null);
  if (eightySeven.length > 0) return Math.min(...eightySeven);
  const gasoline = dock.quotes
    .filter((quote) => quote.product === "gasoline")
    .map(storedPrice)
    .filter((price): price is number => price != null);
  if (gasoline.length > 0) return Math.min(...gasoline);
  return null;
}

export function postedSourceLabel(dock: Dock): string | null {
  if (dock.lastVerifiedSource === "marina site") return MARINA_SITE_SOURCE;
  if (dock.lastVerifiedSource === "marina") return MARINA_STAFF_SOURCE;
  return null;
}

function sourceHref(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function priceLines(dock: Dock): AreaPriceLine[] {
  if (!marinaOrCityPosted(dock.lastVerifiedSource)) return [];
  const lines: AreaPriceLine[] = [];
  dock.quotes.forEach((quote, index) => {
    const price = storedPrice(quote);
    if (price == null) return;
    lines.push({
      key: `${quote.product}-${index}`,
      label: gradeLabel(quote),
      figure: formatPrice(price),
      kind: quote.product === "diesel" ? "diesel" : "gas",
    });
  });
  return lines;
}

function toAreaDock(dock: Dock, now: number): AreaDock {
  const card = toPostedCard(dock, now);
  const asOf = asOfText(dock, new Date(now));
  const lines = priceLines(dock);
  const source = lines.length > 0 ? postedSourceLabel(dock) : null;
  return {
    id: dock.id,
    name: dock.name,
    city: dock.city,
    state: dock.state,
    href: card?.href ?? `/docks/${dock.id}`,
    callHref: card?.callHref ?? callHref(dock.phone),
    stale: card?.stale ?? postedIsStale(dock, now),
    asOf: asOf === DATE_UNKNOWN ? null : asOf,
    stillPosted: lines.length > 0 ? stillPostedLine(dock, new Date(now)) : null,
    source,
    sourceHref: source ? sourceHref(dock.sourceUrl) : null,
    note: lines.length > 0 ? (card?.note ?? null) : null,
    lines,
  };
}

function byRegularThenName(left: Dock, right: Dock): number {
  const a = regularGasPrice(left);
  const b = regularGasPrice(right);
  if (a != null && b != null && a !== b) return a - b;
  if (a != null && b == null) return -1;
  if (a == null && b != null) return 1;
  return left.name.localeCompare(right.name, "en");
}

function byName(left: Dock, right: Dock): number {
  return left.name.localeCompare(right.name, "en");
}

export function buildAreaPage(docks: Dock[], id: HomeAreaId, now = Date.now()): AreaPageModel {
  const inArea = docks.filter((dock) => homeArea(dock) === id);
  const pricedDocks = inArea.filter((dock) => priceLines(dock).length > 0).sort(byRegularThenName);
  const callDocks = inArea.filter((dock) => priceLines(dock).length === 0).sort(byName);
  const title = areaTitle(id);
  return {
    id,
    title,
    intro: areaIntro(title),
    priced: pricedDocks.map((dock) => toAreaDock(dock, now)),
    callAhead: callDocks.map((dock) => toAreaDock(dock, now)),
  };
}

export function areaIndexJsonLd() {
  return {
    "@type": "ItemList",
    itemListElement: HOME_AREAS.map((area, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: areaTitle(area.id),
      url: areaCanonicalUrl(area.id),
    })),
  };
}

export function areaPageJsonLd(page: AreaPageModel) {
  const docks = [...page.priced, ...page.callAhead];
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.intro,
    url: areaCanonicalUrl(page.id),
    isPartOf: {
      "@type": "WebSite",
      name: "Dock Posted",
      url: `${DOCK_ORIGIN}/`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: docks.map((dock, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: dock.name,
        url: `${DOCK_ORIGIN}/docks/${dock.id}`,
      })),
    },
  };
}
