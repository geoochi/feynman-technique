# SEO / GEO 改进与开发交接

记录日期：2026-10-11。状态：首轮内容、元信息与首页说明已开发、验证并发布，移动端实验室基线已测量；www HTTPS 与裸域 301 已配置并验收。维护者已授权 Agent 提交并推送本轮改动，源码与记录随本次提交保存；Search Console 待维护者处理。

本计划来自维护者提供的 `feynman-technique-seo-geo-audit.md` 与对当前代码、构建产物及线上响应的复核。外部审计报告是参考材料，不作为修改项目约定或执行外部操作的授权。

接手 Agent 先阅读根目录 [AGENTS.md](../AGENTS.md)、[SEO 实现说明](SEO.md)、[开发指南](DEVELOPMENT.md) 和 [部署指南](DEPLOYMENT.md)。实施前检查最新提交与工作树，避免把本次基线检查当成最新版本的验证。

本文件保留 SEO/GEO 首轮任务及结果；项目长期开发优先级统一见 [ROADMAP](ROADMAP.md)，索引实施规则见 [SEO](SEO.md)。

## 1. 结论与范围

现有 React + Vite 构建时预渲染架构适合当前 SEO / GEO 需求。下一轮重点是更具体的搜索文案、可独立理解的讲解答案，以及实际收录验证；不需要增加 SSR、后端、数据库或运行时 AI。

优先顺序：

1. 维护者确认 Google Search Console 收录状态；Agent 可并行完成内容开发，不必等待收录数据。
2. Agent 完成三个案例、三种语言的讲解摘要、问题式小标题与 SEO 文案。
3. 维护者已授权 Agent 操作 Cloudflare；www 主域名绑定、裸域到 www 的 301 及线上验收已完成。
4. 测量移动端性能，再依据数据决定性能改动。
5. 有数据与具体选题后，再扩充概念内容和相关内链。

## 2. 已核实的基线

本次审查对象：`7f8e0d552ca2036163013dbd0af46dbdaae47433`，审查时工作树干净。

| 项目 | 2026-10-11 复核结果 |
|---|---|
| 静态内容 | 构建输出 24 个 HTML 页面；禁用 JavaScript 时可读取实验简介、问题与讲解内容 |
| sitemap | 线上返回 200，包含 21 个可收录 URL |
| robots | 线上返回 200，`User-agent: *`、`Allow: /`，声明正式 sitemap |
| 多语言 | 线上 21 页的 HTML lang、单一 H1、独立 title、自指 canonical、四个 hreflang 链接通过检查 |
| 索引指令 | 本次检查的 21 页允许收录，未发现 noindex 响应头 |
| 结构化数据 | 已有 WebSite、CollectionPage、WebPage、CreativeWork/LearningResource 等；静态页面与客户端共用生成逻辑 |
| 错误响应 | 抽查未知页面及缺失脚本，均返回真实 404 |
| HTTPS | HTTP → HTTPS 返回 301，保留路径与查询参数 |
| www | 本次请求出现 TLS 连接失败和域名解析失败；未复现外部报告所述的 HTTP 502；仓库记录为尚未配置 |
| 本地验证 | `pnpm build`、6 项 SEO 单元测试、2 项桌面 SEO 浏览器测试通过 |

这不代表 Google 已收录、排名改善、AI 已引用、所有真实爬虫均可访问或 Core Web Vitals 已达标。本次没有 Search Console 账户数据、真实爬虫日志或现场性能指标。

## 3. Agent 的首轮开发任务

### A. 三语言讲解增加核心答案（已本地完成）

范围为三个案例的全部九份 `lesson.*.md`：

- `frontend/examples/physics/pendulum/`
- `frontend/examples/math/function-transform/`
- `frontend/examples/geography/day-night/`

在每份讲解的 H1 后、首个 H2 前添加简短答案段落。要求脱离上下文也能理解，包含核心关系、必要条件，并自然连接后续实验。不要强制凑字数，不添加关键词堆叠。

内容重点：

- **单摆：** 理想单摆的小角度周期与摆长、重力的关系；质量不影响理想模型的周期；摆长四倍对应周期约两倍；大振幅时小角度公式会低估实际周期。说明显示的近似周期与非线性动画之间的区别。
- **二次函数：** `y = a(x − h)² + k` 中参数如何控制位置、开口和宽窄；顶点 `(h, k)` 的结论须排除 `a = 0`，此时为水平直线。
- **昼夜：** 地球自转与太阳照明如何产生昼夜；纬度与太阳赤纬如何影响昼长；保留几何模型的适用条件，不把当前场景描述成完整公转或季节模拟。

