import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeeklyFuelPreview } from "@/components/weekly-fuel-preview";
import { parseAreaSlug } from "@/lib/area";
import { readDocks } from "@/lib/store";
import { WEEKLY_FUEL_PREVIEW_TITLE, buildWeeklyFuelMail, weeklyFuelPreviewLinks } from "@/lib/weekly-fuel";
import { reviewPasswordConfigured } from "@/lib/review-auth";
import { isReviewAuthed } from "@/app/review/gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: WEEKLY_FUEL_PREVIEW_TITLE,
  robots: { index: false, follow: false },
};

export default async function WeeklyFuelPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!reviewPasswordConfigured()) notFound();
  const { slug } = await params;
  const area = parseAreaSlug(slug);
  if (!area) notFound();
  const authed = await isReviewAuthed();
  if (!authed) {
    const query = await searchParams;
    return <WeeklyFuelPreview authed={false} slug={area} error={query.error} />;
  }
  const docks = await readDocks();
  const mail = buildWeeklyFuelMail(docks, area);
  return <WeeklyFuelPreview authed mail={mail} links={weeklyFuelPreviewLinks(area)} />;
}
