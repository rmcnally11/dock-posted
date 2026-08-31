"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  DESK_COOKIE,
  deskCookieOptions,
  deskPasswordConfigured,
  deskPasswordMatches,
  deskSessionToken,
  deskSessionValid,
} from "@/lib/desk-auth";

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
