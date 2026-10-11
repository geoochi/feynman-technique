import type { Lab } from "../core/types";
import {
  locales,
  localizedPath,
  resolveRoute,
  type Locale,
} from "../i18n/locales";
import { translate } from "../i18n/I18n";
import type { SiteConfig } from "./site";

export interface PageMetadata {
  locale: Locale;
  title: string;
  description: string;
  indexable: boolean;
  canonical?: string;
  alternates: { language: string; url: string }[];
  structuredData?: Record<string, unknown>;
}

export function pageMetadata(
  pathname: string,
  labs: Lab[],
  config: SiteConfig,
): PageMetadata {
  const { locale, path } = resolveRoute(pathname.split(/[?#]/)[0]);
  const match = path.match(/^\/(labs|learn)\/([a-z0-9-]+)$/);
  const lab = match ? labs.find((item) => item.slug === match[2]) : undefined;
  const valid = path === "/" || !!lab;
  const lesson = match?.[1] === "learn";
  const title = lab
    ? translate(locale, lesson ? "seoLessonTitle" : "seoExperimentTitle", {
        title: lab.title[locale],
      })
    : path === "/"
      ? translate(locale, "siteTitle")
      : `${translate(locale, "pageNotFound")} · Feynman`;
  const description = lab
    ? `${lab.summary[locale]} ${translate(locale, lesson ? "seoLessonDescription" : "seoExperimentDescription")}`
    : translate(
        locale,
        path === "/"
          ? "siteDescription"
          : "notFoundHelp",
      );
  const absolute = (route: string) => new URL(route, config.origin).href;
  const canonical = valid ? absolute(localizedPath(locale, path)) : undefined;
  const alternates = valid
    ? [
        ...locales.map((language) => ({
          language,
          url: absolute(localizedPath(language, path)),
        })),
        { language: "x-default", url: absolute(localizedPath("en", path)) },
      ]
    : [];
  let structuredData: Record<string, unknown> | undefined;
  if (valid) {
    const graph: Record<string, unknown>[] = [];
    if (path === "/") {
      // Only the English root declares the site identity; all locales have collections.
      if (locale === "en")
        graph.push({
          "@type": "WebSite",
          "@id": absolute("/#website"),
          name: "Feynman",
          url: absolute("/"),
          inLanguage: locales,
        });
      graph.push({
        "@type": "CollectionPage",
        "@id": canonical,
        url: canonical,
        name: title,
        description,
        inLanguage: locale,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: labs.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.title[locale],
            url: absolute(localizedPath(locale, `/labs/${item.slug}`)),
          })),
        },
      });
    } else {
      graph.push({
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: title,
        description,
        inLanguage: locale,
        ...(lab
          ? {
              mainEntity: {
                "@type": ["CreativeWork", "LearningResource"],
                "@id": `${canonical}#resource`,
                name: lab.title[locale],
                description: lab.summary[locale],
                url: canonical,
                inLanguage: locale,
                learningResourceType: lesson
                  ? "Explanation"
                  : "Interactive experiment",
                interactivityType: lesson ? "expositive" : "active",
                ...(lesson
                  ? {
                      teaches: lab.learningObjectives[locale],
                      citation: lab.references.map(
                        (reference) => reference.url,
                      ),
                    }
                  : {}),
                isRelatedTo: {
                  "@type": "WebPage",
                  url: absolute(
                    localizedPath(
                      locale,
                      `/${lesson ? "labs" : "learn"}/${lab.slug}`,
                    ),
                  ),
                },
              },
            }
          : {}),
      });
    }
    structuredData = { "@context": "https://schema.org", "@graph": graph };
  }
  return {
    locale,
    title,
    description,
    canonical,
    alternates,
    structuredData,
    indexable: valid && config.indexable,
  };
}
