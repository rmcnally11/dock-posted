import {
  AREA_CALL_HEADING,
  AREA_EMPTY_PRICES,
  AREA_PRICES_HEADING,
  areaTitle,
  buildAreaPage,
  type AreaDock,
  type AreaPageModel,
  type AreaPriceLine,
} from "@/lib/area";
import { DOCK_ORIGIN } from "@/lib/dock-page";
import { priceCheckIso } from "@/lib/price-check";
import { postedQuotes } from "@/lib/freshness";
import {
  chicagoCivilDate,
  civilDate,
  formatDate,
  formatPrice,
  gasWords,
  quoteParts,
  sourceInstant,
  statedHose,
} from "@/lib/format";
import { plainAreaName } from "@/lib/income";
import { HOME_AREAS, areaPath, dockTimeZone, homeArea, type HomeAreaId } from "@/lib/posted";
import { readDocks, readReviewQueue } from "@/lib/store";
import type { Dock, DockPriceAlert, FuelQuote } from "@/lib/types";

/** Envelope line. The place name is the mail's area name, with the slash read as "and". */
export const WEEKLY_FUEL_SUBJECT_LEAD = "Cheapest posted fuel";

/** "Galveston Bay / Clear Lake" reads as "Galveston Bay and Clear Lake", the same as a dock page. */
export function weeklyFuelTitle(id: HomeAreaId): string {
  return plainAreaName(areaTitle(id));
}

export function weeklyFuelSubject(title: string): string {
  return `${WEEKLY_FUEL_SUBJECT_LEAD}, ${title}`;
}

/** The area intro. Fresh prices are listed cheapest first. A week-old price is not in that list. */
export function weeklyFuelIntro(title: string): string {
  return `Fuel docks in ${title}, cheapest posted price first. Call before you go.`;
}

export const WEEKLY_FUEL_UNSUBSCRIBE_LABEL = "Unsubscribe";

/** Replaced later by a real unsubscribe URL. Nothing is sent from this build. */
export const WEEKLY_FUEL_UNSUBSCRIBE_HREF = "{{unsubscribe_url}}";

export const WEEKLY_FUEL_FOOTER =
  "Dock Posted · Prices exactly as each marina posted them. No price posted? Call the dock.";

/** Same sentence as the dock page when the stored price is past the fresh window. */
export const WEEKLY_FUEL_STALE = "Price over a week old. Call the dock.";

/** The marina's own page, or a city harbor page stored the same way, printed this price. */
export const WEEKLY_FUEL_MARINA_SOURCE = "Marina's website";

/** A Waterway Guide row. This is not the marina's own page. */
export const WEEKLY_FUEL_GUIDE_SOURCE = "Waterway Guide";

export const WEEKLY_FUEL_PREVIEW_TITLE = "Fuel mail preview";

export const WEEKLY_FUEL_PREVIEW_GATE = "This page only shows the mail. It does not send.";

export const WEEKLY_FUEL_PREVIEW_NOTE = "Preview. Nothing is sent.";

const NAVY = "#0b1f33";
const CREAM = "#fbf8f3";
const FOG = "#f4f6f8";
const SIGNAL = "#e23b3b";
const DIESEL = "#2f8fd6";
const STALE = "#8d5a32";
const INK = "#3d5a73";
const MUTED = "#6d8294";
const LINE = "#e3ddd2";

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const MONO = "ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace";

export type WeeklyFuelMail = {
  id: HomeAreaId;
  title: string;
  subject: string;
  intro: string;
  text: string;
  html: string;
};

export function weeklyDockHref(id: string): string {
  return `${DOCK_ORIGIN}/docks/${encodeURIComponent(id)}`;
}

export function weeklyAreaHref(id: HomeAreaId): string {
  return areaPath(id);
}

export type WeeklyFuelPreviewLink = {
  id: HomeAreaId;
  title: string;
  href: `/review/fuel/${HomeAreaId}`;
  current: boolean;
};

