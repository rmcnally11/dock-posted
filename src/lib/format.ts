import type { Ethanol, FuelQuote, SourceLabel } from "./types";

/** Missing pump number. A blank is a fact. Not a status code. */
export const BLANK = "—";

/**
 * Display only. A trailing third decimal of 0 is omitted ($6.590 shows as $6.59).
 * A real third decimal ($5.659) is kept. The stored number is not changed.
 */
export function formatGallonPrice(value: number): string {
  const sign = value < 0 ? "-" : "";
  const expanded = Math.abs(value).toFixed(6);
  const [whole, frac = ""] = expanded.split(".");
  const mills = (frac + "000").slice(0, 3);
  const shown = mills.endsWith("0") ? `${whole}.${mills.slice(0, 2)}` : `${whole}.${mills}`;
  return `${sign}$${shown}`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return BLANK;
  return formatGallonPrice(value);
}

export function blankQuoteLine(kind: "gas" | "diesel"): string {
  return kind === "diesel"
    ? "Diesel: no price posted. Call the dock."
    : "Gas: no price posted. Call the dock.";
}

export function notSoldLine(kind: "gas" | "diesel"): string {
  return kind === "diesel" ? "No diesel here" : "No gas here";
}

export function taxPhrase(taxIncluded: boolean | null): string {
  if (taxIncluded === true) return "tax included";
  if (taxIncluded === false) return "tax not included";
  return "tax not stated";
}

function ethanolPhrase(ethanol: Ethanol): string {
  switch (ethanol) {
    case "E0":
      return "no ethanol";
    case "E10":
      return "10% ethanol";
    case "E15":
      return "15% ethanol, not for boats";
    default:
      return "ethanol not stated";
  }
}

/** Plain words for one hose. Does not add a grade the marina did not name. */
export function gasWords(quote: FuelQuote): string {
  if (quote.product === "diesel") return "Diesel";
  const octane = quote.product === "gasoline" ? null : quote.product;
  if (!octane && quote.ethanol === "unknown") return "Gas, octane and ethanol not stated";
  if (!octane && quote.ethanol === "E0") return "Gas, no ethanol, octane not stated";
  if (!octane) return `Gas, ${ethanolPhrase(quote.ethanol)}, octane not stated`;
  if (quote.product === "87" && quote.ethanol === "unknown") {
    return "Regular gas, 87 octane, ethanol not stated";
  }
  if (quote.product === "87" && quote.ethanol === "E0") {
    return "Regular gas, no ethanol, 87 octane";
  }
  if (quote.product === "87") {
    return `Regular gas, 87 octane, ${ethanolPhrase(quote.ethanol)}`;
  }
  if (quote.ethanol === "E0") return `Gas, no ethanol, ${octane} octane`;
  if (quote.ethanol === "unknown") return `Gas, ${octane} octane, ethanol not stated`;
  return `Gas, ${ethanolPhrase(quote.ethanol)}, ${octane} octane`;
}

export function quoteParts(quote: FuelQuote | null, kind: "gas" | "diesel" = "gas"): {
  figure: string;
  rest: string;
  blank: boolean;
} {
  if (!quote) return { figure: blankQuoteLine(kind), rest: "", blank: true };
  const lineKind = quote.product === "diesel" ? "diesel" : kind;
  if (quote.status === "not-sold") return { figure: notSoldLine(lineKind), rest: "", blank: true };
  if (quote.status === "no-report" || quote.status === "call" || quote.pricePerGallon == null) {
    return { figure: blankQuoteLine(lineKind), rest: "", blank: true };
  }
  return {
    figure: `${formatGallonPrice(quote.pricePerGallon)} a gallon`,
    rest: `${gasWords(quote)}, ${taxPhrase(quote.taxIncluded)}`,
    blank: false,
  };
}

export function formatQuote(quote: FuelQuote | null): string {
  const parts = quoteParts(quote);
  return parts.rest ? `${parts.figure}. ${parts.rest}` : parts.figure;
}

/**
 * lastVerifiedAt is a calendar date (YYYY-MM-DD), the day the price was checked.
 * Date-only ISO is UTC midnight; formatting that instant in Chicago shows the day before.
 */
export function formatDate(iso: string | null): string {
  if (!iso) return BLANK;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const date = new Date(dateOnly ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : "America/Chicago",
  }).format(date);
}

/** Checked date for a source line. A different year keeps the year, so 2022 cannot read as this year. */
export function formatShortDate(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const date = new Date(dateOnly ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = dateOnly ? Number(iso.slice(0, 4)) : date.getFullYear();
  const nowYear = new Date(now).getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(year !== nowYear ? { year: "numeric" as const } : {}),
    timeZone: dateOnly ? "UTC" : "America/Chicago",
  }).format(date);
}

export function sourceLabel(source: SourceLabel | null): string {
  return source ?? "Unverified";
}

export function ethanolCopy(ethanol: Ethanol): string {
  switch (ethanol) {
    case "E0":
      return "E0";
    case "E10":
      return "E10";
    case "E15":
      return "E15 — not for boats";
    default:
      return BLANK;
  }
}

/** US dock phones only. Does not invent a number — wraps what the dock already posted. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return null;
}

export function isBlankPrice(text: string): boolean {
  return text === BLANK;
}
