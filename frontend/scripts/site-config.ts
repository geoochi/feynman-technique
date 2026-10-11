import { siteOrigin } from "../site.config";
import type { SiteConfig } from "../packages/seo/site";

export function readSiteConfig(
  env: Record<string, string | undefined>,
  production: boolean,
): SiteConfig {
  const input = env.SITE_URL ?? siteOrigin;
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "SITE_URL must be an HTTPS origin without credentials, a path, query or fragment.",
    );
  if (env.SITE_INDEXABLE && !["true", "false"].includes(env.SITE_INDEXABLE))
    throw new Error("SITE_INDEXABLE must be true or false.");
  return {
    origin: url.origin,
    indexable:
      production &&
      env.SITE_INDEXABLE !== "false" &&
      (!env.WORKERS_CI || env.WORKERS_CI_BRANCH === "main"),
  };
}
