# SEO 实现与上线验收

后续内容优化、开发任务与维护者待办见 [SEO / GEO 改进与开发交接](SEO_GEO_PLAN.md)。首轮内容和元信息改进已完成开发、验证及 www 生产发布；Search Console 待处理，详见计划中的状态记录。

正式主域名配置为 `https://www.feynman-technique.com`（用户指定）。2026-10-11 已完成 www Custom Domain 绑定、HTTPS、裸域到 www 的 301 及本次新产物发布，并通过线上验收。

## 架构与页面内容

当前采用 Next.js App Router 静态导出，首页、完整讲解和实验框架在构建时渲染。三个语言共 21 个内容 URL 与 3 个语言 404；正文与科学交互边界见 [迁移记录](NEXTJS_REFACTOR_PLAN.md)。正式构建生成 sitemap，预览/非 main/显式 SITE_INDEXABLE=false 都 noindex 且不生成 sitemap。生产官网已于 2026-10-13 切换到 Next 产物，页面、robots/sitemap、验证文件和跳转已线上复核；未读取新的搜索效果数据。

`frontend/packages/seo/pages.ts` 统一页面枚举，metadata.ts 提供纯规则；apps/web/pages/metadata.tsx 将其适配为 Next Metadata 和安全 JSON-LD。旧 head.ts、applyMetadata 与正常页面预渲染器已删除；scripts/check-export.ts 校验导出正文、元信息、许可和客户端内容边界。

实验入口的静态 HTML 包含标题、简介、封面、核心问题及讲解链接，JavaScript 加载后显示同一案例的实验界面。讲解页提供完整七章、公式、学习目标及引用。实验与讲解有各自的标题和描述，不把二者互相 canonical；每个语言版本 canonical 指向自身。保留真实 HTML 链接及每页单一主标题，不增加隐藏关键词或专供爬虫的另一套内容。

## 案例 SEO 文案与讲解摘要

三个案例各有实验页与讲解页的英中日独立 title / description，存于案例 `manifest.json` 的可选 `seo.experiment` 与 `seo.lesson`。每种页面配置都包含 `title`、`description` 两个三语言对象（en、zh-CN、ja）；允许只覆盖一种页面，其余页面沿用案例标题、摘要与通用后缀。已配置的字段必须三语言完整且含非空白文字，未知字段或空配置由构建 schema 拒绝。Manifest schemaVersion 仍为 2，此项为兼容的可选扩展。

`pageMetadata` 统一读取这些文案，静态 HTML、语言切换、分享标签和 JSON-LD 的描述同步更新。资源名称继续使用案例可见标题；稳定 id、slug、页面路径与实验/讲解各自 canonical 的规则不变；正式绝对 URL 的主机随主域名切换为 www。

九份讲解在 H1 后增加可独立理解的核心答案，解释章节增加少量有对应正文的问题式 H3；七个固定 H2 与稳定章节 id 保留。摘要说明小角度周期与非线性单摆动画的区别、二次函数 a = 0 的退化边界，以及昼夜几何模型的假设。实验页仍只保留原有简介、问题和操作布局。首页保留口号，在紧邻说明中直接表达“通过互动实验理解数学与科学”，已检查三语言桌面与手机换行。

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
- `out/sitemap.xml` 自动列出当前 21 个可收录页面；404 和未知案例不进入清单。不伪造 lastmod、优先级或更新频率。
- `out/robots.txt` 允许抓取页面和资源，并在可收录构建中声明 sitemap。noindex 使用页面 meta，避免 Disallow 阻止爬虫读取该指令。
- 404 页面提供 noindex，不生成 canonical、hreflang 或 JSON-LD。本地静态预览中未知 URL 和缺失资源返回 HTTP 404，没有全站 SPA 回退；Workers 正式部署已实测未知页面与缺失脚本返回 HTTP 404。
- JSON-LD 描述 WebSite、CollectionPage/ItemList、WebPage 和 CreativeWork/LearningResource，仅使用真实标题、语言、讲解目标和引用；暂不输出个人作者。不填写虚构评分、发布日期、课程认证或 FAQ。
- 三语言共用原创 1200×630 PNG 分享图；SVG 源文件与 PNG 都在 `frontend/public`。修改 SVG 后在已安装 Chrome 的本地执行 `pnpm generate:social-card`。生产构建直接复制素材，无需浏览器运行环境。

## 本地检查与生产验收

本地单元验证覆盖干净 canonical、双向语言地址、不同页面标题、404、sitemap 范围、环境索引策略、配置校验以及 head/JSON-LD 转义。浏览器验证检查不运行 JavaScript 时所有生成页面的正文、标题、语言、canonical、hreflang、JSON-LD，核对 sitemap 与 HTML 页面一致，验证语言切换及历史返回时元信息同步。

上线后仍需：核对正式域名/HTTPS及部署提交；检查 200/404、重定向、robots 和 sitemap；确认正式页面没有 noindex 或阻止抓取的响应头；在 Search Console 验证域名、提交 sitemap，用 URL Inspection 检查抓取结果。历史 www 版本（2026-10-11）已线上核对 24 页 HTML、21 页 sitemap、资源与 404；14 个裸域 HTTP/HTTPS 请求均 301 到 https://www.feynman-technique.com，保留路径与查询，www 正式内容直接可访问。维护者已确认提交 sitemap，本轮未独立读取 Search Console 的验证/索引报告。配置及验收步骤见部署指南。

页面体积、移动体验和 Core Web Vitals 应以正式部署及实际设备测量。首页只传当前语言卡片和搜索字段，完整讲解集合留在构建侧；Three.js 仅在地球案例加载，约 878 KB 三维 chunk 警告仍保留。移动端实验室基线、复现条件和后续建议见 [性能测量](PERFORMANCE_BASELINE.md)。本轮不声称已通过线上性能预算或改善搜索排名；结构化数据和 sitemap 也不保证收录或富结果。

## Search Console HTML 文件验证

维护者选择 `https://www.feynman-technique.com/` 的网址前缀属性，并提供 Google 下载的 `google845b412e18b99e6e.html`。原文件按字节保存到 `frontend/public/`，Next 构建复制到 `out/`，由同一个 Worker 在网站根路径交付；不作为案例页面加入 sitemap，也不需要后端或 DNS TXT。

验证入口为 `https://www.feynman-technique.com/google845b412e18b99e6e.html`。保持原文件名和内容，验证成功后继续保留，以便 Google 定期复核。当前 Workers HTML 路由会把 `.html` 同域归一到无扩展名地址；Google 的 [HTML 文件验证故障排查](https://support.google.com/webmasters/answer/9008080?hl=en) 说明支持同域重定向。发布后须实际核对完整跳转链，最终返回 200，正文与下载文件一致。

文件可访问只证明上传已完成，不能写成 Google 已验证所有权。维护者返回 Search Console 点击“验证”，成功后提交 www sitemap。若选择覆盖所有子域名的 Domain property，则仍需 DNS 验证；HTML 文件仅用于当前网址前缀属性。

## 官方依据

- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [多语言页面与 hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [生成和提交 sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Schema.org LearningResource](https://schema.org/LearningResource)
- [Open Graph](https://ogp.me/)
- [Workers Static Assets 响应头](https://developers.cloudflare.com/workers/static-assets/headers/)

当前贡献页已停用，三语言 /contribute 返回 404 且不进入 sitemap。公开 HTML 与 JS 提供项目 GitHub 及 Issue/PR 链接；目录 JSON 和 JSON-LD 继续省略个人作者。源码素材归属记录和第三方版权通知保留。
