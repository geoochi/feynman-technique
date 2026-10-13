import { Home } from "../../../apps/web/pages/Home";
import { metadataFor } from "../../../apps/web/pages/metadata";
import { routeLocale } from "../../../apps/web/pages/content";
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return metadataFor(`/${lang}/`);
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <Home locale={routeLocale(lang)} />;
}
