import { Missing } from "../../apps/web/pages/Missing";
export const metadata = {
  title: "Page not found · Feynman",
  robots: { index: false, follow: true },
};
export default function Page() {
  return <Missing locale="en" />;
}
