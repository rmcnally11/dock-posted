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
} from "@/lib/wholesale-auth";
import { addWholesaleDiff, readDocks, removeWholesaleDiff, saveTerminalWorksheet } from "@/lib/store";
import {
  findTerminal,
  parseAreaId,
  parseOptionalCents,
  parseUnit,
  stripUnchangedDefaults,
  worksheetFromFields,
  type WholesaleProduct,
} from "@/lib/wholesale";

function requireGate(): void {
  if (!wholesalePasswordConfigured()) notFound();
}

function fail(path: string, message: string): never {
  const href = `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`;
  redirect(href as Route);
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
  redirect("/wholesale");
}

export async function saveWholesaleWorksheet(formData: FormData): Promise<void> {
  requireGate();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminal = String(formData.get("terminal") ?? "").trim();
  const unit = parseUnit(String(formData.get("unit") ?? ""));
  if (!terminal) fail(`/wholesale?area=${area}`, "Pick a terminal.");

  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    fields[key] = String(value);
  }
  try {
    const sheet = worksheetFromFields(fields, unit);
    const row = findTerminal(terminal);
    const docks = await readDocks();
    const persisted = row
      ? stripUnchangedDefaults(sheet, row.state, { areaId: area, docks })
      : sheet;
    await saveTerminalWorksheet(terminal, persisted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    fail(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminal)}`, message);
  }
  redirect(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminal)}&saved=1`);
}

export async function addTerminalDiff(formData: FormData): Promise<void> {
  requireGate();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminalId = String(formData.get("terminal") ?? "").trim();
  const name = String(formData.get("diffName") ?? "").trim();
  const product = String(formData.get("diffProduct") ?? "") as WholesaleProduct;
  const unit = parseUnit(String(formData.get("unit") ?? ""));
  if (!terminalId) fail(`/wholesale?area=${area}`, "Pick a terminal.");
  if (!name) fail(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminalId)}`, "Name the differential.");
  if (product !== "RB" && product !== "HO") {
    fail(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminalId)}`, "Pick RB or HO.");
  }
  let cents;
  try {
    cents = parseOptionalCents(String(formData.get("diffCents") ?? ""), unit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check the differential.";
    fail(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminalId)}`, message);
  }
  await addWholesaleDiff({
    id: randomUUID(),
    terminalId,
    name,
    product,
    centsVsScreen: cents,
  });
  redirect(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminalId)}`);
}

export async function removeTerminalDiff(formData: FormData): Promise<void> {
  requireGate();
  const area = parseAreaId(String(formData.get("area") ?? ""));
  const terminalId = String(formData.get("terminal") ?? "").trim();
  const id = String(formData.get("diffId") ?? "").trim();
  if (id) await removeWholesaleDiff(id);
  redirect(`/wholesale?area=${area}&terminal=${encodeURIComponent(terminalId)}`);
}
