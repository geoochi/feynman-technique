export const locales = ["en", "zh-CN", "ja"] as const;
export type Locale = (typeof locales)[number];
export type Localized<T> = Record<Locale, T>;
export const defaultLocale: Locale = "en";
export const languageNames: Localized<string> = {
  en: "English",
  "zh-CN": "中文",
  ja: "日本語",
};
const prefixes: Localized<string> = { en: "", "zh-CN": "/zh", ja: "/ja" };
export function localizedPath(locale: Locale, path: string) {
  return prefixes[locale] + (path === "/" ? "/" : path);
}
export function resolveRoute(pathname: string): {
  locale: Locale;
  path: string;
} {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const locale of locales) {
    const prefix = prefixes[locale];
    if (prefix && (clean === prefix || clean.startsWith(prefix + "/")))
      return { locale, path: clean.slice(prefix.length) || "/" };
  }
  return { locale: defaultLocale, path: clean };
}
export const chapterIds = [
  "problem",
  "prediction",
  "operate",
  "observe",
  "explain",
  "verify",
  "extend",
] as const;
export const chapterTitles: Localized<readonly string[]> = {
  en: [
    "Questions",
    "Predict",
    "Try",
    "Observe",
    "Explain",
    "Check",
    "Explore further",
  ],
  "zh-CN": ["问题", "预测", "操作", "观察", "解释", "验证", "延伸"],
  ja: ["問い", "予想", "操作", "観察", "解説", "確かめ", "発展"],
};
