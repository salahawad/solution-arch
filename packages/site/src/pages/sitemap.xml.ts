import type { APIRoute } from "astro";
import concepts from "../concepts.json";

// Dependency-free sitemap: the index plus every concept detail page, built from the manifest.
export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? "https://solution-arch.vercel.app/").replace(/\/$/, "");
  const urls = [`${base}/`, ...concepts.map((c) => `${base}/concepts/${c.slug}/`)];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
