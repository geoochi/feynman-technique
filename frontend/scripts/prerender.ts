import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import type { Lab } from "../packages/core/types";
import { locales, localizedPath, resolveRoute } from "../packages/i18n/locales";
import { translate } from "../packages/i18n/I18n";
const root = process.cwd(),
  dist = resolve(root, "dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const labs = JSON.parse(
  await readFile(resolve(root, "apps/web/generated/catalog.json"), "utf8"),
) as Lab[];
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
function escape(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
try {
  const { render } = (await server.ssrLoadModule(
    "/apps/web/entry-server.tsx",
  )) as { render: (path: string) => string };
  const pages = locales.flatMap((locale) =>
    [
      {
        route: localizedPath(locale, "/"),
        title: translate(locale, "siteTitle"),
        description: translate(locale, "siteDescription"),
      },
      {
        route: localizedPath(locale, "/contribute"),
        title: `${translate(locale, "contribute")} · Feynman`,
        description: translate(locale, "contributeDescription"),
      },
      {
        route: localizedPath(locale, "/404"),
        title: `${translate(locale, "pageNotFound")} · Feynman`,
        description: translate(locale, "notFoundHelp"),
      },
      ...labs.flatMap((l) =>
        ["labs", "learn"].map((section) => ({
          route: localizedPath(locale, `/${section}/${l.slug}`),
          title: `${l.title[locale]} · Feynman`,
          description: l.summary[locale],
        })),
      ),
    ].map((page) => ({
      ...page,
      locale,
      file: page.route.endsWith("/")
        ? page.route.slice(1) + "index.html"
        : page.route.slice(1) + ".html",
    })),
  );
  for (const page of pages) {
    const html = template
      .replace(/<html lang="[^"]*"/, `<html lang="${page.locale}"`)
      .replace(
        "</head>",
        `${locales.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${localizedPath(locale, resolveRoute(page.route).path)}"/>`).join("")}<link rel="alternate" hreflang="x-default" href="${localizedPath("en", resolveRoute(page.route).path)}"/></head>`,
      )
      .replace("<!--app-->", render(page.route))
      .replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${escape(page.description)}"/>`,
      );
    const path = resolve(dist, page.file);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, html);
  }
  console.log(
    `Prerendered ${pages.length} static pages. No runtime server required.`,
  );
} finally {
  await server.close();
}
