import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/wholesale", "/desk", "/api/"],
    },
    sitemap: "https://www.dockposted.com/sitemap.xml",
  };
}