单摆中文示例，可润色并准确翻译：

> 理想单摆在小角度摆动时，周期近似为 T ≈ 2π√(L/g)，与摆球质量无关。摆长变为四倍，周期约变为两倍；重力加速度越大，周期越短。大角度摆动时，这个近似会低估实际周期。

摘要放在独立讲解页，保持实验页“问题 → 操作”的探索体验和当前布局。不要将完整答案、目标和引用重新堆回实验页。

### B. 增加有实质内容的问题式小标题（已本地完成）

当前 `frontend/scripts/catalog.ts` 强制要求七个固定名称的 H2，名称来自 `frontend/packages/i18n/locales.ts`。直接替换这些 H2 会导致构建失败。

首轮保留七章与稳定 id，在相关章节中添加少量 H3，例如“哪些因素影响单摆周期？”“为什么 h 为正时图像向右移动？”“高纬度为什么会出现极昼？”。每个小标题下必须有对应解释，不生成重复、薄弱的 FAQ，也不为此增加 FAQ Schema。

如确有必要解除固定标题约束，应单独说明方案、同步修改解析与验证，并维持稳定章节 id；本轮默认不做这项重构。

### C. 更具体的 title 与 description（已本地完成）

当前 `frontend/packages/seo/metadata.ts` 使用“案例标题 + 通用后缀”，description 使用“案例摘要 + 通用句”。这些内容有效且不重复，但可进一步说明页面提供的功能和答案。

建议在案例 manifest 中增加可选、可校验的 SEO 文案，分别覆盖实验页与讲解页的三语言 title / description；未配置时保留现有生成规则。具体字段结构由接手 Agent 结合类型与 schema 设计，避免中心路由里按 slug 硬编码。

主要关联文件：

- `frontend/packages/core/types.ts`
- `frontend/scripts/manifest.schema.json` 与 `frontend/scripts/catalog.ts`
- 三个案例的 `manifest.json`
- `frontend/packages/seo/metadata.ts`
- 相关单元与浏览器测试

候选英文标题（不是经过搜索量或 CTR 验证的最终文案）：

- `Pendulum Simulator: Length, Gravity & Period · Feynman`
- `Pendulum Period: Formula and Small-Angle Approximation · Feynman`
- `Quadratic Function Graph: Explore a, h and k · Feynman`
- `Day and Night Simulator: Earth's Rotation · Feynman`

description 说明可调整的实际参数和可理解的概念。实验与讲解分别撰写，三语言自然表达，不机械堆砌相同关键词，不承诺当前不存在的功能。

不得改变稳定 slug、现有路径、实验与讲解的独立 canonical 规则。维护者随后明确 www 为主域名，绝对 canonical 主机统一改为 www。静态 HTML 与语言切换后的 title、description、分享标签、JSON-LD 继续使用同一元信息来源。

### D. 首页定位文案（已本地完成）

现有首页 title 已明确说明数学与科学互动实验，H1 是品牌口号。可在保留视觉风格的前提下，让 H1 或紧邻说明更直接地表达产品用途，口号可作为辅助文字。

修改位置主要为 `frontend/packages/i18n/messages.ts` 与 `frontend/apps/web/App.tsx`。需要检查三语言的桌面和手机换行，不为 SEO 大改首页布局。此项属于表达改善，不是修复收录故障。

## 4. 需要维护者完成的事项

