import * as cheerio from "cheerio";
import type { Dock, Ethanol, FuelQuote, Product, QuoteStatus } from "./types";

export const WG_REPORTS = {
  gulf: {
    id: "gulf-al-tx",
    title: "Gulf Coast — AL thru TX",
    url: "https://www.waterwayguide.com/fuel-price-report/11/gulf-coast-al-thru-tx",
  },
  keys: {
    id: "florida-keys",
    title: "Florida Keys",
    url: "https://www.waterwayguide.com/fuel-price-report/7/florida-keys",
  },
  eastFlorida: {
    id: "east-florida",
    title: "East Coast of Florida",
    url: "https://www.waterwayguide.com/fuel-price-report/6/east-coast-of-florida",
  },
  georgia: {
    id: "georgia",
    title: "Georgia",
    url: "https://www.waterwayguide.com/fuel-price-report/5/georgia",
  },
  carolinas: {
    id: "carolinas",
    title: "Carolinas",
    url: "https://www.waterwayguide.com/fuel-price-report/4/carolinas",
  },
  chesapeake: {
    id: "chesapeake",
    title: "Chesapeake",
    url: "https://www.waterwayguide.com/fuel-price-report/3/chesapeake-bay",
  },
  nyNj: {
    id: "ny-nj",
    title: "New Jersey / New York",
    url: "https://www.waterwayguide.com/fuel-price-report/2/new-jersey-new-york",
  },
  newEngland: {
    id: "new-england",
    title: "New England",
    url: "https://www.waterwayguide.com/fuel-price-report/1/maine-to-new-york",
  },
} as const;

export const CORRIDOR_NAME_ALIASES: Record<string, string> = {
  "marina bay harbor": "marina-bay-harbor",
  "galveston yacht marina": "galveston-yacht-marina",
  "seabrook marina/shipyard and blue marlin fuel dock": "blue-marlin-seabrook",
  "blue marlin fuel dock": "blue-marlin-seabrook",
  "south shore harbour marina": "south-shore-harbour",
  "houston yacht club": "houston-yacht-club",
  "lakewood yacht club-private": "lakewood-yacht-club",
  "lakewood yacht club": "lakewood-yacht-club",
  "waterman's harbor": "watermans-harbor",
  "key largo harbor marina": "key-largo-harbor",
  "pilot house marina & restaurant": "pilot-house-marina",
  "pilot house marina": "pilot-house-marina",
  "mangrove marina": "mangrove-marina",
  "plantation yacht harbor marina": "plantation-yacht-harbor",
  "islamarina": "islamarina",
  "the marina at islamorada yacht club": "snake-creek-marina",
  "snake creek marina": "snake-creek-marina",
  "three waters resort and marina": "three-waters-marina",
  "world wide sportsman / bayside marina": "worldwide-sportsman",
  "world wide sportsman": "worldwide-sportsman",
  "bud'n mary's fishing marina": "bud-n-marys",
  "tavernier creek marina": "tavernier-creek",
  "garden cove marina": "garden-cove-marina",
  "cove harbor marina and drystack": "cove-harbor-rockport",
  "cove harbor marina": "cove-harbor-rockport",
  "marina del mar": "marina-del-mar",
  "marina del mar resort and marina": "marina-del-mar",
  "ocean reef club": "ocean-reef-club",
  "ocean reef marina": "ocean-reef-club",
  "island moorings marina": "island-moorings",
  "cypress cove marina": "cypress-cove-venice",
  "orange beach marina": "orange-beach-marina",
  "sportsman marina": "sportsman-marina",
  "marina jack": "marina-jack-sarasota",
  "st. petersburg municipal marina": "st-pete-municipal-marina",
  "naples city dock": "naples-city-dock",
  "miami beach marina": "miami-beach-marina",
  "bahia mar yachting center": "bahia-mar-fort-lauderdale",
  "sailfish marina resort": "sailfish-marina-palm-beach",
  "charleston city marina": "charleston-city-marina",
  "beaufort docks": "beaufort-docks-nc",
  "hatteras harbor marina": "hatteras-harbor-marina",
  "herrington harbour north": "herrington-harbour-north",
  "white marlin marina": "white-marlin-marina",
  "canyon club resort marina": "canyon-club-cape-may",
  "montauk marine basin": "montauk-marine-basin",
  "nantucket boat basin": "nantucket-boat-basin",
};

const OFF_SALTWATER = ["lake travis", "lake texoma", "lake of the ozarks"];

export interface ParsedMarina {
  name: string;
  city: string | null;
  comments: string | null;
  lastUpdate: string | null;
  nonEthanol: boolean | null;
  quotes: FuelQuote[];
  dockId: string | null;
}

