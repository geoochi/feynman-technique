import { Experiment } from "../../../../../apps/web/pages/Experiment";
import { metadataFor } from "../../../../../apps/web/pages/metadata";
import { catalog, routeLocale } from "../../../../../apps/web/pages/content";
export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.map((l) => ({ slug: l.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  return metadataFor(`/${lang}/labs/${slug}`);
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  return <Experiment locale={routeLocale(lang)} slug={slug} />;
}
