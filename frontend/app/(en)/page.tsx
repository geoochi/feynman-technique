import { Home } from "../../apps/web/pages/Home";
import { metadataFor } from "../../apps/web/pages/metadata";
import { catalog, routeLocale } from "../../apps/web/pages/content";
export const dynamicParams = false;
export async function generateMetadata() {
  return metadataFor(`/`);
}
export default async function Page() {
  return <Home locale={"en"} />;
}
