import type { ReactNode } from "react";
import { Root } from "../../../apps/web/components/Root";
import { routeLocale } from "../../../apps/web/pages/content";
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "zh" }, { lang: "ja" }];
}
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  return <Root locale={routeLocale((await params).lang)}>{children}</Root>;
}
