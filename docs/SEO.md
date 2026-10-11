# SEO 实现与上线验收

正式域名配置为 `https://feynman-technique.com`（用户指定），已完成 Cloudflare Workers 域名绑定与首次上线。

## 架构与页面内容

保留 React + Vite 的纯静态架构，在构建阶段预渲染 HTML，浏览器接管交互与科学计算。当前 27 个页面含三个语言的首页、贡献页、404、三个实验入口与三个讲解页。网站内容与案例数量尚不需要请求时 SSR、Next.js、服务器、数据库或 CMS。

`frontend/packages/seo/pages.ts` 是页面枚举的公共入口，开发路由、预渲染和 sitemap 共用；`metadata.ts` 统一计算页面标题、描述、canonical、语言替代链接及结构化数据；`head.ts` 用于静态 head 输出与客户端语言导航更新，避免生成页面与语言切换后的信息不一致。

实验入口的静态 HTML 包含标题、简介、封面、核心问题及讲解链接，JavaScript 加载后显示同一案例的实验界面。讲解页提供完整七章、公式、学习目标及引用。实验与讲解有各自的标题和描述，不把二者互相 canonical；每个语言版本 canonical 指向自身。保留真实 HTML 链接及每页单一主标题，不增加隐藏关键词或专供爬虫的另一套内容。

## 域名与环境

`frontend/site.config.ts` 保存正式 HTTPS origin。`SITE_URL` 可在构建环境覆盖该公开地址；只允许 HTTPS origin，不允许凭据、子路径、查询或锚点。它是公开配置，不是密钥。不要用请求 Host、localhost 或 Cloudflare Workers 预览域名自动推断正式地址。

```sh
cd frontend
pnpm build
# 私有演示或其他暂不收录的静态产物：
SITE_INDEXABLE=false pnpm build
```

开发模式始终 `noindex, follow`。生产构建默认允许收录；`SITE_INDEXABLE=false` 或 Workers Builds 的 `WORKERS_CI` 存在但 `WORKERS_CI_BRANCH` 不是 `main`（包括缺失分支）时，全部页面 noindex 且不输出 sitemap。非生产分支不能用 `SITE_INDEXABLE=true` 覆盖这一限制；变更生产分支时同步修改此规则。Workers 的 auto-trailing-slash 保留 `/zh/`、`/ja/` 首页，其他 HTML 使用无尾斜线的路径。`public/_headers` 对 workers.dev 添加 noindex 响应头；当前正式配置关闭 workers.dev 和版本预览。正式域名、HTTPS、HTML 别名和 www 归一化需按实际配置验收。

## 生成的搜索信息

- canonical 使用无参数、无锚点的正式绝对地址；语言首页保留 `/zh/`、`/ja/`，其他页面使用无尾斜线的 clean URL。
- hreflang 在每个内容页列出 en、zh-CN、ja、自身及指向英语的 x-default，使用完整 HTTPS 地址。语言切换同时更新 title、description、canonical、hreflang、Open Graph、Twitter Card 和 JSON-LD。
- `dist/sitemap.xml` 自动列出当前 24 个可收录页面；404 和未知案例不进入清单。不伪造 lastmod、优先级或更新频率。
- `dist/robots.txt` 允许抓取页面和资源，并在可收录构建中声明 sitemap。noindex 使用页面 meta，避免 Disallow 阻止爬虫读取该指令。
- 404 页面提供 noindex，不生成 canonical、hreflang 或 JSON-LD。本地静态预览中未知 URL 和缺失资源返回 HTTP 404，没有全站 SPA 回退；Workers 正式部署已实测未知页面与缺失脚本返回 HTTP 404。
- JSON-LD 描述 WebSite、CollectionPage/ItemList、WebPage 和 CreativeWork/LearningResource，仅使用真实标题、语言、作者、讲解目标和引用。不填写虚构评分、发布日期、课程认证或 FAQ。
- 三语言共用原创 1200×630 PNG 分享图；SVG 源文件与 PNG 都在 `frontend/public`。修改 SVG 后在已安装 Chrome 的本地执行 `pnpm generate:social-card`。生产构建直接复制素材，无需浏览器运行环境。

## 本地检查与生产验收

本地单元验证覆盖干净 canonical、双向语言地址、不同页面标题、404、sitemap 范围、环境索引策略、配置校验以及 head/JSON-LD 转义。浏览器验证检查不运行 JavaScript 时所有生成页面的正文、标题、语言、canonical、hreflang、JSON-LD，核对 sitemap 与 HTML 页面一致，验证语言切换及历史返回时元信息同步。

上线后仍需：核对正式域名/HTTPS及部署提交；检查 200/404、重定向、robots 和 sitemap；确认正式页面没有 noindex 或阻止抓取的响应头；在 Search Console 验证域名、提交 sitemap，用 URL Inspection 检查抓取结果。已完成域名绑定，27 页 HTML、24 页 sitemap、资源与 404 已线上核对；Search Console 验证和 sitemap 提交尚未执行。HTTP 到 HTTPS 已验证 301，www 尚未配置；可按部署指南添加。

页面体积、移动体验和 Core Web Vitals 应以正式部署及实际设备测量。首页仍携带首批三个案例的讲解数据，Three.js 仅在地球案例加载，既有约 889 KB 三维 chunk 警告仍待性能专项处理。本轮不声称已通过线上性能预算或改善搜索排名；结构化数据和 sitemap 也不保证收录或富结果。

## 官方依据

- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [多语言页面与 hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [生成和提交 sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Schema.org LearningResource](https://schema.org/LearningResource)
- [Open Graph](https://ogp.me/)
- [Workers Static Assets 响应头](https://developers.cloudflare.com/workers/static-assets/headers/)
