import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { catalog } from "../apps/web/generated/catalog";
import { pageRoutes } from "../packages/seo/pages";
import { pageMetadata } from "../packages/seo/metadata";
import { readSiteConfig } from "./site-config";
import { seoFiles } from "./seo-files";
const config = readSiteConfig(process.env, true);
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const decode = (s: string) =>
  s.replace(
    /&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,
    (entity) =>
      ({
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
      })[entity] ??
      String.fromCodePoint(
        entity.startsWith("&#x")
          ? parseInt(entity.slice(3), 16)
          : parseInt(entity.slice(2)),
      ),
  );
for (const route of pageRoutes(catalog)) {
  const file = resolve(
    "out",
    "." + (route.endsWith("/") ? route + "index.html" : route + ".html"),
  );
  const html = await readFile(file, "utf8");
  const meta = pageMetadata(route, catalog, config);
  const head = html.match(/<head>([\s\S]*?)<\/head>/)![1];
  assert(html.includes(`lang="${meta.locale}"`), `lang: ${route}`);
  const titles = [...head.matchAll(/<title[^>]*>(.*?)<\/title>/g)];
  assert(
    titles.length === 1 && decode(titles[0][1]) === meta.title,
    `title: ${route}`,
  );
  if (!meta.canonical) {
    assert(
      !/rel="canonical"|hreflang=|application\/ld\+json/.test(head),
      `error metadata: ${route}`,
    );
    continue;
  }
  assert(head.includes(`href="${meta.canonical}"`), `canonical: ${route}`);
  assert(
    head.includes(
      `content="${meta.indexable ? "index, follow, max-image-preview:large" : "noindex, follow"}"`,
    ),
    `robots: ${route}`,
  );
  const descriptions = [
    ...head.matchAll(/<meta name="description" content="([^"]*)"/g),
  ];
  assert(
    descriptions.length === 1 &&
      decode(descriptions[0][1]) === meta.description,
    `description: ${route}`,
  );
  assert(
    [...head.matchAll(/hreflang=/gi)].length === 4,
    `alternates: ${route}`,
  );
  for (const alternate of meta.alternates)
    assert(
      head.includes(`hrefLang="${alternate.language}"`) ||
        head.includes(`hreflang="${alternate.language}"`),
      `language alternate: ${route}`,
    );
  const json = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
    ),
  ];
  assert(
    json.length === 1 &&
      JSON.stringify(JSON.parse(json[0][1])) ===
        JSON.stringify(meta.structuredData),
    `JSON-LD: ${route}`,
  );
  assert(/<h1[ >]/.test(html), `missing content: ${route}`);
}
const files = seoFiles(catalog, config);
assert(
  (await readFile("out/robots.txt", "utf8")) === files.robots,
  "robots.txt differs",
);
let sitemap: string | undefined;
try {
  sitemap = await readFile("out/sitemap.xml", "utf8");
} catch {}
assert(sitemap === files.sitemap, "sitemap differs");
async function scripts(dir: string): Promise<string[]> {
  const all: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, e.name);
    if (e.isDirectory()) all.push(...(await scripts(path)));
    else if (e.name.endsWith(".js")) all.push(path);
  }
  return all;
}
const browserScripts = await scripts(resolve("out/_next/static"));
const browserCode = await Promise.all(
  browserScripts.map((p) => readFile(p, "utf8")),
);
for (const [i, source] of browserCode.entries())
  if (Buffer.byteLength(source) > 800000)
    console.warn(
      `Large browser chunk: ${browserScripts[i]} (${Buffer.byteLength(source)} bytes; 800000-byte review threshold).`,
    );
const code = browserCode.join("\n");
assert(
  !code.includes("lessonHtml"),
  "Build-only lesson collection leaked into browser JavaScript",
);
for (const lab of catalog)
  for (const locale of ["en", "zh-CN", "ja"] as const) {
    const excerpt = lab.content[locale].chapters[4].html.slice(0, 150);
    assert(
      !code.includes(excerpt),
      `Lesson text in browser JS: ${lab.slug}/${locale}`,
    );
  }
assert(
  !code.includes("__SITE_CONFIG__"),
  "Legacy environment injection remains",
);
assert(
  (await readFile("out/LICENSE.txt", "utf8")) ===
    (await readFile("../LICENSE", "utf8")),
  "License differs",
);
console.log(
  `Export checks passed: ${pageRoutes(catalog).length} pages, SEO, content boundary, robots/sitemap and license.`,
);
