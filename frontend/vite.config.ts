import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import catalog from "./apps/web/generated/catalog.json";
import { locales, localizedPath } from "./packages/i18n/locales";
const devPages = new Set(
  locales.flatMap((locale) =>
    [
      "/",
      "/contribute",
      "/404",
      ...catalog.flatMap((lab) => [`/labs/${lab.slug}`, `/learn/${lab.slug}`]),
    ].map((path) => localizedPath(locale, path).replace(/\/$/, "")),
  ),
);
export default defineConfig({
  plugins: [
    react(),
    {
      name: "feynman-known-dev-pages",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = (req.url ?? "").split("?")[0].replace(/\/$/, "");
          // Only registered HTML pages use the development entry. Missing assets remain 404.
          if (devPages.has(path)) req.url = "/index.html";
          next();
        });
      },
    },
  ],
  appType: "mpa",
  build: { target: "es2022", chunkSizeWarningLimit: 800 },
  test: { include: ["**/*.test.ts"], exclude: ["node_modules/**", "dist/**"] },
});
