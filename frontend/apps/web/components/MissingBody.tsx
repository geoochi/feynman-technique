import React from "react";
import type { Locale } from "../../../packages/i18n/locales";
import { localizedPath } from "../../../packages/i18n/locales";
import { translate } from "../../../packages/i18n/translate";
// Pure shared error content also used by the export finalizer; no client or CSS imports.
export function MissingBody({ locale }: { locale: Locale }) {
  return (
    <main style={{ maxWidth: 820, margin: "auto", padding: 40 }}>
      <p>404 / OUTSIDE THE LAB</p>
      <h1>{translate(locale, "notFound")}</h1>
      <p>{translate(locale, "notFoundHelp")}</p>
      <a href={localizedPath(locale, "/")}>
        {translate(locale, "backCatalog")} →
      </a>
    </main>
  );
}
