import rawHistory from "../../data/price-history.json";
import type { Dock } from "./types";

export interface PriceCheckLine {
  label: string;
  pricePerGallon: number;
}

export interface PriceCheck {
  checkedOn: string;
  source: "marina site";
  sourceUrl: string | null;
  lines: PriceCheckLine[];
  /**
   * A later read of a marina or city page that does not print a date.
   * The prices match the last stored check, so this row is not a new price date.
   */
  unchanged?: boolean;
}

type HistoryFile = Record<string, unknown>;

export function isPriceCheck(value: unknown): value is PriceCheck {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<PriceCheck>;
  if (row.source !== "marina site") return false;
  if (typeof row.checkedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.checkedOn)) return false;
  if (!Array.isArray(row.lines) || row.lines.length === 0) return false;
  return row.lines.every(
    (line) =>
      !!line &&
      typeof line.label === "string" &&
      line.label.trim().length > 0 &&
      typeof line.pricePerGallon === "number" &&
      Number.isFinite(line.pricePerGallon),
  );
}

export function historyFor(id: string): PriceCheck[] {
  const file = rawHistory as HistoryFile;
  const rows = file[id];
  if (!Array.isArray(rows)) return [];
  return rows.filter(isPriceCheck).map((check) => ({
    checkedOn: check.checkedOn,
    source: "marina site",
    sourceUrl: typeof check.sourceUrl === "string" ? check.sourceUrl : null,
    lines: check.lines.map((line) => ({
      label: line.label,
      pricePerGallon: line.pricePerGallon,
    })),
  }));
}

type DatedDock = Pick<Dock, "id" | "quotes" | "lastVerifiedAt" | "lastVerifiedSource">;

function postedPrices(dock: DatedDock): number[] {
  return dock.quotes
    .filter((quote) => quote.status === "posted" && quote.pricePerGallon != null)
    .map((quote) => quote.pricePerGallon as number)
    .sort((left, right) => left - right);
}

function samePrices(live: number[], check: PriceCheck): boolean {
  const stored = check.lines.map((line) => line.pricePerGallon).sort((left, right) => left - right);
  return live.length > 0 && live.length === stored.length && live.every((price, index) => price === stored[index]);
}

function newestFirst(checks: PriceCheck[]): PriceCheck[] {
  return [...checks].sort((left, right) => (left.checkedOn < right.checkedOn ? 1 : -1));
}

/**
 * A later read of an undated marina or city page whose prices match the last stored check.
 * A different price is not this: that read is a new check.
 */
export function unchangedRecheck(
  dock: DatedDock,
  earlier: PriceCheck[] = historyFor(dock.id),
): { readOn: string; checkedOn: string } | null {
  if (dock.lastVerifiedSource !== "marina site") return null;
  if (!dock.lastVerifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(dock.lastVerifiedAt)) return null;
  const latest = newestFirst(earlier.filter(isPriceCheck))[0];
  if (!latest || dock.lastVerifiedAt <= latest.checkedOn) return null;
  if (!samePrices(postedPrices(dock), latest)) return null;
  return { readOn: dock.lastVerifiedAt, checkedOn: latest.checkedOn };
}

/** The day to print with a price. A matching re-read keeps the stored check, not the read. */
export function priceCheckIso(dock: DatedDock): string | null {
  return unchangedRecheck(dock)?.checkedOn ?? dock.lastVerifiedAt;
}

/** Month and day, no year. "Oct 7". */
function monthDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "Page re-checked Oct 7, price unchanged". Month and day, no year. */
export function recheckHistoryLabel(readOn: string): string {
  return `Page re-checked ${monthDay(readOn)}, price unchanged`;
}

/**
 * A city harbor page is stored as "marina site".
 * The notes name it a city page or a city rates page.
 */
export function cityPostedPage(notes: string | null | undefined): boolean {
  return /city (?:rates )?page/i.test(notes ?? "");
}

/** "Still posted on the marina's page Oct 7." A city page says "city's page". */
export function stillPostedSentence(readOn: string, cityPage: boolean): string {
  const page = cityPage ? "city's page" : "marina's page";
  return `Still posted on the ${page} ${monthDay(readOn)}.`;
}

/** The confirmation line for one dock. City pages are named in the notes. */
export function stillPostedCopy(dock: { notes?: string | null }, readOn: string): string {
  return stillPostedSentence(readOn, cityPostedPage(dock.notes));
}
