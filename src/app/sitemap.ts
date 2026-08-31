import type { MetadataRoute } from "next";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docks = await readDocks();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://dock-posted.vercel.app/", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: "https://dock-posted.vercel.app/about", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: "https://dock-posted.vercel.app/report", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://dock-posted.vercel.app/safe-fuel", lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://dock-posted.vercel.app/haul-out", lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: "https://dock-posted.vercel.app/pin", lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: "https://dock-posted.vercel.app/run", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
  const dockRoutes: MetadataRoute.Sitemap = docks.map((dock) => ({
    url: `https://dock-posted.vercel.app/docks/${dock.id}`,
    lastModified: dock.lastVerifiedAt ? new Date(dock.lastVerifiedAt) : now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));
  return [...staticRoutes, ...dockRoutes];
}
