import type { MetadataRoute } from "next";
import { areaCanonicalUrl } from "@/lib/area";
import { HOME_AREAS } from "@/lib/posted";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

const SITE = "https://www.dockposted.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docks = await readDocks();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/board`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/report`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/safe-fuel`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/haul-out`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE}/pin`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/run`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/how`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  const areaRoutes: MetadataRoute.Sitemap = HOME_AREAS.map((area) => ({
    url: areaCanonicalUrl(area.id),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const dockRoutes: MetadataRoute.Sitemap = docks.map((dock) => ({
    url: `${SITE}/docks/${dock.id}`,
    lastModified: dock.lastVerifiedAt ? new Date(dock.lastVerifiedAt) : now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));
  return [...staticRoutes, ...areaRoutes, ...dockRoutes];
}
