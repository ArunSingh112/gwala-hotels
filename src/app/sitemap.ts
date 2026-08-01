import type { MetadataRoute } from "next";
import { getHotels } from "@/lib/data/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const hotels = await getHotels();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/hotels`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/booking`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/attractions`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/booking/lookup`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const hotelPages: MetadataRoute.Sitemap = hotels.map((h) => ({
    url: `${base}/hotels/${h.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...hotelPages];
}
