import type { MetadataRoute } from "next";
import { NAV, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return NAV.map((item) => ({
    url: new URL(item.href, SITE.url).toString(),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
  }));
}
