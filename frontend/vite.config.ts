import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import catalog from "./apps/web/generated/catalog.json";
import { pageRoutes } from "./packages/seo/pages";
import { readSiteConfig } from "./scripts/site-config";
const devPages = new Set(
  pageRoutes(catalog).map((path) => path.replace(/\/$/, "")),
);
export default defineConfig(({ mode }) => ({
  define: {
    __SITE_CONFIG__: JSON.stringify(
      readSiteConfig(
        { ...loadEnv(mode, process.cwd(), ""), ...process.env },
        mode === "production",
      ),
    ),
  },
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
}));
