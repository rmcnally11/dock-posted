import { dockPath } from "@/lib/board-query";
import { chicagoCivilDate, civilDate, formatPrice, sourceInstant, telHref } from "@/lib/format";
import { freshness } from "@/lib/freshness";
import type { Dock, FuelQuote } from "@/lib/types";

export const DATE_UNKNOWN = "Date unknown";

const CHICAGO = "America/Chicago";
const NEW_YORK = "America/New_York";

const EASTERN_STATES = new Set([
  "FL",
  "GA",
  "SC",
  "NC",
  "VA",
  "MD",
  "DE",
  "NJ",
  "NY",
  "CT",
  "RI",
  "MA",
  "PA",
  "NH",
  "ME",
]);

export type HomeAreaId = "galveston-bay" | "tampa-bay" | "northeast-florida";

export const HOME_AREAS: Array<{ id: HomeAreaId; label: string }> = [
  { id: "galveston-bay", label: "Galveston Bay" },
  { id: "tampa-bay", label: "Tampa Bay" },
  { id: "northeast-florida", label: "Northeast Florida" },
];

/** Call is the missing number. Never a stand-in dollar. */
export const CALL_FIGURE = "Call";

export const NOT_SOLD_FIGURE = "Not sold";

type Box = { lat: [number, number]; lng: [number, number] };

// Galveston Bay is the corridor when a pin has one. The box catches a new pin
// that has coordinates but no corridor yet.
const GALVESTON_BOX: Box = { lat: [29.2, 29.78], lng: [-95.2, -94.48] };

// Tampa Bay and the beach passes that open onto it. Sarasota and the
// panhandle stay outside.
const TAMPA_BOX: Box = { lat: [27.5, 28.05], lng: [-82.95, -82.4] };

// First Coast: Fernandina through St. Augustine. Daytona stays out.
const NORTHEAST_FLORIDA_BOX: Box = { lat: [29.6, 30.8], lng: [-81.95, -81.2] };

function inBox(dock: Dock, box: Box): boolean {
  return (
    dock.lat >= box.lat[0] &&
    dock.lat <= box.lat[1] &&
    dock.lng >= box.lng[0] &&
    dock.lng <= box.lng[1]
  );
}

export function homeArea(dock: Dock): HomeAreaId | null {
  if (dock.corridor === "galveston-bay" || inBox(dock, GALVESTON_BOX)) return "galveston-bay";
  if (inBox(dock, TAMPA_BOX)) return "tampa-bay";
  if (inBox(dock, NORTHEAST_FLORIDA_BOX)) return "northeast-florida";
  return null;
}

export function parseHomeArea(value: string | undefined): HomeAreaId | null {
  if (!value) return null;
  return HOME_AREAS.some((area) => area.id === value) ? (value as HomeAreaId) : null;
}

export function homeAreaHref(
  area: HomeAreaId | null,
  params: { [key: string]: string | string[] | undefined },
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "waters" || value == null) continue;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) next.set(key, text);
  }
  if (area) next.set("waters", area);
  const qs = next.toString();
  return qs ? `/?${qs}` : "/";
}

/** Grade as stored. E0 stays E0. An octane stays the number. Never "Regular". */
export function gradeLabel(quote: FuelQuote): string {
  const ethanol = quote.ethanol === "unknown" ? "" : ` ${quote.ethanol}`;
  if (quote.product === "diesel") return `Diesel${ethanol}`;
  if (quote.product === "gasoline") return `Gasoline${ethanol}`;
  return `${quote.product}${ethanol}`;
}

export function postedFigure(quote: FuelQuote): string {
  if (quote.status === "not-sold") return NOT_SOLD_FIGURE;
  if (quote.status !== "posted" || quote.pricePerGallon == null || Number.isNaN(quote.pricePerGallon)) {
    return CALL_FIGURE;
  }
  return formatPrice(quote.pricePerGallon);
}

/** Texas and the Florida panhandle are Central. The peninsula is Eastern. */
export function dockTimeZone(dock: Pick<Dock, "state" | "lng">): string {
  if (dock.state === "FL" && Number.isFinite(dock.lng) && dock.lng <= -85.2) return CHICAGO;
  if (EASTERN_STATES.has(dock.state)) return NEW_YORK;
  return CHICAGO;
}

/**
 * The as-of line is the stored source day, in the dock's zone.
 * A missing day, or a day after today in Chicago, is not a source date.
 */
export function asOfText(
  dock: Pick<Dock, "lastVerifiedAt" | "state" | "lng">,
  now = new Date(),
): string {
  if (!dock.lastVerifiedAt) return DATE_UNKNOWN;
  const zone = dockTimeZone(dock);
  const instant = sourceInstant(dock.lastVerifiedAt);
  if (!instant) return DATE_UNKNOWN;
  const day = civilDate(instant, zone);
  if (day > chicagoCivilDate(now)) return DATE_UNKNOWN;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: zone,
  }).format(instant);
}

