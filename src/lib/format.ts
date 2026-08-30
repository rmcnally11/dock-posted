import type { Ethanol, FuelQuote, SourceLabel } from "./types";

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "Call";
  return `$${value.toFixed(3)}`;
}

export function formatQuote(quote: FuelQuote | null): string {
  if (!quote) return "—";
  if (quote.status === "not-sold") return "Not sold";
  if (quote.status === "no-report") return "No report";
  if (quote.status === "call") return "Call";
  if (quote.pricePerGallon == null) return "Call";
  const grade = quote.product === "diesel" ? "diesel" : quote.product;
  const ethanol = quote.ethanol === "unknown" ? "" : ` ${quote.ethanol}`;
  return `${formatPrice(quote.pricePerGallon)} ${grade}${ethanol}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Never";
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
      return "E0 / ethanol-free";
    case "E10":
      return "E10";
    case "E15":
      return "E15 — not for boats";
    default:
      return "Ethanol unknown";
  }
}
