"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { markPinDeadInAirtable } from "@/lib/airtable-desk";
import {
  DESK_COOKIE,
  deskCookieOptions,
  deskPasswordConfigured,
  deskPasswordMatches,
  deskSessionToken,
  deskSessionValid,
} from "@/lib/desk-auth";
import { markPinDead } from "@/lib/store";

export async function submitDeskPassword(formData: FormData): Promise<void> {
  if (!deskPasswordConfigured()) notFound();
  const candidate = String(formData.get("password") ?? "");
  if (!deskPasswordMatches(candidate)) {
    redirect("/desk?error=Wrong%20password.");
  }
  const jar = await cookies();
  jar.set(DESK_COOKIE, deskSessionToken(), deskCookieOptions());
  redirect("/desk");
}

export async function requireDesk(): Promise<boolean> {
  if (!deskPasswordConfigured()) return false;
  const jar = await cookies();
  return deskSessionValid(jar.get(DESK_COOKIE)?.value);
}

export async function dropFiledPin(formData: FormData): Promise<void> {
  if (!(await requireDesk())) notFound();
  const id = String(formData.get("pinId") ?? "").trim();
  if (!id) redirect("/desk");
  const pin = await markPinDead(id);
  if (pin?.airtableId) await markPinDeadInAirtable(pin.airtableId);
  redirect("/desk");
}
