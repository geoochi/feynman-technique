import type { Lab } from "../packages/core/types";
import type { SiteConfig } from "../packages/seo/site";
import { pageRoutes } from "../packages/seo/pages";
import { pageMetadata } from "../packages/seo/metadata";
import { escapeHtml } from "../packages/seo/head";

export function seoFiles(labs: Lab[], config: SiteConfig) {
  const urls = config.indexable
    ? pageRoutes(labs)
        .map((route) => pageMetadata(route, labs, config))
        .filter((page) => page.indexable)
        .map((page) => page.canonical!)
    : [];
  return {
    // Allow crawling so crawlers can see the noindex tags in previews and error pages.
    robots: `User-agent: *\nAllow: /\n${urls.length ? `\nSitemap: ${config.origin}/sitemap.xml\n` : ""}`,
    sitemap: urls.length
      ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`
      : undefined,
  };
}
