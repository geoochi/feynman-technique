import Link from "next/link";
import type { Locale } from "../../../packages/i18n/locales";
import { localizedPath } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
import { repositoryUrl } from "../../../repository.config";
import { LanguageSelect } from "../client/LanguageSelect";
import s from "../App.module.css";
export function Brand({ locale }: { locale: Locale }) {
  return (
    <Link
      href={localizedPath(locale, "/")}
      prefetch={false}
      className={s.brand}
      aria-label={translate(locale, "home")}
    >
      <span className={s.mark}>
        F<span>·</span>
      </span>
      <span>
        FEYNMAN<small>THE SCIENCE OF UNDERSTANDING</small>
      </span>
    </Link>
  );
}
export function GitHub() {
  return (
    <a href={repositoryUrl} target="_blank" rel="noreferrer">
      GitHub ↗
    </a>
  );
}
export function Header({ locale, path }: { locale: Locale; path: string }) {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Brand locale={locale} />
        <nav aria-label={translate(locale, "navigation")}>
          <Link
            prefetch={false}
            className={s.navActive}
            href={localizedPath(locale, "/")}
          >
            {translate(locale, "catalog")}
          </Link>
          <GitHub />
        </nav>
        <LanguageSelect locale={locale} path={path} />
      </div>
    </header>
  );
}
export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className={s.footer}>
      <span>
        FEYNMAN <span className={s.muted}>{translate(locale, "footer1")}</span>
      </span>
      <span>{translate(locale, "footer2")}</span>
    </footer>
  );
}
