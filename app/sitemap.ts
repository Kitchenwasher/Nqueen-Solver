import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

const staticRoutes = ["/", "/benchmark", "/challenges", "/insights", "/about", "/privacy", "/terms", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().toString().replace(/\/$/, "");
  const lastModified = new Date();

  return staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7
  }));
}
