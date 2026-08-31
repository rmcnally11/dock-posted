import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/wholesale", "/desk", "/api/"],
    },
    sitemap: "https://dock-posted.vercel.app/sitemap.xml",
  };
}
