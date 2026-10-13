"use client";
import Link from "next/link";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Locale } from "../../../packages/i18n/locales";
import { localizedPath } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import type { CatalogCard } from "./card-types";
import s from "../App.module.css";
export function Cards({
  labs,
  locale,
}: {
  labs: CatalogCard[];
  locale: Locale;
}) {
  const t = (
    key: Parameters<typeof translate>[1],
    values?: Record<string, string | number>,
  ) => translate(locale, key, values);
  const href = (path: string) => localizedPath(locale, path);
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
      l.searchText.includes(query.trim().toLocaleLowerCase(locale)),
  );
  return (
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
          <Link
            prefetch={false}
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
              } as CSSProperties
            }
          >
            <div className={s.cardPreview}>
              <img
                src={lab.previewUrl}
                alt={t("preview", { title: lab.title })}
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
                <h3>{lab.title}</h3>
                <span>↗</span>
              </div>
              <p>{lab.summary}</p>
              <div className={s.tags}>
                {lab.tags.map((t) => (
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
          </Link>
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
  );
}
