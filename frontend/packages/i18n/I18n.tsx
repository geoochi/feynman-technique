import { createContext, useContext, type ReactNode } from "react";
import { locales, localizedPath, type Locale } from "./locales";
import { messages, type MessageKey } from "./messages";
export function translate(
  locale: Locale,
  key: MessageKey,
  values: Record<string, string | number> = {},
) {
  return messages[key][locales.indexOf(locale)].replace(
    /\{(\w+)\}/g,
    (_, name: string) => String(values[name] ?? `{${name}}`),
  );
}
const Context = createContext<{
  locale: Locale;
  path: string;
  navigate: (path: string) => void;
}>({ locale: "en", path: "/", navigate: () => {} });
export function I18nProvider({
  locale,
  path,
  navigate,
  children,
}: {
  locale: Locale;
  path: string;
  navigate: (path: string) => void;
  children: ReactNode;
}) {
  return (
    <Context.Provider value={{ locale, path, navigate }}>
      {children}
    </Context.Provider>
  );
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
