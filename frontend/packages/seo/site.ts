export interface SiteConfig {
  origin: string;
  indexable: boolean;
}
declare const __SITE_CONFIG__: SiteConfig;
export const siteConfig: SiteConfig = __SITE_CONFIG__;
