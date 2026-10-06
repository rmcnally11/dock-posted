"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  REVIEW_COOKIE,
  reviewCookieOptions,
  reviewPasswordConfigured,
  reviewPasswordMatches,
  reviewSessionToken,
  reviewSessionValid,
} from "@/lib/review-auth";
import { approveQueuedReport, rejectQueuedReport } from "@/lib/store";

function requireGate(): void {
  if (!reviewPasswordConfigured()) notFound();
}

async function requireSession(): Promise<void> {
  requireGate();
  const jar = await cookies();
  if (!reviewSessionValid(jar.get(REVIEW_COOKIE)?.value)) {
    redirect("/review?error=Session%20required." as Route);
  }
}

export async function loginReview(formData: FormData): Promise<void> {
  requireGate();
  const password = String(formData.get("password") ?? "");
  if (!reviewPasswordMatches(password)) {
    redirect("/review?error=Wrong%20password." as Route);
  }
  const jar = await cookies();
  jar.set(REVIEW_COOKIE, reviewSessionToken(), reviewCookieOptions());
  redirect("/review" as Route);
}

export async function logoutReview(): Promise<void> {
  requireGate();
  const jar = await cookies();
  jar.set(REVIEW_COOKIE, "", { ...reviewCookieOptions(), maxAge: 0 });
  redirect("/review" as Route);
}

export async function approveReview(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/review?error=Missing%20report." as Route);
  const result = await approveQueuedReport(id);
  if (!result) redirect("/review?error=That%20report%20is%20gone." as Route);
  redirect("/review?done=approved" as Route);
}

export async function rejectReview(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/review?error=Missing%20report." as Route);
  const result = await rejectQueuedReport(id);
  if (!result) redirect("/review?error=That%20report%20is%20already%20on%20the%20board." as Route);
  redirect("/review?done=rejected" as Route);
}
