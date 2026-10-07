import {
  AREA_EMPTY_PRICES,
  AREA_PRICES_HEADING,
  areaTitle,
  buildAreaPage,
  type AreaDock,
} from "@/lib/area";
import { DOCK_ORIGIN } from "@/lib/dock-page";
import { HOME_AREAS, areaPath, homeArea, type HomeAreaId } from "@/lib/posted";
import { readDocks, readReviewQueue } from "@/lib/store";
import type { Dock, DockPriceAlert } from "@/lib/types";

/** Envelope line. The place name is the area page title. */
export const WEEKLY_FUEL_SUBJECT_LEAD = "Cheapest posted fuel";

export function weeklyFuelSubject(title: string): string {
  return `${WEEKLY_FUEL_SUBJECT_LEAD}, ${title}`;
}

/** The area intro, without the call-ahead sentence. This mail lists posted prices only. */
export function weeklyFuelIntro(title: string): string {
  return `Fuel docks in ${title}, cheapest posted price first. Call before you go.`;
}

export const WEEKLY_FUEL_UNSUBSCRIBE_LABEL = "Unsubscribe";

/** Replaced later by a real unsubscribe URL. Nothing is sent from this build. */
export const WEEKLY_FUEL_UNSUBSCRIBE_HREF = "{{unsubscribe_url}}";

export const WEEKLY_FUEL_TAGLINE = "What they wrote on the pump. If they didn’t, ask the dock.";

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
    title: areaTitle(area.id),
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
    ? `<span data-testid="weekly-stale-${id}" style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${STALE};">Stale</span>`
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
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-family:${SERIF};font-size:20px;line-height:1.25;color:${NAVY};">
              <a href="${escapeHtml(weeklyDockHref(dock.id))}" style="color:${NAVY};text-decoration:underline;">${escapeHtml(dock.name)}</a><span style="font-family:${SANS};font-size:14px;color:${INK};"> · ${escapeHtml(dock.city)}, ${escapeHtml(dock.state)}</span>
            </td>
            <td align="right" valign="top" style="padding-left:8px;white-space:nowrap;">${stale}</td>
          </tr>
        </table>
        ${note}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">${lines}</table>
        ${asOf}
        ${sourceLine(dock)}
      </td>
    </tr>
  </table>`;
}

function plainText(input: {
  subject: string;
  intro: string;
  title: string;
  areaHref: string;
  priced: AreaDock[];
}): string {
  const lines: string[] = [input.subject, "", input.intro, ""];
  if (input.priced.length === 0) {
    lines.push(AREA_EMPTY_PRICES, "");
  }
  for (const dock of input.priced) {
    lines.push(dock.name);
    lines.push(`${dock.city}, ${dock.state}`);
    lines.push(weeklyDockHref(dock.id));
    if (dock.stale) lines.push("Stale");
    if (dock.note) lines.push(dock.note);
    for (const line of dock.lines) lines.push(`${line.label} ${line.figure}`);
    if (dock.asOf) lines.push(`As of ${dock.asOf}`);
    if (dock.source) lines.push(dock.source);
    lines.push("");
  }
  lines.push(input.title, input.areaHref, "", WEEKLY_FUEL_UNSUBSCRIBE_LABEL, WEEKLY_FUEL_UNSUBSCRIBE_HREF, "", "Dock Posted", WEEKLY_FUEL_TAGLINE);
  return lines.join("\n");
}

function htmlMail(input: {
  subject: string;
  intro: string;
  title: string;
  areaHref: string;
  priced: AreaDock[];
}): string {
  const title = escapeHtml(input.title);
  const areaHref = escapeHtml(input.areaHref);
  const body =
    input.priced.length === 0
      ? `<p data-testid="weekly-empty" style="margin:20px 0 0;font-family:${SANS};font-size:16px;line-height:1.5;color:${INK};">${escapeHtml(AREA_EMPTY_PRICES)}</p>`
      : input.priced.map(dockBlock).join("");
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
                <p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${NAVY};">Dock Posted · ${escapeHtml(WEEKLY_FUEL_TAGLINE)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * One area's cheapest posted prices, in the same order as that area page.
 * Marina and city posts only. Does not send.
 */
export function buildWeeklyFuelMail(docks: Dock[], area: HomeAreaId, now = Date.now()): WeeklyFuelMail {
  const page = buildAreaPage(docks, area, now);
  const subject = weeklyFuelSubject(page.title);
  const intro = weeklyFuelIntro(page.title);
  const areaHref = weeklyAreaHref(page.id);
  const priced = page.priced;
  return {
    id: page.id,
    title: page.title,
    subject,
    intro,
    text: plainText({ subject, intro, title: page.title, areaHref, priced }),
    html: htmlMail({ subject, intro, title: page.title, areaHref, priced }),
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
