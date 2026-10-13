import "server-only";
// Build-only content. Client components receive projections, never this collection.
import { catalog } from "../generated/catalog";
import type { Locale } from "../../../packages/i18n/locales";
import { notFound } from "next/navigation";
export { catalog };
export function labBySlug(slug: string) {
  const lab = catalog.find((lab) => lab.slug === slug);
  if (!lab) notFound();
  return lab;
}
export function routeLocale(lang: string): Locale {
  if (lang === "zh") return "zh-CN";
  if (lang === "ja") return "ja";
  notFound();
}
