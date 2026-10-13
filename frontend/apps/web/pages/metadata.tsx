import { safeJsonLd } from "../../../packages/seo/escape";
import type { Metadata } from "next";
import { pageMetadata } from "../../../packages/seo/metadata";
import { readSiteConfig } from "../../../scripts/site-config";
import { catalog } from "./content";
// Static metadata and structured data use the same validated build configuration.
export function metadataFor(path: string): Metadata {
  const config = readSiteConfig(
    process.env,
    process.env.NODE_ENV === "production",
  );
  const page = pageMetadata(path, catalog, config);
  return {
    title: page.title,
    description: page.description,
    icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
    robots: {
      index: page.indexable,
      follow: true,
      ...(page.indexable ? { "max-image-preview": "large" as const } : {}),
    },
    alternates: page.canonical
      ? {
          canonical: page.canonical,
          languages: Object.fromEntries(
            page.alternates.map((a) => [a.language, a.url]),
          ),
        }
      : undefined,
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.canonical,
      siteName: "Feynman",
      type: "website",
      alternateLocale: ["en", "zh-CN", "ja"]
        .filter((locale) => locale !== page.locale)
        .map(
          (locale) => ({ en: "en_US", "zh-CN": "zh_CN", ja: "ja_JP" })[locale]!,
        ),
      locale: { en: "en_US", "zh-CN": "zh_CN", ja: "ja_JP" }[page.locale],
      images: [
        {
          url: `${config.origin}/social-card.png`,
          width: 1200,
          height: 630,
          alt: "Feynman",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [`${config.origin}/social-card.png`],
    },
  };
}
export function StructuredData({ path }: { path: string }) {
  const page = pageMetadata(
    path,
    catalog,
    readSiteConfig(process.env, process.env.NODE_ENV === "production"),
  );
  return page.structuredData ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(page.structuredData),
      }}
    />
  ) : null;
}
