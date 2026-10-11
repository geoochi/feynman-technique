import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  Component,
  type ReactNode,
} from "react";
import type { Lab } from "../../packages/core/types";
import { catalog } from "./generated/catalog";
import s from "./App.module.css";
import { I18nProvider, useI18n } from "../../packages/i18n/I18n";
import { resolveRoute } from "../../packages/i18n/locales";
import { LanguageSwitcher } from "../../packages/i18n/LanguageSwitcher";
import { pageMetadata } from "../../packages/seo/metadata";
import { applyMetadata } from "../../packages/seo/head";
import { siteConfig } from "../../packages/seo/site";
import { GitHubLink } from "../../packages/ui/GitHubLink";
import {
  experimentIssueUrl,
  pullRequestsUrl,
  contributingUrl,
} from "../../repository.config";
const LabPage = lazy(() => import("./LabPage"));
class LoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export const labs = catalog;
export function Brand() {
  const { t, href } = useI18n();
  return (
    <a href={href("/")} className={s.brand} aria-label={t("home")}>
      <span className={s.mark}>
        F<span>·</span>
      </span>
      <span>
        FEYNMAN<small>THE SCIENCE OF UNDERSTANDING</small>
      </span>
    </a>
  );
}
function Header() {
  const { t, href } = useI18n();
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Brand />
        <nav aria-label={t("navigation")}>
          <a className={s.navActive} href={href("/")}>
            {t("catalog")}
          </a>
          <GitHubLink />
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
function Footer() {
  const { t } = useI18n();
  return (
    <footer className={s.footer}>
      <span>
        FEYNMAN <span className={s.muted}>{t("footer1")}</span>
      </span>
      <span>{t("footer2")}</span>
    </footer>
  );
}
export function Catalog() {
  const { t, href, locale } = useI18n();
  const subjects: Record<string, string> = {
    math: t("math"),
    physics: t("physics"),
    geography: t("geography"),
  };
  const [subject, setSubject] = useState("all"),
    [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const filtered = labs.filter(
    (l) =>
      (subject === "all" || l.subjects.includes(subject)) &&
      l.content[locale].searchText.includes(
        query.trim().toLocaleLowerCase(locale),
      ),
  );
  return (
    <>
      <Header />
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
        <section id="catalog" className={s.catalog} aria-label={t("catalog")}>
          <div className={s.sectionTitle}>
            <h2>
              <span className={s.index}>01 /</span> {t("explore")}
            </h2>
            <span className={s.counter}>
              {t("count", { count: labs.length.toString().padStart(2, "0") })}{" "}
              <span className={s.statusDot} />
            </span>
          </div>
          <div className={s.filterBar}>
            <div className={s.filters} role="group" aria-label={t("filters")}>
              {[["all", t("all")], ...Object.entries(subjects)].map(
                ([id, name]) => (
                  <button
                    key={id}
                    aria-pressed={subject === id}
                    className={subject === id ? s.selected : ""}
                    onClick={() => setSubject(id)}
                  >
                    {name}
                    <span>
                      {id === "all"
                        ? labs.length
                        : labs.filter((l) => l.subjects.includes(id)).length}
                    </span>
                  </button>
                ),
              )}
            </div>
            <label className={s.search}>
              <span aria-hidden="true">⌕</span>
              <input
                ref={search}
                type="search"
                aria-label={t("search")}
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>/</kbd>
            </label>
          </div>
          <p className={s.srOnly} role="status">
            {t("found", { count: filtered.length })}
          </p>
          <div className={s.cardGrid}>
            {filtered.map((lab, i) => (
              <a
                href={href(`/labs/${lab.slug}`)}
                className={s.card}
                key={lab.id}
                style={
                  {
                    "--subject-accent":
                      lab.theme === "astronomy"
                        ? "#a47a30"
                        : lab.subjects[0] === "math"
                          ? "#c9800f"
                          : "#0092c7",
                  } as React.CSSProperties
                }
              >
                <div className={s.cardPreview}>
                  <img
                    src={lab.previewUrl}
                    alt={t("preview", { title: lab.title[locale] })}
                    width="600"
                    height="260"
                  />
                  <span className={s.subject}>{subjects[lab.subjects[0]]}</span>
                  <span className={s.cardNumber}>
                    EXP / {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardTitle}>
                    <h3>{lab.title[locale]}</h3>
                    <span>↗</span>
                  </div>
                  <p>{lab.summary[locale]}</p>
                  <div className={s.tags}>
                    {lab.tags[locale].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className={s.cardMeta}>
                    <span>{t("minutes", { count: lab.estimatedMinutes })}</span>
                    <strong>{t("enter")} →</strong>
                  </div>
                  <div className={s.cardVersion}>
                    <span>v{lab.version}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className={s.empty}>
              <h3>{t("emptyTitle")}</h3>
              <p>{t("emptyHelp")}</p>
              <button
                onClick={() => {
                  setQuery("");
                  setSubject("all");
                }}
              >
                {t("clear")}
              </button>
            </div>
          )}
        </section>
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
      <Footer />
    </>
  );
}
function StaticLab({ lab, failed = false }: { lab: Lab; failed?: boolean }) {
  const { t, href, locale } = useI18n();
  return (
    <>
      <Header />
      <main className={s.article}>
        <p className={s.eyebrow}>
          EXPERIMENT / {lab.subjects[0].toUpperCase()}
        </p>
        <h1>{lab.title[locale]}</h1>
        <p>{lab.summary[locale]}</p>
        <img
          className={s.articlePreview}
          src={lab.previewUrl}
          alt={t("staticPreview")}
          width="600"
          height="260"
        />
        <p role="status">{failed ? t("shellFailed") : t("preparing")}</p>
        {failed && (
          <button onClick={() => window.location.reload()}>{t("retry")}</button>
        )}
        <noscript>{t("noScript")}</noscript>
        <section className={s.prose}>
          <h2>{lab.content[locale].chapters[0].title}</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: lab.content[locale].chapters[0].html,
            }}
          />
        </section>
        <a href={href(`/learn/${lab.slug}`)}>{t("readGuide")} →</a>
      </main>
    </>
  );
}
function Learn({ lab }: { lab: Lab }) {
  const { t, href, locale } = useI18n();
  return (
    <>
      <Header />
      <main id="main" className={s.article}>
        <a className={s.backLink} href={href(`/labs/${lab.slug}`)}>
          ← {t("backLab")}
        </a>
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
        <p className={s.note}>
          {t("reviewNote")}
        </p>
      </main>
      <Footer />
    </>
  );
}
function Page({ path }: { path: string }) {
  const { t, href } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const clean = path.replace(/\/$/, "") || "/";
  const match = clean.match(/^\/(labs|learn)\/([a-z0-9-]+)$/);
  const lab = match && labs.find((l) => l.slug === match[2]);
  if (clean === "/") return <Catalog />;
  if (lab && match)
    return match[1] === "learn" ? (
      <Learn lab={lab} />
    ) : mounted ? (
      <LoadBoundary fallback={<StaticLab lab={lab} failed />}>
        <Suspense fallback={<StaticLab lab={lab} />}>
          <LabPage lab={lab} />
        </Suspense>
      </LoadBoundary>
    ) : (
      <StaticLab lab={lab} />
    );
  return (
    <>
      <Header />
      <main className={s.article}>
        <p className={s.eyebrow}>404 / OUTSIDE THE LAB</p>
        <h1>{t("notFound")}</h1>
        <p>{t("notFoundHelp")}</p>
        <a href={href("/")}>{t("backCatalog")} →</a>
      </main>
    </>
  );
}
export function App({ path }: { path: string }) {
  const [currentPath, setCurrentPath] = useState(path);
  const route = resolveRoute(currentPath);
  useEffect(() => {
    const pop = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    applyMetadata(pageMetadata(currentPath, labs, siteConfig));
  }, [route.locale, route.path]);
  const navigate = (next: string) => {
    if (
      window.location.pathname +
        window.location.search +
        window.location.hash ===
      next
    )
      return;
    window.history.pushState(null, "", next);
    setCurrentPath(window.location.pathname);
  };
  return (
    <I18nProvider {...route} navigate={navigate}>
      <Page path={route.path} />
    </I18nProvider>
  );
}
