"use server";

import { randomUUID } from "node:crypto";
import type { Route } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  WHOLESALE_COOKIE,
  wholesaleCookieOptions,
  wholesalePasswordConfigured,
  wholesalePasswordMatches,
  wholesaleSessionToken,
  wholesaleWriteAllowed,
} from "@/lib/wholesale-auth";
import {
  WHOLESALE_DRAFT_COOKIE,
  parseWholesaleDraft,
  serializeWholesaleDraft,
  wholesaleDraftCookieOptions,
} from "@/lib/wholesale-draft";
import { addWholesaleDiff, readDocks, readWholesaleStore, removeWholesaleDiff, saveTerminalWorksheet } from "@/lib/store";
import {
  applyDiffRow,
  emptyWorksheet,
  findTerminal,
  parseAreaId,
  parseOptionalCents,
  parseUnit,
  rememberClearedTax,
  stripUnchangedDefaults,
  worksheetFromFields,
  type TerminalWorksheet,
  type WholesaleProduct,
} from "@/lib/wholesale";

function requireGate(): void {
  if (!wholesalePasswordConfigured()) notFound();
}

async function requireSession(): Promise<void> {
  requireGate();
  const jar = await cookies();
  if (!wholesaleWriteAllowed(jar.get(WHOLESALE_COOKIE)?.value)) {
    redirect("/wholesale?error=Session%20required.");
  }
}

function fail(path: string, message: string): never {
  const href = `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`;
  redirect(href as Route);
}

function deskPath(area: string, terminal: string, extra = ""): string {
  const suffix = extra ? `&${extra}` : "";
  return `/wholesale?area=${area}&terminal=${encodeURIComponent(terminal)}${suffix}`;
}

function fieldsFromForm(formData: FormData): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    fields[key] = String(value);
  }
  return fields;
}

async function previousSheetForTerminal(terminalId: string): Promise<TerminalWorksheet | null> {
  const jar = await cookies();
  const draft = parseWholesaleDraft(jar.get(WHOLESALE_DRAFT_COOKIE)?.value);
  if (draft && draft.terminalId === terminalId) return draft.sheet;
  const store = await readWholesaleStore();
  return store.worksheets[terminalId] ?? null;
}

async function sheetFromComputeForm(
  formData: FormData,
  terminalId: string,
  unit: ReturnType<typeof parseUnit>,
): Promise<TerminalWorksheet> {
  const submitted = worksheetFromFields(fieldsFromForm(formData), unit);
  return rememberClearedTax(submitted, await previousSheetForTerminal(terminalId));
}

async function persistDraft(terminalId: string, sheet: TerminalWorksheet): Promise<void> {
  const jar = await cookies();
  jar.set(
    WHOLESALE_DRAFT_COOKIE,
    serializeWholesaleDraft({ terminalId, sheet }),
    wholesaleDraftCookieOptions(),
  );
}

async function clearDraft(): Promise<void> {
  const jar = await cookies();
  jar.set(WHOLESALE_DRAFT_COOKIE, "", { ...wholesaleDraftCookieOptions(), maxAge: 0 });
}

export async function loginWholesale(formData: FormData): Promise<void> {
  requireGate();
  const password = String(formData.get("password") ?? "");
  if (!wholesalePasswordMatches(password)) {
    redirect("/wholesale?error=Wrong%20password.");
  }
  const jar = await cookies();
  jar.set(WHOLESALE_COOKIE, wholesaleSessionToken(), wholesaleCookieOptions());
  redirect("/wholesale");
}

export async function logoutWholesale(): Promise<void> {
  requireGate();
  const jar = await cookies();
  jar.set(WHOLESALE_COOKIE, "", { ...wholesaleCookieOptions(), maxAge: 0 });
  jar.set(WHOLESALE_DRAFT_COOKIE, "", { ...wholesaleDraftCookieOptions(), maxAge: 0 });
  redirect("/wholesale");
}

