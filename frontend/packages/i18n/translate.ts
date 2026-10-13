import { locales, type Locale } from "./locales";
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