| 事项 | 维护者需要做什么 | 可交给 Agent 的后续工作 |
|---|---|---|
| Search Console | 登录并验证 `feynman-technique.com` 域名所有权；按平台提示配置 DNS 验证；切换完成后提交 `https://www.feynman-technique.com/sitemap.xml` | 根据报告分析未收录原因、规范网址问题与修复方案 |
| 重点网址检查 | 检查首页、三个实验与三个讲解页，并抽查中文和日语；查看抓取、索引状态和 Google 选定的 canonical，必要时请求编入索引 | 根据检查结果复核 HTML、重定向和索引指令 |
| 主域名切换 | 将 `www.feynman-technique.com` 绑定为 Worker 正式主域名，确认 HTTPS 证书；裸域保持代理 DNS，并用 301 永久重定向到 www，保留路径和查询参数 | 验证裸域 HTTP/HTTPS 都跳到 HTTPS www、www 页面直接可用，不循环、不出现 5xx |
| 真实爬虫访问 | 查看 Cloudflare 的相关安全事件、机器人设置或可用日志，确认目标搜索爬虫没有被误拦截 | 根据具体事件诊断；普通请求或伪装 User-Agent 成功不能证明真实爬虫已访问 |
| 训练爬虫偏好 | 仅在希望改变现有策略时，单独决定是否允许训练抓取；不要把搜索抓取和训练抓取混为一项 | 按明确决定调整规则；本轮不擅自改变现有开放策略 |
| 合并与上线 | 查看最终 diff、测试和文案后，确认提交、推送、合并或发布的范围 | 获得对应授权后执行，部署完成再核验正式网站 |

维护者可提供索引排除原因、网址检查结果、查询词/展示/点击数据，或授权 Agent 在可用平台中协助。不要把账号密码、API Token 或验证凭据写入仓库和聊天记录。

Search Console 的域名验证和现有裸域索引检查可以先做，不必等开发完成；www 切换完成后提交 www sitemap 并检查 www 网址。新站数据可能尚未积累，不要用一次 `site:` 查询或抓取失败替代实际索引报告。

Workers Builds 与 GitHub 的关联在本次基线仍未完成；`git push` 不自动发布网站。接手时需重新确认部署状态，按 `DEPLOYMENT.md` 使用当时已确定的生产发布流程。

## 5. 性能与后续内容：先测量，再决定开发

本次构建体积：入口 JS 约 298 KB / gzip 92 KB；地球案例独立 JS 块约 889 KB / gzip 240 KB。地球模块已按案例加载，不应误称它进入首页首包。

首页当前导入完整 catalog，包含所有案例三语言讲解。扩充案例后，这会增加入口负担。建议先记录首页、单摆、地球页的移动端加载与交互表现，再决定是否拆分轻量目录与按案例加载的讲解数据。拆分时仍须保证预渲染 HTML 正文完整、语言切换正确、目录搜索可用。

性能报告要标明 URL、版本、设备/视口、网络与工具条件，区分实验室测试和真实用户数据。没有现场数据时不要宣称 Core Web Vitals 通过或失败。

内容方面，先完善现有三个主题。后续可根据真实查询需求扩展简谐运动、小角度近似、顶点式等独立内容，并添加相关内链；不要为了增加页面数拆分出缺乏独立价值的薄页。费曼学习法介绍文章属于可选后续选题，不是本轮必做页面。

## 6. 不在本轮范围内

- 不改成 Next.js 或请求时 SSR，不新增后端、CMS、数据库、账户系统。
- 不添加专门的 GEO 服务、运行时 AI 或自动生成海量内容。
- 不把 `llms.txt`、额外 Schema 或 FAQ 堆叠当作收录前提。
- SEO 首轮未恢复社区入口；后续已按维护者授权新增 GitHub 导航与 Issue/PR 投稿区。仍省略个人作者，保留真实参考资料、模型假设和诚实审核状态。
- SEO 首轮未改仓库可见性；后续由维护者明确授权公开仓库。仍不增加 GitHub Actions 或第二套自动发布通道。
- 不承诺排名、流量或 AI 引用提升。

Google 官方说明：AI 搜索功能沿用基础 SEO 要求，不要求专门 AI 文件或额外结构化数据。参见 [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)。

## 7. 开发验收与交接要求

首轮开发完成后至少核对：

1. 九份讲解均包含准确、简洁的直接答案；三语言含义一致，七章结构与稳定 id 未被破坏。
2. 每个内容页保持单一 H1；问题式 H3 层级合理，正文和外部参考可静态读取。
3. SEO 文案字段经过 schema/类型校验；新增可选配置与默认回退均有必要验证，缺失语言不能静默进入正式产物。
4. 可收录页面数仍为 21，路径不变，主域名切换后绝对 URL 主机改为 www；canonical、hreflang、robots、sitemap、404 和隐藏个人信息的规则继续正确。
5. 语言切换后 title、description、分享标签与 JSON-LD 同步；实验参数与播放状态保持现有行为。
6. 首页如有调整，检查英中日桌面与手机排版；不要仅检查英文桌面。
7. 更新 `docs/SEO.md` 的已实现说明和本计划的完成状态，区分已开发、已验证、已部署与等待维护者处理的事项。

