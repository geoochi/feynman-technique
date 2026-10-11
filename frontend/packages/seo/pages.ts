import type { Lab } from "../core/types";
import { locales, localizedPath } from "../i18n/locales";

export function pageRoutes(labs: Pick<Lab, "slug">[]) {
  return locales.flatMap((locale) =>
    [
      "/",
      "/contribute",
      "/404",
      ...labs.flatMap((lab) => [`/labs/${lab.slug}`, `/learn/${lab.slug}`]),
    ].map((path) => localizedPath(locale, path)),
  );
}
