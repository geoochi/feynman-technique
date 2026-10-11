import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer, loadEnv } from "vite";
import type { Lab } from "../packages/core/types";
import { pageRoutes } from "../packages/seo/pages";
import { pageMetadata } from "../packages/seo/metadata";
import { renderHead } from "../packages/seo/head";
import { readSiteConfig } from "./site-config";
import { seoFiles } from "./seo-files";
const root = process.cwd(),
  dist = resolve(root, "dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
if (
  !template.includes("<!--seo-start-->") ||
  !template.includes("<!--seo-end-->")
)
  throw new Error("The page template is missing the SEO head markers.");
const labs = JSON.parse(
  await readFile(resolve(root, "apps/web/generated/catalog.json"), "utf8"),
) as Lab[];
const config = readSiteConfig(
  { ...loadEnv("production", root, ""), ...process.env },
  true,
);
const server = await createServer({
  mode: "production",
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { render } = (await server.ssrLoadModule(
    "/apps/web/entry-server.tsx",
  )) as { render: (path: string) => string };
  const routes = pageRoutes(labs);
  for (const route of routes) {
    const page = pageMetadata(route, labs, config);
    const html = template
      .replace(/<html lang="[^"]*"/, `<html lang="${page.locale}"`)
      .replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, () => renderHead(page))
      .replace("<!--app-->", () => render(route));
    const file = route.endsWith("/")
      ? route.slice(1) + "index.html"
      : route.slice(1) + ".html";
    const path = resolve(dist, file);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, html);
  }
  const files = seoFiles(labs, config);
  await writeFile(resolve(dist, "robots.txt"), files.robots);
  if (files.sitemap)
    await writeFile(resolve(dist, "sitemap.xml"), files.sitemap);
  else await rm(resolve(dist, "sitemap.xml"), { force: true });
  console.log(
    `Prerendered ${routes.length} static pages. SEO origin: ${config.origin}; indexing: ${config.indexable ? "enabled" : "disabled"}.`,
  );
} finally {
  await server.close();
}
