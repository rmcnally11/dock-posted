import type { Dock, Ethanol, FuelQuote, PayKind, Product } from "./types";
import { ETHANOLS, PRODUCTS } from "./types";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** The sentence next to the checkbox. Stored as written. No mail is sent. */
export const PRICE_ALERT_CONSENT =
  "Yes. Keep my email and tell me when this dock's price changes.";

export type PhotoKind = "jpeg" | "png" | "heic";

export interface ReportGrade {
  product: Product;
  ethanol: Ethanol;
  key: string;
  label: string;
}

export interface ReportFormFields {
  websiteUrl: string;
  dockId: string;
  grade: string;
  price: string;
  seenAt: string;
  note: string;
  who: string;
  hours: string;
  pay: string;
  closed: boolean;
  dieselOnly: boolean;
}

export interface AcceptedReport {
  dockId: string;
  product: Product;
  ethanol: Ethanol;
  pricePerGallon: number;
  seenAt: string;
  note: string | null;
  marinaOwned: boolean;
  hours: string | null;
  pay: PayKind | null;
  closed: boolean;
  dieselOnly: boolean;
}

export type ReportPlan =
  | { kind: "drop" }
  | { kind: "reject"; error: string }
  | { kind: "accept"; value: AcceptedReport };

export interface AlertFormFields {
  websiteUrl: string;
  dockId: string;
  email: string;
  consent: boolean;
}

export interface AcceptedAlert {
  dockId: string;
  email: string;
  consent: string;
}

export type AlertPlan =
  | { kind: "drop" }
  | { kind: "reject"; error: string }
  | { kind: "accept"; value: AcceptedAlert };

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"]);

/** Calendar day in America/Chicago, YYYY-MM-DD. */
export function chicagoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function calendarDay(raw: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : null;
}

export function isFutureChicagoDate(seenAt: string, now = new Date()): boolean {
  const day = calendarDay(seenAt);
  if (!day) return true;
  return day > chicagoToday(now);
}

export function honeypotFilled(value: string | null | undefined): boolean {
  return String(value ?? "").trim().length > 0;
}

/**
 * The hose this dock already stores. E0 stays E0.
 * Do not rename an ethanol-free hose.
 */
export function gradeLabel(quote: Pick<FuelQuote, "product" | "ethanol">): string {
  if (quote.product === "diesel") return "Diesel";
  const octane = quote.product === "gasoline" ? null : quote.product;
  if (quote.ethanol === "E15") {
    const base = octane ? `${octane} E15` : "E15";
    return `${base} — not for boats`;
  }
  if (quote.ethanol === "E0" || quote.ethanol === "E10") {
    return octane ? `${octane} ${quote.ethanol}` : quote.ethanol;
  }
  return octane ?? "Gas";
}

export function gradeKey(product: Product, ethanol: Ethanol): string {
  return `${product}:${ethanol}`;
}

export function reportGrades(dock: { quotes: FuelQuote[] }): ReportGrade[] {
  const seen = new Set<string>();
  const grades: ReportGrade[] = [];
  for (const quote of dock.quotes) {
    if (quote.status === "not-sold") continue;
    if (!PRODUCTS.includes(quote.product)) continue;
    const key = gradeKey(quote.product, quote.ethanol);
    if (seen.has(key)) continue;
    seen.add(key);
    grades.push({
      product: quote.product,
      ethanol: quote.ethanol,
      key,
      label: gradeLabel(quote),
    });
  }
  return grades;
}

function parseGrade(raw: string): { product: Product; ethanol: Ethanol } | null {
  const [productRaw, ethanolRaw] = raw.split(":");
  if (!productRaw || !PRODUCTS.includes(productRaw as Product)) return null;
  if (!ethanolRaw || !ETHANOLS.includes(ethanolRaw as Ethanol)) return null;
  return { product: productRaw as Product, ethanol: ethanolRaw as Ethanol };
}

export function planReportIntake(fields: ReportFormFields, dock: Dock | null, now = new Date()): ReportPlan {
  if (honeypotFilled(fields.websiteUrl)) return { kind: "drop" };

  const dockId = fields.dockId.trim();
  if (!dockId) return { kind: "reject", error: "Pick the dock." };
  if (!dock || dock.id !== dockId) return { kind: "reject", error: "We don't have that dock." };

  const parsed = parseGrade(fields.grade.trim());
  const grades = reportGrades(dock);
  const match = parsed ? grades.find((grade) => grade.product === parsed.product && grade.ethanol === parsed.ethanol) : null;
  if (!parsed || !match) return { kind: "reject", error: "Pick the hose on this dock." };

  const priceRaw = fields.price.trim();
  const pricePerGallon = Number(priceRaw);
  if (!priceRaw || !Number.isFinite(pricePerGallon) || pricePerGallon <= 0 || pricePerGallon > 20) {
    return { kind: "reject", error: "The number on the pump, per gallon." };
  }

  const seenAt = calendarDay(fields.seenAt);
  if (!seenAt) return { kind: "reject", error: "When did you see it?" };
  if (isFutureChicagoDate(seenAt, now)) return { kind: "reject", error: "That day hasn't happened yet." };

  const note = fields.note.trim();
  if (note.length > 400) return { kind: "reject", error: "Keep the note short." };

  const payRaw = fields.pay.trim();
  const pay: PayKind | null = payRaw === "cash" || payRaw === "card" || payRaw === "both" ? payRaw : null;
  const marinaOwned = fields.who === "marina";

  return {
    kind: "accept",
    value: {
      dockId,
      product: match.product,
      ethanol: match.ethanol,
      pricePerGallon,
      seenAt,
      note: note || null,
      marinaOwned,
      hours: fields.hours.trim() || null,
      pay: marinaOwned ? pay : null,
      closed: marinaOwned && fields.closed,
      dieselOnly: fields.dieselOnly,
    },
  };
}

export function planAlertIntake(fields: AlertFormFields, dock: Dock | null): AlertPlan {
  if (honeypotFilled(fields.websiteUrl)) return { kind: "drop" };
  const dockId = fields.dockId.trim();
  if (!dockId || !dock || dock.id !== dockId) return { kind: "reject", error: "Pick the dock." };
  const email = fields.email.trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { kind: "reject", error: "That email doesn't look right." };
  }
  if (!fields.consent) return { kind: "reject", error: "Check the box so we can keep your email." };
  return {
    kind: "accept",
    value: { dockId, email, consent: PRICE_ALERT_CONSENT },
  };
}

export function detectPhotoKind(bytes: Uint8Array): PhotoKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 12 && String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === "ftyp") {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (HEIC_BRANDS.has(brand)) return "heic";
  }
  return null;
}

export function inspectPhoto(bytes: Uint8Array): { ok: true; kind: PhotoKind } | { ok: false; error: string } {
  if (bytes.byteLength > MAX_PHOTO_BYTES) {
    return { ok: false, error: "That photo is too big. Try a smaller one." };
  }
  const kind = detectPhotoKind(bytes);
  if (!kind) return { ok: false, error: "Use a jpg, png, or heic." };
  return { ok: true, kind };
}

export function photoContentType(kind: PhotoKind): string {
  if (kind === "png") return "image/png";
  if (kind === "heic") return "image/heic";
  return "image/jpeg";
}

export function photoExtension(kind: PhotoKind): string {
  if (kind === "png") return "png";
  if (kind === "heic") return "heic";
  return "jpg";
}
