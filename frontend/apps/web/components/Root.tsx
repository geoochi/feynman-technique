import type { ReactNode } from "react";
import type { Locale } from "../../../packages/i18n/locales";
import "@fontsource/chakra-petch/latin-400.css";
import "@fontsource/chakra-petch/latin-500.css";
import "@fontsource/chakra-petch/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "../global.css";
export function Root({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <html lang={locale}>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { let failed = false; const show = () => { if (!failed || document.documentElement.dataset.feynmanShellReady) return; for (const node of document.querySelectorAll('[data-bootstrap-fallback]')) node.hidden = false; }; const fail = () => { failed = true; show(); }; addEventListener('DOMContentLoaded', show, { once: true }); addEventListener('error', event => { if (event.target instanceof HTMLScriptElement && event.target.src.includes('/_next/static/chunks/')) fail(); }, true); addEventListener('unhandledrejection', event => { if (/chunk|module/i.test(String(event.reason)) && /load|fetch/i.test(String(event.reason))) fail(); }); })();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
