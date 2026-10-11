import { locales, languageNames, localizedPath } from "./locales";
import { useI18n } from "./I18n";
import s from "./LanguageSwitcher.module.css";
export function LanguageSwitcher() {
  const { locale, path, navigate, t } = useI18n();
  return (
    <div className={s.switcher}>
      <select
        className={s.select}
        aria-label={t("language")}
        value={locale}
        onChange={(event) => {
          const next = locales.find((value) => value === event.target.value);
          if (next)
            navigate(
              localizedPath(next, path) +
                window.location.search +
                window.location.hash,
            );
        }}
      >
        {locales.map((next) => (
          <option key={next} value={next} lang={next}>
            {languageNames[next]}
          </option>
        ))}
      </select>
      <noscript>
        <style>{`.${s.select} { display: none; }`}</style>
        {locales.map((next) => (
          <a
            key={next}
            href={localizedPath(next, path)}
            lang={next}
            hrefLang={next}
            aria-current={next === locale ? "true" : undefined}
          >
            {languageNames[next]}
          </a>
        ))}
      </noscript>
    </div>
  );
}