export function weeklyFuelPreviewLinks(current: HomeAreaId): WeeklyFuelPreviewLink[] {
  return HOME_AREAS.map((area) => ({
    id: area.id,
    title: weeklyFuelTitle(area.id),
    href: `/review/fuel/${area.id}`,
    current: area.id === current,
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sourceLine(dock: AreaDock): string {
  if (!dock.source) return "";
  const label = escapeHtml(dock.source);
  const body = dock.sourceHref
    ? `<a href="${escapeHtml(dock.sourceHref)}" style="color:${MUTED};text-decoration:underline;">${label}</a>`
    : label;
  return `<p data-testid="weekly-source-${escapeHtml(dock.id)}" style="margin:4px 0 0;font-family:${SANS};font-size:11px;line-height:1.4;color:${MUTED};">${body}</p>`;
}

function dockBlock(dock: AreaDock): string {
  const id = escapeHtml(dock.id);
  const stale = dock.stale
    ? `<p data-testid="weekly-stale-${id}" style="margin:8px 0 0;font-family:${SANS};font-size:13px;line-height:1.4;color:${STALE};">${escapeHtml(WEEKLY_FUEL_STALE)}</p>`
    : "";
  const lines = dock.lines
    .map((line) => {
      const color = line.kind === "diesel" ? DIESEL : SIGNAL;
      return `<tr>
        <td style="padding:3px 12px 3px 0;font-family:${SANS};font-size:14px;line-height:1.4;color:${INK};">${escapeHtml(line.label)}</td>
        <td data-testid="weekly-price-${id}-${escapeHtml(line.key)}" align="right" style="padding:3px 0;font-family:${MONO};font-size:22px;line-height:1;font-weight:500;color:${color};white-space:nowrap;">${escapeHtml(line.figure)}</td>
      </tr>`;
    })
    .join("");
  const note = dock.note
    ? `<p style="margin:4px 0 0;font-family:${SANS};font-size:11px;line-height:1.4;font-weight:600;letter-spacing:0.02em;color:${INK};">${escapeHtml(dock.note)}</p>`
    : "";
  const asOf = dock.asOf
    ? `<p data-testid="weekly-asof-${id}" style="margin:8px 0 0;font-family:${SANS};font-size:11px;line-height:1.4;color:${MUTED};">As of ${escapeHtml(dock.asOf)}</p>`
    : "";
  return `<table role="presentation" data-testid="weekly-dock-${id}" data-stale="${dock.stale ? "true" : "false"}" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;background-color:${FOG};border:1px solid ${LINE};border-radius:16px;">
    <tr>
      <td style="padding:14px 16px 12px;">
        <p style="margin:0;font-family:${SERIF};font-size:20px;line-height:1.25;color:${NAVY};">
          <a href="${escapeHtml(weeklyDockHref(dock.id))}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(dock.name)}</a><span style="font-family:${SANS};font-size:14px;color:${INK};"> · ${escapeHtml(dock.city)}, ${escapeHtml(dock.state)}</span>
        </p>
        ${stale}
        ${note}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">${lines}</table>
        ${asOf}
        ${sourceLine(dock)}
      </td>
    </tr>
  </table>`;
}

function plainDock(dock: AreaDock, lines: string[]): void {
  lines.push(dock.name);
  lines.push(`${dock.city}, ${dock.state}`);
  lines.push(weeklyDockHref(dock.id));
  if (dock.stale) lines.push(WEEKLY_FUEL_STALE);
  if (dock.note) lines.push(dock.note);
  for (const line of dock.lines) lines.push(`${line.label} ${line.figure}`);
  if (dock.asOf) lines.push(`As of ${dock.asOf}`);
  if (dock.source) lines.push(dock.source);
  lines.push("");
}

function plainText(input: {
  subject: string;
  intro: string;
  title: string;
  areaHref: string;
  fresh: AreaDock[];
  callAhead: AreaDock[];
}): string {
  const lines: string[] = [input.subject, "", input.intro, ""];
  const stalePriced = input.callAhead.some((dock) => dock.lines.length > 0);
  if (input.fresh.length === 0 && !stalePriced) {
    lines.push(AREA_EMPTY_PRICES, "");
  }
  for (const dock of input.fresh) plainDock(dock, lines);
  if (input.callAhead.length > 0) {
    lines.push(AREA_CALL_HEADING, "");
    for (const dock of input.callAhead) plainDock(dock, lines);
  }
  lines.push(input.title, input.areaHref, "", WEEKLY_FUEL_UNSUBSCRIBE_LABEL, WEEKLY_FUEL_UNSUBSCRIBE_HREF, "", WEEKLY_FUEL_FOOTER);
  return lines.join("\n");
}

function callRow(dock: AreaDock): string {
  const id = escapeHtml(dock.id);
  return `<p data-testid="weekly-call-${id}" style="margin:14px 0 0;font-family:${SERIF};font-size:18px;line-height:1.35;color:${NAVY};">
    <a href="${escapeHtml(weeklyDockHref(dock.id))}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(dock.name)}</a><span style="font-family:${SANS};font-size:14px;color:${INK};"> · ${escapeHtml(dock.city)}, ${escapeHtml(dock.state)}</span>
  </p>`;
}

function htmlMail(input: {
  subject: string;
  intro: string;
  title: string;
  areaHref: string;
  fresh: AreaDock[];
  callAhead: AreaDock[];
}): string {
  const title = escapeHtml(input.title);
  const areaHref = escapeHtml(input.areaHref);
  const stalePriced = input.callAhead.some((dock) => dock.lines.length > 0);
  const freshBody =
    input.fresh.length === 0
      ? stalePriced
        ? ""
        : `<p data-testid="weekly-empty" style="margin:20px 0 0;font-family:${SANS};font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(AREA_EMPTY_PRICES)}</p>`
      : input.fresh.map(dockBlock).join("");
  const callBody =
    input.callAhead.length === 0
      ? ""
      : `<h2 data-testid="weekly-call-heading" style="margin:28px 0 0;font-family:${SERIF};font-size:22px;line-height:1.25;font-weight:600;color:${NAVY};">${escapeHtml(AREA_CALL_HEADING)}</h2>${input.callAhead
          .map((dock) => (dock.lines.length > 0 ? dockBlock(dock) : callRow(dock)))
          .join("")}`;
  const body = `${freshBody}${callBody}`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${CREAM};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.intro)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CREAM};">
      <tr>
        <td align="center" style="padding:28px 16px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
            <tr>
              <td>
                <p style="margin:0;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${SIGNAL};">${escapeHtml(AREA_PRICES_HEADING)}</p>
                <h1 style="margin:10px 0 0;font-family:${SERIF};font-size:32px;line-height:1.15;font-weight:600;color:${NAVY};">
                  <a data-testid="weekly-area-link" href="${areaHref}" style="color:${NAVY};text-decoration:underline;">${title}</a>
                </h1>
                <p style="margin:14px 0 0;font-size:0;line-height:0;">
                  <span style="display:block;height:2px;background-color:${SIGNAL};"></span>
                  <span style="display:block;height:6px;"></span>
                  <span style="display:block;height:2px;background-color:${DIESEL};"></span>
                </p>
                <p style="margin:16px 0 0;font-family:${SANS};font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(input.intro)}</p>
                ${body}
                <p style="margin:28px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;">
                  <a data-testid="weekly-unsubscribe" href="${WEEKLY_FUEL_UNSUBSCRIBE_HREF}" style="color:${INK};text-decoration:underline;">${WEEKLY_FUEL_UNSUBSCRIBE_LABEL}</a>
                </p>
                <p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${NAVY};">${escapeHtml(WEEKLY_FUEL_FOOTER)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Same words as the dock page and the price tile. Not the area page's "87" / "93 E0". */
function mailLineLabel(quote: FuelQuote): string {
  const kind = quote.product === "diesel" ? "diesel" : "gas";
  return quoteParts(quote, kind).rest || statedHose(gasWords(quote));
}

function mailLines(dock: Dock): AreaPriceLine[] {
  const lines: AreaPriceLine[] = [];
  dock.quotes.forEach((quote, index) => {
    if (quote.status !== "posted" || quote.pricePerGallon == null || Number.isNaN(quote.pricePerGallon)) {
      return;
    }
    lines.push({
      key: `${quote.product}-${index}`,
      label: mailLineLabel(quote),
      figure: formatPrice(quote.pricePerGallon),
      kind: quote.product === "diesel" ? "diesel" : "gas",
    });
  });
  return lines;
}

/**
 * The stored day those posted dollars were checked.
 * lastVerifiedAt is often the morning the page was opened again, not a date the marina printed.
 * When an earlier marina-site check already stored the same prices, that check is the source date.
 * A date-only value is that calendar day. It is not read as UTC midnight in Chicago.
 */
function postedPrices(dock: Dock): number[] {
  return postedQuotes(dock)
    .map((quote) => quote.pricePerGallon)
    .filter((price): price is number => price != null)
    .sort((left, right) => left - right);
}

function storedDay(dock: Dock): string | null {
  return dock.lastVerifiedAt && DATE_ONLY.test(dock.lastVerifiedAt) ? dock.lastVerifiedAt : null;
}

export function weeklyFuelSource(dock: Dock): string | null {
  if (dock.lastVerifiedSource === "marina site") return WEEKLY_FUEL_MARINA_SOURCE;
  if (dock.lastVerifiedSource === "Waterway Guide") return WEEKLY_FUEL_GUIDE_SOURCE;
  return null;
}

export function weeklyFuelCheckedOn(dock: Dock): string | null {
  if (!weeklyFuelSource(dock) || postedPrices(dock).length === 0) return null;
  if (dock.lastVerifiedSource === "Waterway Guide") return storedDay(dock);
  if (dock.lastVerifiedSource !== "marina site") return null;
  const day = priceCheckIso(dock);
  return day && DATE_ONLY.test(day) ? day : null;
}

/** Printed as-of for the mail. A day after today in Chicago is not a source date. */
export function weeklyFuelAsOf(dock: Dock, now = new Date()): string | null {
  const day = weeklyFuelCheckedOn(dock);
  if (!day) return null;
  const instant = sourceInstant(day);
  if (!instant) return null;
  if (civilDate(instant, dockTimeZone(dock)) > chicagoCivilDate(now)) return null;
  return formatDate(day);
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

/** 87 when they named it, otherwise unlabeled gasoline. A higher octane is not the sort key. */
function cheapestGas(dock: Dock): number | null {
  const priced = (product: FuelQuote["product"]) =>
    dock.quotes
      .filter((quote) => quote.product === product && quote.status === "posted" && quote.pricePerGallon != null)
      .map((quote) => quote.pricePerGallon as number);
  const eightySeven = priced("87");
  if (eightySeven.length > 0) return Math.min(...eightySeven);
  const gasoline = priced("gasoline");
  if (gasoline.length > 0) return Math.min(...gasoline);
  return null;
}

function byCheapestThenName(left: AreaDock, right: AreaDock, byId: Map<string, Dock>): number {
  const a = byId.get(left.id);
  const b = byId.get(right.id);
  const aPrice = a ? cheapestGas(a) : null;
  const bPrice = b ? cheapestGas(b) : null;
  if (aPrice != null && bPrice != null && aPrice !== bPrice) return aPrice - bPrice;
  if (aPrice != null && bPrice == null) return -1;
  if (aPrice == null && bPrice != null) return 1;
  return left.name.localeCompare(right.name, "en");
}

function pricedMailDock(dock: Dock, row: AreaDock, now: number): AreaDock | null {
  const source = weeklyFuelSource(dock);
  if (!source) return null;
  const lines = mailLines(dock);
  if (lines.length === 0) return null;
  return {
    ...row,
    lines,
    asOf: weeklyFuelAsOf(dock, new Date(now)),
    source,
    sourceHref: sourceHref(dock.sourceUrl),
    stale: row.stale,
  };
}

/**
 * Fresh marina, city, and Waterway Guide prices, cheapest first.
 * A price over a week old leaves that ranking and sits with the call-ahead docks.
 * A staff report or a boater report stays off. Does not send.
 */
function mailSections(
  docks: Dock[],
  page: AreaPageModel,
  now: number,
): { fresh: AreaDock[]; callAhead: AreaDock[] } {
  const byId = new Map(docks.map((dock) => [dock.id, dock]));
  const fresh: AreaDock[] = [];
  const stale: AreaDock[] = [];
  const seen = new Set<string>();
  for (const row of [...page.priced, ...page.callAhead]) {
    const dock = byId.get(row.id);
    if (!dock || seen.has(row.id)) continue;
    const priced = pricedMailDock(dock, row, now);
    if (!priced) {
      if (mailLines(dock).length > 0) seen.add(row.id);
      continue;
    }
    seen.add(row.id);
    if (row.stale) stale.push(priced);
    else fresh.push(priced);
  }
  fresh.sort((left, right) => byCheapestThenName(left, right, byId));
  stale.sort((left, right) => byCheapestThenName(left, right, byId));
  const unpriced = page.callAhead
    .filter((row) => !seen.has(row.id))
    .map((row) => ({ ...row, lines: [], asOf: null, source: null, sourceHref: null, stale: false }));
  return { fresh, callAhead: [...stale, ...unpriced] };
}

/**
 * One area's mail. The heading uses the plain area name. Does not send.
 */
export function buildWeeklyFuelMail(docks: Dock[], area: HomeAreaId, now = Date.now()): WeeklyFuelMail {
  const page = buildAreaPage(docks, area, now);
  const title = weeklyFuelTitle(page.id);
  const subject = weeklyFuelSubject(title);
  const intro = weeklyFuelIntro(title);
  const areaHref = weeklyAreaHref(page.id);
  const { fresh, callAhead } = mailSections(docks, page, now);
  return {
    id: page.id,
    title,
    subject,
    intro,
    text: plainText({ subject, intro, title, areaHref, fresh, callAhead }),
    html: htmlMail({ subject, intro, title, areaHref, fresh, callAhead }),
  };
}

export function buildWeeklyFuelMails(docks: Dock[], now = Date.now()): WeeklyFuelMail[] {
  return HOME_AREAS.map((area) => buildWeeklyFuelMail(docks, area.id, now));
}

/**
 * Emails from the alert signup store whose dock sits in this area.
 * A dock outside the three areas, or an address that is not a signup, stays off the list.
 * Does not send.
 */
export function weeklyFuelRecipients(
  alerts: readonly Pick<DockPriceAlert, "dockId" | "email">[],
  docks: readonly Dock[],
  area: HomeAreaId,
): string[] {
  const inArea = new Set(docks.filter((dock) => homeArea(dock) === area).map((dock) => dock.id));
  const emails = new Set<string>();
  for (const alert of alerts) {
    if (!inArea.has(alert.dockId)) continue;
    const email = alert.email.trim().toLowerCase();
    if (!email) continue;
    emails.add(email);
  }
  return [...emails].sort((left, right) => left.localeCompare(right, "en"));
}

export async function readWeeklyFuelRecipients(area: HomeAreaId): Promise<string[]> {
  const [queue, docks] = await Promise.all([readReviewQueue(), readDocks()]);
  return weeklyFuelRecipients(queue.alerts, docks, area);
}
