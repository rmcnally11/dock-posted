import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaBoard } from "@/components/area-board";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { AREA_INTRO, areaCanonicalUrl, areaPageJsonLd, areaTitle, buildAreaPage, parseAreaSlug } from "@/lib/area";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = parseAreaSlug(slug);
  if (!area) return { title: "Area" };
  const title = areaTitle(area);
  const url = areaCanonicalUrl(area);
  return {
    title,
    description: AREA_INTRO,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: AREA_INTRO,
      url,
      type: "website",
      siteName: "Dock Posted",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: AREA_INTRO,
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = parseAreaSlug(slug);
  if (!area) notFound();

  const docks = await readDocks();
  const page = buildAreaPage(docks, area);
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <AreaBoard page={page} />
      <Waterline className="mt-8" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(areaPageJsonLd(page)) }}
      />
      <SiteFooter />
    </main>
  );
}
