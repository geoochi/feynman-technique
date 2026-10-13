import type { Locale } from "../../../packages/i18n/locales";
import { Header } from "../components/Chrome";
import { MissingBody } from "../components/MissingBody";
export function Missing({ locale }: { locale: Locale }) {
  return (
    <>
      <Header locale={locale} path="/404" />
      <MissingBody locale={locale} />
    </>
  );
}
