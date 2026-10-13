import { mkdir, rename, rm, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { MissingBody } from "../apps/web/components/MissingBody";
import { catalog } from "../apps/web/generated/catalog";
import { locales, localizedPath } from "../packages/i18n/locales";
import { translate } from "../packages/i18n/translate";
import { seoFiles } from "./seo-files";
import { readSiteConfig } from "./site-config";
const out = resolve("out");
// Only localized home HTML is relocated. Keep Next RSC/segment payload paths intact.
for (const lang of ["zh", "ja"]) {
  await mkdir(resolve(out, lang), { recursive: true });
  await rename(resolve(out, `${lang}.html`), resolve(out, lang, "index.html"));
}
const en404 = await readFile(resolve(out, "404.html"), "utf8");
const css = [...en404.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)]
  .map((m) => m[0])
  .join("");
for (const locale of locales) {
  const body = renderToStaticMarkup(createElement(MissingBody, { locale }));
  const prefix = locale === "en" ? "" : locale === "ja" ? "ja/" : "zh/";
  await writeFile(
    resolve(out, prefix + "404.html"),
    `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${translate(locale, "pageNotFound")} · Feynman</title><meta name="robots" content="noindex, follow">${css}</head><body>${body}</body></html>`,
  );
}
const files = seoFiles(catalog, readSiteConfig(process.env, true));
await writeFile(resolve(out, "robots.txt"), files.robots);
if (files.sitemap) await writeFile(resolve(out, "sitemap.xml"), files.sitemap);
else await rm(resolve(out, "sitemap.xml"), { force: true });
const headers = await readFile("public/_headers", "utf8");
await writeFile(resolve(out, "_headers"), headers);
// Every registered route must still be exported; do not turn missing assets into app routes.
for (const locale of locales)
  for (const path of [
    "/",
    ...catalog.flatMap((l) => [`/labs/${l.slug}`, `/learn/${l.slug}`]),
  ]) {
    const route = localizedPath(locale, path);
    const file = route.endsWith("/") ? route + "index.html" : route + ".html";
    const html = await readFile(resolve(out, "." + file), "utf8");
    if (!html.includes(`lang="${locale}"`))
      throw new Error(`Invalid exported page ${route}`);
  }
console.log(
  `Checked 21 content routes + 3 localized 404 files; indexing: ${files.sitemap ? "enabled" : "disabled"}.`,
);
