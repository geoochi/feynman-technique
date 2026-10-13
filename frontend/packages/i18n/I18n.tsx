"use client";
import { createContext, useContext, type ReactNode } from "react";
import { localizedPath, type Locale } from "./locales";
import { type MessageKey } from "./messages";
import { translate } from "./translate";
export { translate } from "./translate";
const Context = createContext<{ locale: Locale }>({ locale: "en" });
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <Context.Provider value={{ locale }}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  return {
    ...context,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(context.locale, key, values),
    href: (path: string) => localizedPath(context.locale, path),
  };
}
