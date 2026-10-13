import { Experiment } from "../../../../apps/web/pages/Experiment";
import { metadataFor } from "../../../../apps/web/pages/metadata";
import { catalog } from "../../../../apps/web/pages/content";
export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.map((l) => ({ slug: l.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return metadataFor(`/labs/${slug}`);
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Experiment locale={"en"} slug={slug} />;
}