在 `frontend` 目录运行与改动相关的验证，例如：

```sh
pnpm test
pnpm build
pnpm exec playwright test tests/browser/seo.spec.ts
```

根据实际变更追加必要的内容、语言或界面检查；如果修改部署配置，按部署指南增加对应验收。浏览器测试中硬编码的旧 title 需更新，但不能为了通过测试而削弱检查。

最终交接报告记录：最终 commit SHA 或工作树状态、变更文件、实际执行与通过的检查、未核实事项、维护者待办、是否已发布。只有获得授权才提交/推送/发布；提交遵守 Codex 共同作者 trailer 约定。

## 8. 当前待办状态

- [x] Agent：九份讲解核心答案与必要的问题式 H3。
- [x] Agent：案例级三语言 SEO 文案及校验、测试。
- [x] Agent：评估并适度改进首页定位文案与排版。
- [x] 维护者：已在会话中确认提交 sitemap；HTML 验证文件已由 Agent 发布并核对。Agent 未独立读取 Search Console 账号报告。
- [ ] 维护者：后续观察重点网址的抓取、收录及搜索表现。
- [x] Agent（维护者授权）：Cloudflare 绑定 www，配置裸域到 www 的 301，发布并线上验收。
- [x] Agent：读取 Cloudflare AI Crawl Control 的真实访问计数与阻止开关；Googlebot 一次失败的具体原因仍未定位，见下方记录。
- [x] Agent：性能基线测量，提交有证据的后续优化建议，见 [性能报告](PERFORMANCE_BASELINE.md)。
- [x] Agent：已获授权发布并验收。
- [x] 维护者：已明确授权本轮 Git 提交与推送。

## 9. 首轮开发结果（2026-10-11，本地工作树）

基线 HEAD 仍为 `7f8e0d552ca2036163013dbd0af46dbdaae47433`，首轮改动未提交。开始时 `docs/SEO.md` 已修改，本计划为未跟踪文件；保留这些已有内容并补充状态。首轮本地开发时没有执行推送、部署或账号设置；随后获授权发布与配置 Cloudflare，见第 11 节。

- 九份讲解均增加 H1 后的核心答案，解释章内加入问题式 H3；七章与稳定 id 保留，实验页简介和探索布局未改。
- Manifest 新增可选 `seo.experiment` / `seo.lesson`，每项含三语言 title、description。构建拒绝缺失语言、空白文字和未知字段；未配置的页面独立回退。三个案例均配置两种页面，元信息、分享标签与 JSON-LD 描述共用来源。
- 首页保留 H1 口号，紧邻说明直接表达数学与科学互动实验用途；三语言 1440×900、390×844 截图与排版检查通过。
- `pnpm test`：44 项单元测试通过；`pnpm build`：类型检查与构建通过，预渲染仍为 24 页、sitemap 为原有 21 个 URL。
- `pnpm exec playwright test tests/browser/seo.spec.ts tests/browser/i18n.spec.ts tests/browser/app.spec.ts --output=test-results-seo-geo`：50 项通过、4 项按设计跳过。涵盖禁用 JavaScript 的内容、canonical/hreflang、分享标签、JSON-LD、真实本地 404、语言切换与历史返回、参数和播放状态、贴图/WebGL/模块故障回退。新增内容后旧文字定位出现重复匹配，已改为匹配公式段落并复验。
- 本机使用 Node 24.21.0、pnpm 12.10.1、macOS 27.0.1、Chrome 155.0.8059.40；生产固定版本配置未改。构建入口 JS 316.20 KB / gzip 96.07 KB，地球独立 JS 888.83 KB / gzip 239.87 KB，体积警告保留。实验室测量与后续建议见 [性能报告](PERFORMANCE_BASELINE.md)，不能据此宣称真实用户 Core Web Vitals 达标。

维护者下一步：Search Console 域名验证、提交 www sitemap 和重点网址检查。本轮 Git 提交与推送已获授权。Cloudflare 主域名切换、生产发布及真实爬虫记录读取已完成，详情见第 11 节。

## 10. 主域名方向修订（维护者明确要求）

