import Link from "next/link";
import type { Locale } from "../../../packages/i18n/locales";
import { localizedPath } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import { labBySlug } from "./content";
import { Header, Brand, GitHub, Footer } from "../components/Chrome";
import { LanguageSelect } from "../client/LanguageSelect";
import { StructuredData } from "./metadata";
import s from "../App.module.css";
export function Lesson({ locale, slug }: { locale: Locale; slug: string }) {
  const lab = labBySlug(slug);
  const path = `/learn/${slug}`;
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <>
      <StructuredData path={localizedPath(locale, path)} />
      <Header locale={locale} path={path} />
      <main id="main" className={s.article}>
        <Link
          prefetch={false}
          className={s.backLink}
          href={localizedPath(locale, `/labs/${slug}`)}
        >
          ← {t("backLab")}
        </Link>
        <p className={s.eyebrow}>FIELD NOTES / v{lab.version}</p>
        <div
          className={s.prose}
          dangerouslySetInnerHTML={{ __html: lab.content[locale].lessonHtml }}
        />
        <h2>{t("objectives")}</h2>
        <ul>
          {lab.learningObjectives[locale].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h2>{t("references")}</h2>
        <ul>
          {lab.references.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className={s.note}>{t("reviewNote")}</p>
      </main>
      <Footer locale={locale} />
    </>
  );
}