export interface FetchResult {
  ok: boolean;
  url: string;
  status: number | null;
  blocked: boolean;
  reason: string | null;
  htmlBytes: number;
  parsed: ParsedMarina[];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’]/g, "'")
    .trim();
}

export function matchDockId(name: string): string | null {
  const key = normalizeName(name);
  return CORRIDOR_NAME_ALIASES[key] ?? null;
}

export function isOutOfCorridor(name: string, city: string | null): boolean {
  const hay = `${name} ${city ?? ""}`.toLowerCase();
  return OFF_SALTWATER.some((token) => hay.includes(token));
}

function parseMoney(raw: string): { price: number | null; status: QuoteStatus; taxIncluded: boolean | null } {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { price: null, status: "call", taxIncluded: null };
  if (/do not sell/i.test(text)) return { price: null, status: "not-sold", taxIncluded: null };
  if (/no report/i.test(text)) return { price: null, status: "no-report", taxIncluded: null };
  if (/^no\b/i.test(text) && !/\$/.test(text)) return { price: null, status: "not-sold", taxIncluded: null };
  if (/call/i.test(text)) return { price: null, status: "call", taxIncluded: null };
  const match = text.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return { price: null, status: "call", taxIncluded: null };
  const taxIncluded = /tax included/i.test(text)
    ? true
    : /tax not included/i.test(text)
      ? false
      : null;
  return { price: Number(match[1]), status: "posted", taxIncluded };
}

function parseIsoDate(raw: string | null): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  let year = match[3];
  if (year.length === 2) year = Number(year) > 50 ? `19${year}` : `20${year}`;
  return `${year}-${month}-${day}`;
}

function looksLikeChallenge(html: string): boolean {
  return (
    /just a moment/i.test(html) ||
    /cf-challenge/i.test(html) ||
    /cf-chl/i.test(html) ||
    /enable javascript and cookies to continue/i.test(html)
  );
}

function looksLikeFuelReport(html: string): boolean {
  return /fuel price/i.test(html) && /diesel/i.test(html) && /octane/i.test(html);
}

function ethanolFromFlags(nonEthanol: boolean | null, product: Product): Ethanol {
  if (product === "diesel") return "unknown";
  if (nonEthanol) return "E0";
  if (nonEthanol === false) return "E10";
  return "unknown";
}

export function parseFuelReportHtml(html: string): ParsedMarina[] {
  const $ = cheerio.load(html);
  const headings = $("h2, h3, h4")
    .toArray()
    .map((el) => ({
      name: $(el).text().replace(/\s+/g, " ").trim(),
      el,
    }))
    .filter(
      (item) =>
        item.name.length > 2 &&
        !/fuel price|popular|subscribe|gulf coast|florida keys|east coast|atlantic|maine to|long island|chesapeake|click here/i.test(
          item.name,
        ),
    );

  if (headings.length === 0) {
    return parseFuelReportText($.root().text());
  }

  const parsed: ParsedMarina[] = [];

  for (const heading of headings) {
    const blockText = collectHeadingBlock($, heading.el);
    const marina = parseMarinaBlock(heading.name, blockText);
    if (marina) parsed.push(marina);
  }

  return parsed;
}

function collectHeadingBlock(
  $: cheerio.CheerioAPI,
  el: Parameters<cheerio.CheerioAPI>[0],
): string {
  const parts: string[] = [];
  let node = $(el).next();
  while (node.length && !/^(h1|h2|h3|h4)$/i.test(node[0].tagName ?? "")) {
    parts.push(node.text());
    node = node.next();
  }
  return parts.join("\n");
}