export function postedIsStale(dock: Dock, now = Date.now()): boolean {
  if (asOfText(dock, new Date(now)) === DATE_UNKNOWN) return true;
  return freshness(dock, now) === "stale";
}

/** A dollar stays up only when the source is the marina. A user report is dropped. */
function marinaSourced(dock: Dock): boolean {
  return dock.lastVerifiedSource === "marina site" || dock.lastVerifiedSource === "marina";
}

/** A dollar stays up only when a marina page is the source. Anything else is dropped. */
export function quotesOnHome(dock: Dock): FuelQuote[] {
  return dock.quotes.filter((quote) => {
    const priced =
      quote.status === "posted" &&
      quote.pricePerGallon != null &&
      !Number.isNaN(quote.pricePerGallon);
    if (!priced) return true;
    return marinaSourced(dock);
  });
}

export function callHref(phone: string | null): string | null {
  if (!phone) return null;
  return telHref(phone);
}

export function directionsHref(
  dock: Pick<Dock, "name" | "city" | "state" | "lat" | "lng">,
): string {
  if (Number.isFinite(dock.lat) && Number.isFinite(dock.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${dock.lat},${dock.lng}`;
  }
  const query = [dock.name, dock.city, dock.state].filter((part) => part.trim().length > 0).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earth = 3958.7613;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatMiles(miles: number): string {
  if (!Number.isFinite(miles)) return "";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export type PostedLine = {
  key: string;
  label: string;
  figure: string;
  asOf: string;
  kind: "gas" | "diesel";
};

export type PostedCard = {
  id: string;
  name: string;
  city: string;
  state: string;
  areaId: HomeAreaId;
  areaLabel: string;
  href: string;
  callHref: string | null;
  phone: string | null;
  directionsHref: string;
  lat: number;
  lng: number;
  stale: boolean;
  hasPrice: boolean;
  note: string | null;
  lines: PostedLine[];
};

function areaLabel(id: HomeAreaId): string {
  return HOME_AREAS.find((area) => area.id === id)?.label ?? id;
}

function cardNote(dock: Dock): string | null {
  const parts: string[] = [];
  if (dock.closed) parts.push("Closed");
  if (dock.access === "members" || dock.access === "private") parts.push("Members’ dock");
  return parts.length > 0 ? parts.join(" · ") : null;
}

function linesFor(dock: Dock, now: number): PostedLine[] {
  const asOf = asOfText(dock, new Date(now));
  const quotes = quotesOnHome(dock);
  if (quotes.length === 0) {
    return [
      {
        key: "none",
        label: "Fuel",
        figure: CALL_FIGURE,
        asOf,
        kind: "gas",
      },
    ];
  }
  return quotes.map((quote, index) => ({
    key: `${quote.product}-${index}`,
    label: gradeLabel(quote),
    figure: postedFigure(quote),
    asOf,
    kind: quote.product === "diesel" ? "diesel" : "gas",
  }));
}

export function toPostedCard(dock: Dock, now = Date.now()): PostedCard | null {
  const areaId = homeArea(dock);
  if (!areaId) return null;
  const phoneLink = callHref(dock.phone);
  const lines = linesFor(dock, now);
  return {
    id: dock.id,
    name: dock.name,
    city: dock.city,
    state: dock.state,
    areaId,
    areaLabel: areaLabel(areaId),
    href: dockPath(dock.id),
    callHref: phoneLink,
    phone: phoneLink ? dock.phone : null,
    directionsHref: directionsHref(dock),
    lat: dock.lat,
    lng: dock.lng,
    stale: postedIsStale(dock, now),
    hasPrice: lines.some((line) => line.figure.startsWith("$")),
    note: cardNote(dock),
    lines,
  };
}

export function homeCards(docks: Dock[], now = Date.now()): PostedCard[] {
  const cards: PostedCard[] = [];
  for (const dock of docks) {
    const card = toPostedCard(dock, now);
    if (card) cards.push(card);
  }
  return cards;
}

function byPostedThenName(left: PostedCard, right: PostedCard): number {
  const byPrice = Number(right.hasPrice) - Number(left.hasPrice);
  if (byPrice !== 0) return byPrice;
  return left.name.localeCompare(right.name, "en");
}

export function cardsInArea(cards: PostedCard[], areaId: HomeAreaId): PostedCard[] {
  return cards.filter((card) => card.areaId === areaId).sort(byPostedThenName);
}

export function cardsNearest(cards: PostedCard[], lat: number, lng: number): PostedCard[] {
  return [...cards].sort((left, right) => {
    const byMiles =
      milesBetween(lat, lng, left.lat, left.lng) - milesBetween(lat, lng, right.lat, right.lng);
    if (byMiles !== 0) return byMiles;
    return left.name.localeCompare(right.name, "en");
  });
}