正式内容主机为 `https://www.feynman-technique.com`，裸域 `feynman-technique.com` 仅通过 301 永久重定向到 www，保留路径与查询参数。原计划“www → 裸域”方向作废。代码默认 origin、Wrangler Custom Domain、分享图域名及当前配置文档已同步修改；历史上线记录与性能样本仍保留当时裸域 URL，不将其改写成 www 已验收。

Cloudflare 操作顺序与具体规则见 [部署指南](DEPLOYMENT.md#域名与正式验收)。Search Console 可验证覆盖整个域的 `feynman-technique.com` Domain property（包括 www，见 [Google 资源属性说明](https://support.google.com/webmasters/answer/34592)）；迁移完成后提交 www sitemap，检查 Google 选定 canonical 是否为 www。若 Cloudflare 构建环境已有 SITE_URL，须同步改为 www 或删除覆盖值。本地开发完成不表示 DNS、证书或线上 301 已配置。

## 11. 授权后的 Cloudflare 操作与线上结果

维护者随后明确本机 Cloudflare 已授权，要求 Agent 自行操作。已绑定 www、通过已登录控制台启用裸域 Single Redirect，保留原有裸域 Custom Domain 作为代理 DNS/TLS 跳转入口，并发布全部本轮 SEO/GEO 产物。部署版本 `4ca80440-735c-4088-8f2d-deb9a90020a2`、100% 流量，来自本地未提交工作树；没有提交/推送。24 份 HTML、21 个 www sitemap URL、14 个裸域 HTTP/HTTPS 301、实际 404、三案例交互与语言切换已验收，详见 [发布记录](DEPLOYMENT.md#www-主域名与-seogeo-发布记录)。

Cloudflare AI Crawl Control 的过去 7 天记录：20 个请求、19 个允许、1 个失败；ChatGPT-User 允许 12、失败 0，Googlebot 允许 7、失败 1，17 次请求得到 HTTP 200。Googlebot、ChatGPT-User、OAI-SearchBot、BingBot、PerplexityBot、GPTBot 的阻止开关均关闭。没有主动修改安全策略，也没有用伪造 User-Agent 验证真实爬虫。Googlebot 一次失败的具体响应/原因尚未定位；这些数据不能证明所有爬虫都可访问或已经被收录。

Worker 控制台仍提示连接 Git 仓库，Git 自动构建尚未关联。Search Console 是剩余的账号侧事项：验证域名、提交 `https://www.feynman-technique.com/sitemap.xml`，检查重点 www 网址和 Google 选定 canonical。历史性能数据保持原来的裸域测量来源，未重新测量 www 性能。

## 12. Search Console 验证文件

维护者选择 www 网址前缀属性并提供 Google HTML 验证文件。Agent 已按原文件名及原内容保存、构建和发布，线上同域 307 后返回 200，53 字节正文与原文件一致；本次仅增加一个静态资产，保留 21 个内容 sitemap URL。文件会随源码保存，以供后续重新发布时保留。具体版本和验收见 [部署记录](DEPLOYMENT.md#search-console-html-验证文件发布)。Google 的验证按钮与 sitemap 提交仍待维护者完成，不将文件可访问记为所有权已验证。

## 13. Next 静态迁移的本地复核（2026-10-13）

初次全量本地验收时源码迁移已实现，尚未发布；随后获得授权并完成第 14 节的上线复核。21 个规范内容 URL、三语言独立元信息/正文/JSON-LD、Google 验证文件、robots/sitemap 与真实语言 404 已本地复核；首页无需下载全语言讲解集合。Next Metadata 使用原有纯规则，预览及非 main 构建强制 noindex 且无 sitemap。详细结果见 [全量迁移记录](../tooling/ai-review/2026-10-13-next-migration.md)。本节不覆盖第 9–12 节历史上线事实，也没有读取新的 Search Console/爬虫/流量报告；不能据框架迁移声称收录或 GEO 效果改善。

## 14. Next 正式上线后的索引配置复核（2026-10-13）

源码 ccedbd2 已推送并发布，版本 80b67878-c31f-447c-bca2-e22033a1e027、100% 流量。21 个正式内容页、三语言 404、robots/sitemap、Google 验证文件及裸域跳转已线上核对；页面与静态导航载荷和本地产物一致，三语言交互/无 JS 讲解通过。见 [正式生产复核](../tooling/ai-review/2026-10-13-next-deployment.md)。没有读取新的 Search Console 或流量/真实用户性能数据，不声称产生索引、排名或 GEO 效果。
