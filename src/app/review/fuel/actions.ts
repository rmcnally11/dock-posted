"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { parseAreaSlug } from "@/lib/area";
import {
  REVIEW_COOKIE,
  reviewCookieOptions,
  reviewPasswordConfigured,
  reviewPasswordMatches,
  reviewSessionToken,
} from "@/lib/review-auth";

export async function loginWeeklyFuelPreview(formData: FormData): Promise<void> {
  if (!reviewPasswordConfigured()) notFound();
  const area = parseAreaSlug(String(formData.get("slug") ?? ""));
  if (!area) notFound();
  const back = `/review/fuel/${area}` as Route;
  const password = String(formData.get("password") ?? "");
  if (!reviewPasswordMatches(password)) {
    redirect(`${back}?error=Wrong%20password.` as Route);
  }
  const jar = await cookies();
  jar.set(REVIEW_COOKIE, reviewSessionToken(), reviewCookieOptions());
  redirect(back);
}
