import type { Locale } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import { catalog } from "./content";
import { Header, Footer } from "../components/Chrome";
import { Cards } from "../client/Cards";
import { StructuredData } from "./metadata";
import { localizedPath } from "../../../packages/i18n/locales";
import {
  experimentIssueUrl,
  pullRequestsUrl,
  contributingUrl,
} from "../../../repository.config";
import s from "../App.module.css";
export function Home({ locale }: { locale: Locale }) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const cards = catalog.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title[locale],
    summary: l.summary[locale],
    tags: l.tags[locale],
    subjects: l.subjects,
    theme: l.theme,
    previewUrl: l.previewUrl,
    version: l.version,
    estimatedMinutes: l.estimatedMinutes,
    searchText: l.content[locale].searchText,
  }));
  return (
    <>
      <StructuredData path={localizedPath(locale, "/")} />
      <Header locale={locale} path="/" />
      <main id="main" className={s.container}>
        <section className={s.hero}>
          <div>
            <p className={s.eyebrow}>
              <span className={s.statusDot} /> INTERACTIVE LEARNING LAB
            </p>
            <h1>
              {t("heroStart")}
              {locale === "en" ? " " : ""}
              <span>{t("heroEnd")}</span>
            </h1>
            <p className={s.intro}>
              {t("intro1")}
              <br />
              {t("intro2")}
              <br />
              {t("intro3")}
            </p>
            <a className={s.heroLink} href="#catalog">
              {t("start")} <span>↓</span>
            </a>
          </div>
          <div className={s.heroArt} aria-hidden="true">
            <svg viewBox="0 0 480 260">
              <defs>
                <pattern
                  id="heroGrid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M24 0H0V24"
                    fill="none"
                    stroke="currentColor"
                    opacity=".12"
                  />
                </pattern>
              </defs>
              <rect x="50" width="390" height="240" fill="url(#heroGrid)" />
              <path
                d="M85 175H430M240 215V25"
                stroke="currentColor"
                opacity=".25"
              />
              <ellipse
                cx="250"
                cy="125"
                rx="145"
                ry="65"
                transform="rotate(-25 250 125)"
                fill="none"
                stroke="#0092c7"
              />
              <ellipse
                cx="250"
                cy="125"
                rx="110"
                ry="95"
                transform="rotate(30 250 125)"
                fill="none"
                stroke="#c9800f"
              />
              <circle
                cx="250"
                cy="125"
                r="38"
                fill="#ffffff"
                stroke="#6b8596"
              />
              <path d="M222 125h56m-28-28v56" stroke="#0092c7" />
              <circle cx="372" cy="61" r="7" fill="#0092c7" />
              <circle cx="154" cy="164" r="5" fill="#c9800f" />
              <text
                x="58"
                y="244"
                fontSize="10"
                fontFamily="monospace"
                fill="currentColor"
              >
                OBSERVE → QUESTION → UNDERSTAND
              </text>
            </svg>
          </div>
        </section>
        <Cards labs={cards} locale={locale} />
        <section className={s.contribute} aria-labelledby="contribute-title">
          <div>
            <h2 id="contribute-title">{t("contributeTitle")}</h2>
            <p>{t("contributeDescription")}</p>
          </div>
          <div className={s.contributeLinks}>
            <a href={experimentIssueUrl} target="_blank" rel="noreferrer">
              {t("proposeExperiment")} ↗
            </a>
            <a href={pullRequestsUrl} target="_blank" rel="noreferrer">
              {t("contributePR")} ↗
            </a>
            <a href={contributingUrl} target="_blank" rel="noreferrer">
              {t("contributionGuide")} ↗
            </a>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
