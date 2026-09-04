import { PIN_PRICE_LABEL, WATCH_PRICE_LABEL, waterLabel, type PinClaim, type WaterWatch } from "./income";
import { sendMail } from "./notify";
import { publicSiteUrl } from "./sister";

const NAVY = "#0b1f33";
const DIESEL = "#2f8fd6";
const SIGNAL = "#e23b3b";
const CREAM = "#fbf8f3";

export const PIN_THANK_YOU_SUBJECT = "This dock is yours";
export const WATCH_THANK_YOU_SUBJECT = "We’ll watch that water";

export function thankYouRecipient(recordEmail: string, sessionEmail?: string | null): string | null {
  const record = recordEmail.trim();
  if (record) return record;
  const session = sessionEmail?.trim() || "";
  return session || null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteBase(siteUrl?: string): string {
  return (siteUrl ?? publicSiteUrl()).replace(/\/$/, "");
}

function markSrc(siteUrl: string): string {
  return `${siteUrl}/brand/stripe-icon.png`;
}

function actionRow(actions: Array<{ href: string; label: string }>): string {
  const cells = actions
    .map((action) => {
      const href = escapeHtml(action.href);
      const label = escapeHtml(action.label);
      return `<a href="${href}" style="display:inline-block;padding:12px 18px;background-color:${DIESEL};color:${CREAM};font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.2;text-decoration:none;border-radius:4px;">${label}</a>`;
    })
    .join(
      `<span style="display:inline-block;width:12px;height:12px;line-height:12px;">&nbsp;</span>`,
    );
  return `<p style="margin:24px 0 0;">${cells}</p>`;
}

function brandedHtml(input: {
  title: string;
  preheader: string;
  kicker: string;
  heading: string;
  paragraphs: string[];
  actions: Array<{ href: string; label: string }>;
  siteUrl: string;
}): string {
  const title = escapeHtml(input.title);
  const preheader = escapeHtml(input.preheader);
  const kicker = escapeHtml(input.kicker);
  const heading = escapeHtml(input.heading);
  const paragraphs = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:${CREAM};">${p}</p>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${NAVY};">
    <div lang="en" dir="ltr" style="background-color:${NAVY};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${NAVY};">
        <tr>
          <td align="center" style="padding:28px 16px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
              <tr>
                <td style="padding:0 8px;">
                  <img src="${escapeHtml(markSrc(input.siteUrl))}" width="48" height="48" alt="" style="display:block;border:0;width:48px;height:48px;" />
                  <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${SIGNAL};">${kicker}</p>
                  <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:600;color:${CREAM};">${heading}</h1>
                  <p style="margin:18px 0 0;font-size:0;line-height:0;">
                    <span style="display:block;height:2px;background-color:${SIGNAL};"></span>
                    <span style="display:block;height:6px;"></span>
                    <span style="display:block;height:2px;background-color:${DIESEL};"></span>
                  </p>
                  ${paragraphs}
                  ${actionRow(input.actions)}
                  <p style="margin:28px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5;color:${CREAM};">
                    Dock Posted · What they wrote on the pump. If they didn’t, ask the dock.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}

export function pinThankYouMail(
  pin: Pick<PinClaim, "dockId" | "dockName">,
  siteUrl?: string,
): { subject: string; text: string; html: string } {
  const site = siteBase(siteUrl);
  const dockHref = `${site}/docks/${encodeURIComponent(pin.dockId)}`;
  const reportHref = `${site}/report?dock=${encodeURIComponent(pin.dockId)}&who=marina`;
  const dockName = pin.dockName;
  const subject = PIN_THANK_YOU_SUBJECT;
  const text = [
    subject,
    "",
    `${dockName}. ${PIN_PRICE_LABEL}.`,
    "You write the number. Truck day, or when you change the board. We don’t invent a price. We don’t sell a gallon.",
    "",
    `Put a number on the hose: ${reportHref}`,
    `See the card: ${dockHref}`,
    "",
    "Dock Posted",
    "What they wrote on the pump. If they didn’t, ask the dock.",
  ].join("\n");
  const html = brandedHtml({
    title: subject,
    preheader: `${dockName}. ${PIN_PRICE_LABEL}. You write the number.`,
    kicker: "Your dock",
    heading: subject,
    paragraphs: [
      `<strong>${escapeHtml(dockName)}</strong>. ${escapeHtml(PIN_PRICE_LABEL)}.`,
      "You write the number. Truck day, or when you change the board. We don’t invent a price. We don’t sell a gallon.",
    ],
    actions: [
      { href: reportHref, label: "Put a number on the hose" },
      { href: dockHref, label: `See ${dockName}` },
    ],
    siteUrl: site,
  });
  return { subject, text, html };
}

export function watchThankYouMail(
  watch: Pick<WaterWatch, "corridor" | "region">,
  siteUrl?: string,
): { subject: string; text: string; html: string } {
  const site = siteBase(siteUrl);
  const runHref = `${site}/run`;
  const water = waterLabel(watch.corridor, watch.region);
  const subject = WATCH_THANK_YOU_SUBJECT;
  const text = [
    subject,
    "",
    `${water}. ${WATCH_PRICE_LABEL}.`,
    "When a dock on that water puts a number up, we write you. Not a text. A blank stays blank.",
    "",
    `See this trip: ${runHref}`,
    "",
    "Dock Posted",
    "What they wrote on the pump. If they didn’t, ask the dock.",
  ].join("\n");
  const html = brandedHtml({
    title: subject,
    preheader: `${water}. ${WATCH_PRICE_LABEL}. We’ll write you when a dock puts a number up.`,
    kicker: "This trip",
    heading: subject,
    paragraphs: [
      `<strong>${escapeHtml(water)}</strong>. ${escapeHtml(WATCH_PRICE_LABEL)}.`,
      "When a dock on that water puts a number up, we write you. Not a text. A blank stays blank.",
    ],
    actions: [{ href: runHref, label: "See this trip" }],
    siteUrl: site,
  });
  return { subject, text, html };
}

export async function sendPinPaidThankYou(
  pin: PinClaim,
  sessionEmail?: string | null,
): Promise<boolean> {
  const to = thankYouRecipient(pin.email, sessionEmail);
  if (!to) return false;
  const mail = pinThankYouMail(pin);
  return sendMail({
    to,
    ...mail,
    idempotencyKey: `pin-thank-you/${pin.id}`,
  });
}

export async function sendWatchPaidThankYou(
  watch: WaterWatch,
  sessionEmail?: string | null,
): Promise<boolean> {
  const to = thankYouRecipient(watch.email, sessionEmail);
  if (!to) return false;
  const mail = watchThankYouMail(watch);
  return sendMail({
    to,
    ...mail,
    idempotencyKey: `watch-thank-you/${watch.id}`,
  });
}
