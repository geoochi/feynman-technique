import type { PageMetadata } from "./metadata";

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function renderHead(page: PageMetadata) {
  const meta = (key: string, value: string, property = false) =>
    `<meta data-seo ${property ? "property" : "name"}="${key}" content="${escapeHtml(value)}"/>`;
  const link = (rel: string, url: string, language?: string) =>
    `<link data-seo rel="${rel}" href="${escapeHtml(url)}"${language ? ` hreflang="${language}"` : ""}/>`;
  return [
    `<title data-seo>${escapeHtml(page.title)}</title>`,
    meta("description", page.description),
    meta(
      "robots",
      page.indexable
        ? "index, follow, max-image-preview:large"
        : "noindex, follow",
    ),
    ...(page.canonical ? [link("canonical", page.canonical)] : []),
    ...page.alternates.map(({ language, url }) =>
      link("alternate", url, language),
    ),
    meta("og:title", page.title, true),
    meta("og:description", page.description, true),
    meta("og:type", "website", true),
    meta("og:site_name", "Feynman", true),
    meta(
      "og:locale",
      { en: "en_US", "zh-CN": "zh_CN", ja: "ja_JP" }[page.locale],
      true,
    ),
    ...page.alternates
      .filter(
        ({ language }) => language !== "x-default" && language !== page.locale,
      )
      .map(({ language }) =>
        meta(
          "og:locale:alternate",
          { en: "en_US", "zh-CN": "zh_CN", ja: "ja_JP" }[
            language as PageMetadata["locale"]
          ],
          true,
        ),
      ),
    ...(page.canonical ? [meta("og:url", page.canonical, true)] : []),
    ...(page.canonical
      ? [
          meta(
            "og:image",
            new URL("/social-card.png", page.canonical).href,
            true,
          ),
          meta("og:image:width", "1200", true),
          meta("og:image:height", "630", true),
          meta("og:image:alt", "Feynman", true),
          meta(
            "twitter:image",
            new URL("/social-card.png", page.canonical).href,
          ),
          meta("twitter:image:alt", "Feynman"),
        ]
      : []),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", page.title),
    meta("twitter:description", page.description),
    ...(page.structuredData
      ? [
          `<script data-seo type="application/ld+json">${JSON.stringify(page.structuredData).replace(/</g, "\\u003c")}</script>`,
        ]
      : []),
  ].join("\n");
}
export function applyMetadata(page: PageMetadata) {
  document.documentElement.lang = page.locale;
  const template = document.createElement("template");
  template.innerHTML = renderHead(page);
  document.head.querySelectorAll("[data-seo]").forEach((node) => node.remove());
  document.head.append(template.content);
}
