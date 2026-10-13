import type { ReactNode } from "react";
import { Root } from "../../apps/web/components/Root";
export default function Layout({ children }: { children: ReactNode }) {
  return <Root locale="en">{children}</Root>;
}