export async function computeWholesaleWorksheet(formData: FormData): Promise<void> {
  await requireSession();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminal = String(formData.get("terminal") ?? "").trim();
  const unit = parseUnit(String(formData.get("unit") ?? ""));
  if (!terminal) fail(`/wholesale?area=${area}`, "Pick a terminal.");
  try {
    const sheet = await sheetFromComputeForm(formData, terminal, unit);
    const row = findTerminal(terminal);
    const docks = await readDocks();
    const persisted = row
      ? stripUnchangedDefaults(sheet, row.state, { areaId: area, docks })
      : sheet;
    await saveTerminalWorksheet(terminal, persisted);
    await persistDraft(terminal, sheet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not compute.";
    fail(deskPath(area, terminal), message);
  }
  redirect(`${deskPath(area, terminal)}&unit=${unit}` as Route);
}

export async function saveWholesaleWorksheet(formData: FormData): Promise<void> {
  await requireSession();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminal = String(formData.get("terminal") ?? "").trim();
  const unit = parseUnit(String(formData.get("unit") ?? ""));
  if (!terminal) fail(`/wholesale?area=${area}`, "Pick a terminal.");

  try {
    const sheet = await sheetFromComputeForm(formData, terminal, unit);
    const row = findTerminal(terminal);
    const docks = await readDocks();
    const persisted = row
      ? stripUnchangedDefaults(sheet, row.state, { areaId: area, docks })
      : sheet;
    await saveTerminalWorksheet(terminal, persisted);
    await persistDraft(terminal, sheet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    fail(deskPath(area, terminal), message);
  }
  redirect(`${deskPath(area, terminal)}&saved=1` as Route);
}

export async function addTerminalDiff(formData: FormData): Promise<void> {
  await requireSession();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminalId = String(formData.get("terminal") ?? "").trim();
  const name = String(formData.get("diffName") ?? "").trim();
  const product = String(formData.get("diffProduct") ?? "") as WholesaleProduct;
  const unit = parseUnit(String(formData.get("unit") ?? ""));
  if (!terminalId) fail(`/wholesale?area=${area}`, "Pick a terminal.");
  if (!name) fail(deskPath(area, terminalId), "Name the differential.");
  if (product !== "RB" && product !== "HO") {
    fail(deskPath(area, terminalId), "Pick RB or HO.");
  }
  let cents;
  try {
    cents = parseOptionalCents(String(formData.get("diffCents") ?? ""), unit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check the differential.";
    fail(deskPath(area, terminalId), message);
  }
  await addWholesaleDiff({
    id: randomUUID(),
    terminalId,
    name,
    product,
    centsVsScreen: cents,
  });
  redirect(deskPath(area, terminalId) as Route);
}

export async function applyTerminalDiff(formData: FormData): Promise<void> {
  await requireSession();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminalId = String(formData.get("terminal") ?? "").trim();
  const id = String(formData.get("diffId") ?? "").trim();
  if (!terminalId) fail(`/wholesale?area=${area}`, "Pick a terminal.");
  if (!id) fail(deskPath(area, terminalId), "Pick a differential to apply.");

  const store = await readWholesaleStore();
  const row = store.differentials.find((item) => item.id === id && item.terminalId === terminalId);
  if (!row) fail(deskPath(area, terminalId), "That differential is not on this terminal.");
  if (row.centsVsScreen == null) {
    fail(deskPath(area, terminalId), "That named row has no ¢ — nothing to write into Δ.");
  }

  const saved = store.worksheets[terminalId] ?? emptyWorksheet();
  const next = applyDiffRow(saved, row);
  const terminal = findTerminal(terminalId);
  const docks = await readDocks();
  const persisted = terminal
    ? stripUnchangedDefaults(next, terminal.state, { areaId: area, docks })
    : next;
  await saveTerminalWorksheet(terminalId, persisted);

  const jar = await cookies();
  const draft = parseWholesaleDraft(jar.get(WHOLESALE_DRAFT_COOKIE)?.value);
  if (draft && draft.terminalId === terminalId) {
    await persistDraft(terminalId, applyDiffRow(draft.sheet, row));
  } else {
    await persistDraft(terminalId, next);
  }

  redirect(deskPath(area, terminalId) as Route);
}

export async function removeTerminalDiff(formData: FormData): Promise<void> {
  await requireSession();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminalId = String(formData.get("terminal") ?? "").trim();
  const id = String(formData.get("diffId") ?? "").trim();
  if (id) await removeWholesaleDiff(id);
  redirect(deskPath(area, terminalId) as Route);
}

