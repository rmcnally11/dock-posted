import { emptyWorksheet, type TerminalWorksheet } from "./wholesale";
import { wholesaleCookieOptions } from "./wholesale-auth";

export const WHOLESALE_DRAFT_COOKIE = "wholesale_draft";

export interface WholesaleDraft {
  terminalId: string;
  sheet: TerminalWorksheet;
}

function isCents(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isProductInputs(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    isCents(row.nymexScreen) &&
    isCents(row.terminalDiff) &&
    isCents(row.inboundFreight) &&
    isCents(row.postedRack) &&
    isCents(row.jobberSell) &&
    isCents(row.dockPosted)
  );
}

function isTaxInputs(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return isCents(row.federal) && isCents(row.state) && isCents(row.other) && isCents(row.oneLine);
}

function isTaxSlice(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return isCents(row.federal) && isCents(row.state);
}

export function parseWholesaleDraft(raw: string | undefined): WholesaleDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WholesaleDraft>;
    if (typeof parsed.terminalId !== "string" || !parsed.terminalId) return null;
    const sheet = parsed.sheet;
    if (!sheet || typeof sheet !== "object") return null;
    if (!isProductInputs(sheet.rb) || !isProductInputs(sheet.ho) || !isTaxInputs(sheet.tax)) {
      return null;
    }
    if (!isTaxSlice(sheet.taxRb) || !isTaxSlice(sheet.taxHo)) return null;
    const blank = emptyWorksheet();
    return {
      terminalId: parsed.terminalId,
      sheet: {
        rb: { ...blank.rb, ...sheet.rb },
        ho: { ...blank.ho, ...sheet.ho },
        tax: { ...blank.tax, ...sheet.tax },
        taxRb: { federal: sheet.taxRb?.federal ?? null, state: sheet.taxRb?.state ?? null },
        taxHo: { federal: sheet.taxHo?.federal ?? null, state: sheet.taxHo?.state ?? null },
      },
    };
  } catch {
    return null;
  }
}

export function serializeWholesaleDraft(draft: WholesaleDraft): string {
  return JSON.stringify({ terminalId: draft.terminalId, sheet: draft.sheet });
}

export function wholesaleDraftCookieOptions() {
  return {
    ...wholesaleCookieOptions(),
    maxAge: 60 * 60,
  };
}
