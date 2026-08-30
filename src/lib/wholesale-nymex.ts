import type { Cents, WholesaleProduct } from "./wholesale";

/** Verified on Yahoo Finance (public): NY Mercantile front-month futures. */
export const NYMEX_YAHOO_TICKERS: Record<WholesaleProduct, string> = {
  RB: "RB=F",
  HO: "HO=F",
};

export const NYMEX_YAHOO_LABEL: Record<WholesaleProduct, string> = {
  RB: "RBOB gasoline",
  HO: "NY Harbor ULSD / heating oil",
};

export type NymexQuoteStatus = "ok" | "failed" | "stale" | "unparseable";

export interface NymexQuote {
  product: WholesaleProduct;
  ticker: string;
  cents: Cents;
  asOfMs: number | null;
  asOfLabel: string | null;
  shortName: string | null;
  status: NymexQuoteStatus;
  note: string | null;
}

export interface NymexScreenPull {
  RB: NymexQuote;
  HO: NymexQuote;
  fetchedAt: string;
}

export const YAHOO_STALE_MS = 5 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const CACHE_MS = 60_000;

type CacheEntry = { at: number; value: NymexScreenPull };

let cache: CacheEntry | null = null;

function blankQuote(product: WholesaleProduct, status: NymexQuoteStatus, note: string): NymexQuote {
  return {
    product,
    ticker: NYMEX_YAHOO_TICKERS[product],
    cents: null,
    asOfMs: null,
    asOfLabel: null,
    shortName: null,
    status,
    note,
  };
}

export function dollarsPerGalToCents(dollars: number): Cents {
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  const cents = dollars * 100;
  if (!Number.isFinite(cents) || cents <= 0 || cents > 100_000) return null;
  return cents;
}

export function formatNymexAsOf(ms: number, timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(ms));
}

export function isYahooQuoteStale(asOfMs: number, nowMs: number, staleMs = YAHOO_STALE_MS): boolean {
  return nowMs - asOfMs > staleMs;
}

export function parseYahooChart(
  payload: unknown,
  product: WholesaleProduct,
  nowMs = Date.now(),
): NymexQuote {
  const expected = NYMEX_YAHOO_TICKERS[product];
  const failed = (status: NymexQuoteStatus, note: string): NymexQuote => blankQuote(product, status, note);

  if (payload == null || typeof payload !== "object") {
    return failed("unparseable", "Yahoo response was empty or not JSON.");
  }

  const chart = (payload as { chart?: { result?: unknown; error?: unknown } }).chart;
  if (!chart || chart.error) {
    return failed("unparseable", "Yahoo chart error.");
  }
  const result = Array.isArray(chart.result) ? chart.result[0] : null;
  if (!result || typeof result !== "object") {
    return failed("unparseable", "Yahoo chart had no result.");
  }

  const meta = (result as { meta?: Record<string, unknown> }).meta;
  if (!meta) return failed("unparseable", "Yahoo chart had no meta.");

  const symbol = typeof meta.symbol === "string" ? meta.symbol : "";
  if (symbol !== expected) {
    return failed("unparseable", `Expected ${expected}, got ${symbol || "no symbol"}.`);
  }
  if (meta.currency != null && meta.currency !== "USD") {
    return failed("unparseable", `Yahoo currency was ${String(meta.currency)}, not USD.`);
  }

  const price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : NaN;
  const cents = dollarsPerGalToCents(price);
  const timeSec = typeof meta.regularMarketTime === "number" ? meta.regularMarketTime : NaN;
  const asOfMs = Number.isFinite(timeSec) && timeSec > 0 ? timeSec * 1000 : null;
  const shortName = typeof meta.shortName === "string" ? meta.shortName : null;

  if (asOfMs == null) {
    return failed("unparseable", "Yahoo quote had no time.");
  }
  if (isYahooQuoteStale(asOfMs, nowMs)) {
    return {
      ...failed("stale", "Yahoo quote is stale — screen left blank."),
      asOfMs,
      asOfLabel: formatNymexAsOf(asOfMs),
      shortName,
    };
  }
  if (cents == null) {
    return {
      ...failed("unparseable", "Yahoo price was missing, zero, or unusable."),
      asOfMs,
      asOfLabel: formatNymexAsOf(asOfMs),
      shortName,
    };
  }

  return {
    product,
    ticker: expected,
    cents,
    asOfMs,
    asOfLabel: formatNymexAsOf(asOfMs),
    shortName,
    status: "ok",
    note: null,
  };
}

async function fetchYahooChart(ticker: string): Promise<unknown> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; DockPosted/1.0; wholesale NYMEX screen)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Yahoo HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchYahooNymexScreens(nowMs = Date.now()): Promise<NymexScreenPull> {
  if (cache && nowMs - cache.at < CACHE_MS) {
    return cache.value;
  }

  const fetchedAt = new Date(nowMs).toISOString();
  const products: WholesaleProduct[] = ["RB", "HO"];
  const quotes = await Promise.all(
    products.map(async (product) => {
      try {
        const json = await fetchYahooChart(NYMEX_YAHOO_TICKERS[product]);
        return parseYahooChart(json, product, nowMs);
      } catch {
        return blankQuote(product, "failed", "Yahoo request failed — screen left blank.");
      }
    }),
  );

  const value: NymexScreenPull = {
    RB: quotes[0]!,
    HO: quotes[1]!,
    fetchedAt,
  };
  cache = { at: nowMs, value };
  return value;
}

export function nymexFallbackMap(pull: NymexScreenPull): Record<WholesaleProduct, Cents> {
  return {
    RB: pull.RB.status === "ok" ? pull.RB.cents : null,
    HO: pull.HO.status === "ok" ? pull.HO.cents : null,
  };
}
