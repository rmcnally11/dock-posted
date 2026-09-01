import type { Ethanol, FuelQuote, SourceLabel } from "./types";

/** Missing pump number. A blank is a fact. Not a status code. */
export const BLANK = "—";

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return BLANK;
  return `$${value.toFixed(3)}`;
}

export function formatQuote(quote: FuelQuote | null): string {
  if (!quote) return BLANK;
  if (quote.status === "not-sold") return "Not sold";
  if (quote.status === "no-report" || quote.status === "call") return BLANK;
  if (quote.pricePerGallon == null) return BLANK;
  const grade = quote.product === "diesel" ? "diesel" : quote.product;
  const ethanol = quote.ethanol === "unknown" ? "" : ` ${quote.ethanol}`;
  return `${formatPrice(quote.pricePerGallon)} ${grade}${ethanol}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return BLANK;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
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
