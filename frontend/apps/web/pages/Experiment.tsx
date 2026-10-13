import { imagePreloads } from "../generated/preloads";
import Link from "next/link";
import type { Locale } from "../../../packages/i18n/locales";
import { localizedPath } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import { labBySlug } from "./content";
import { Brand, GitHub } from "../components/Chrome";
import { LanguageSelect } from "../client/LanguageSelect";
import { StructuredData } from "./metadata";
import { ExperimentSession } from "../client/ExperimentSession";
import "katex/dist/katex.min.css";
import l from "../LabPage.module.css";
export function Experiment({ locale, slug }: { locale: Locale; slug: string }) {
  const lab = labBySlug(slug);
  const path = `/labs/${slug}`;
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const introduction = (
    <aside className={l.left} aria-label={t("introduction")}>
      <p className={l.micro}>EXPLORE / {lab.subjects[0].toUpperCase()}</p>
      <h1>{lab.title[locale]}</h1>
      <p className={l.summary}>{lab.summary[locale]}</p>
      <section className={l.problem} aria-label={t("questionRegion")}>
        <h2>{t("questions")}</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: lab.content[locale].chapters[0].html,
          }}
        />
      </section>
      <Link
        prefetch={false}
        className={l.readMore}
        href={localizedPath(locale, `/learn/${slug}`)}
      >
        {t("fullNotes")} ↗
      </Link>
    </aside>
  );
  return (
    <>
      <StructuredData path={localizedPath(locale, path)} />
      {imagePreloads[slug].map((src) => (
        <link
          key={src}
          rel="preload"
          as="image"
          href={src}
          crossOrigin="anonymous"
          fetchPriority="low"
        />
      ))}

      <ExperimentSession
        key={lab.id}
        locale={locale}
        lab={{
          id: lab.id,
          version: lab.version,
          slug,
          theme: lab.theme,
          previewUrl: lab.previewUrl,
          parameters: lab.parameters,
          stateSchema: lab.stateSchema,
          chapterCount: lab.content[locale].chapters.length,
          playback: lab.playback !== false,
        }}
        formulas={Object.fromEntries(
          Object.entries(lab.formulas).map(([key, copy]) => [
            key,
            copy[locale],
          ]),
        )}
        introduction={introduction}
        tools={<GitHub />}
        header={
          <>
            <Brand locale={locale} />
            <Link
              prefetch={false}
              className={l.back}
              href={localizedPath(locale, "/")}
            >
              ← {t("catalog")}
            </Link>
            <span className={l.headerTitle}>{lab.title[locale]}</span>
            <LanguageSelect locale={locale} path={path} />
          </>
        }
      />
      <div hidden suppressHydrationWarning data-bootstrap-fallback role="alert">
        <p>{t("shellFailed")}</p>
        <a href={localizedPath(locale, path)}>{t("retry")}</a> ·{" "}
        <a href={localizedPath(locale, `/learn/${slug}`)}>{t("readNotes")}</a>
      </div>
    </>
  );
}