export function parseFuelReportText(text: string): ParsedMarina[] {
  const chunks = text.split(/\n(?=### )/);
  const parsed: ParsedMarina[] = [];
  for (const chunk of chunks) {
    const nameMatch = chunk.match(/^###\s+(.+)$/m);
    if (!nameMatch) continue;
    const marina = parseMarinaBlock(nameMatch[1].trim(), chunk);
    if (marina) parsed.push(marina);
  }
  return parsed;
}

function fieldValue(block: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `${escaped}\\s*:\\s*\\|?\\s*(.+?)(?=\\s*(?:Comments|Diesel Price|Gas:|\\d{2,3}\\s+Octane|Non-Ethanol|ValvTect|Last Update|Discounts)\\s*:|$)`,
    "i",
  );
  const match = re.exec(block.replace(/\s+/g, " "));
  return match?.[1]?.trim() || null;
}

function parseMarinaBlock(name: string, block: string): ParsedMarina | null {
  if (!name || /click here|sorted by/i.test(name)) return null;
  const cityMatch = block.match(
    /([A-Za-z .'-]+,\s*(?:TX|LA|MS|AL|FL|GA|SC|NC|VA|MD|NJ|NY|CT|RI|MA|NH|ME))/,
  );
  const city = cityMatch?.[1]?.trim() ?? null;
  const comments = fieldValue(block, "Comments");
  const lastUpdate = parseIsoDate(fieldValue(block, "Last Update"));
  const nonEthanolRaw = fieldValue(block, "Non-Ethanol");
  const nonEthanol = nonEthanolRaw
    ? /^yes/i.test(nonEthanolRaw)
      ? true
      : /^no/i.test(nonEthanolRaw)
        ? false
        : null
    : null;

  const quotes: FuelQuote[] = [];
  const dieselLine = fieldValue(block, "Diesel Price");
  if (dieselLine) {
    const parsed = parseMoney(dieselLine);
    quotes.push({
      product: "diesel",
      pricePerGallon: parsed.price,
      ethanol: "unknown",
      status: parsed.status,
      taxIncluded: parsed.taxIncluded,
    });
  }

  for (const product of ["87", "89", "90", "91", "93"] as Product[]) {
    const line = fieldValue(block, `${product} Octane`);
    if (!line) continue;
    const parsed = parseMoney(line);
    quotes.push({
      product,
      pricePerGallon: parsed.price,
      ethanol: ethanolFromFlags(nonEthanol, product),
      status: parsed.status,
      taxIncluded: parsed.taxIncluded,
    });
  }

  return {
    name,
    city,
    comments,
    lastUpdate,
    nonEthanol,
    quotes,
    dockId: matchDockId(name),
  };
}

export async function fetchPublicReport(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "DockPosted/1.0 (public Waterway Guide fuel-report fetcher; +https://github.com/dockposted)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });

    const html = await response.text();
    const blocked = response.status === 403 || looksLikeChallenge(html);
    if (blocked) {
      return {
        ok: false,
        url,
        status: response.status,
        blocked: true,
        reason:
          "Waterway Guide returned a bot challenge or 403. Public HTML is blocked from this environment. Manual reports and the seed file still work.",
        htmlBytes: html.length,
        parsed: [],
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        url,
        status: response.status,
        blocked: false,
        reason: `HTTP ${response.status}`,
        htmlBytes: html.length,
        parsed: [],
      };
    }

    if (!looksLikeFuelReport(html)) {
      return {
        ok: false,
        url,
        status: response.status,
        blocked: false,
        reason:
          "Fetched HTML did not look like a Waterway Guide fuel report. Parser refused to invent results.",
        htmlBytes: html.length,
        parsed: [],
      };
    }

    const parsed = parseFuelReportHtml(html);
    return {
      ok: parsed.length > 0,
      url,
      status: response.status,
      blocked: false,
      reason: parsed.length === 0 ? "Parser found no marina blocks" : null,
      htmlBytes: html.length,
      parsed,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      blocked: false,
      reason: error instanceof Error ? error.message : "Fetch failed",
      htmlBytes: 0,
      parsed: [],
    };
  }
}

export function mergeParsedIntoDocks(
  docks: Dock[],
  parsed: ParsedMarina[],
  sourceUrl: string,
): { docks: Dock[]; updatedIds: string[]; skipped: string[] } {
  const next = docks.map((dock) => ({ ...dock, quotes: dock.quotes.map((q) => ({ ...q })) }));
  const updatedIds: string[] = [];
  const skipped: string[] = [];

  for (const marina of parsed) {
    if (isOutOfCorridor(marina.name, marina.city)) {
      skipped.push(`${marina.name} (off saltwater coast)`);
      continue;
    }
    if (!marina.dockId) {
      skipped.push(`${marina.name} (not in seed)`);
      continue;
    }
    const dock = next.find((item) => item.id === marina.dockId);
    if (!dock) {
      skipped.push(`${marina.name} (unknown id)`);
      continue;
    }
    if (marina.quotes.length === 0) {
      skipped.push(`${marina.name} (no quotes parsed)`);
      continue;
    }

    for (const quote of marina.quotes) {
      const skipUnusedGas =
        quote.product !== "diesel" &&
        quote.status === "not-sold" &&
        !dock.quotes.some((item) => item.product === quote.product);
      if (skipUnusedGas) continue;
      const existing = dock.quotes.find((item) => item.product === quote.product);
      if (existing) Object.assign(existing, quote);
      else dock.quotes.push(quote);
    }
    dock.lastVerifiedAt = marina.lastUpdate;
    dock.lastVerifiedSource = "Waterway Guide";
    dock.sourceUrl = sourceUrl;
    if (marina.comments) {
      dock.notes = marina.comments;
    }
    if (marina.nonEthanol === true) dock.ethanol = "E0";
    if (marina.nonEthanol === false && dock.ethanol === "unknown") dock.ethanol = "E10";
    updatedIds.push(dock.id);
  }

  return { docks: next, updatedIds, skipped };
}
