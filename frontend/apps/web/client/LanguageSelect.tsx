"use client";
import { useEffect, useState } from "react";
import {
  languageNames,
  locales,
  localizedPath,
  type Locale,
} from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import { navigateLanguage } from "./handoff";
import s from "../../../packages/i18n/LanguageSwitcher.module.css";
export function LanguageSelect({
  locale,
  path,
}: {
  locale: Locale;
  path: string;
}) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const show = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setBusy(false);
        setFailed(false);
      }
    };
    window.addEventListener("pageshow", show);
    return () => window.removeEventListener("pageshow", show);
  }, []);
  return (
    <div className={s.switcher}>
      <select
        className={s.select}
        aria-label={translate(locale, "language")}
        value={locale}
        disabled={busy}
        onChange={async (event) => {
          const next = locales.find((l) => l === event.target.value);
          if (!next || next === locale) return;
          setBusy(true);
          setFailed(false);
          try {
            await navigateLanguage(
              localizedPath(next, path) + location.search + location.hash,
            );
          } catch {
            setFailed(true);
            setBusy(false);
          }
        }}
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={l}>
            {languageNames[l]}
          </option>
        ))}
      </select>
      {failed && (
        <p role="alert">{translate(locale, "languageNavigationFailed")}</p>
      )}
      <noscript>
        <style>{`.${s.select} { display: none; }`}</style>
        {locales.map((l) => (
          <a key={l} href={localizedPath(l, path)} lang={l} hrefLang={l}>
            {languageNames[l]}
          </a>
        ))}
      </noscript>
    </div>
  );
}
