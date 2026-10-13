# 初期部署与迁移准备历史

> 归档于 2026-10-13。保留版本、来源与当时线上验收，不能当作当前部署状态。当前流程与最近正式版本见 [DEPLOYMENT](../DEPLOYMENT.md)。

## 首次发布记录（历史）

- Worker：`feynman`，Custom Domain：`feynman-technique.com`，HTTPS 首页及三语言深链接可访问。
- 发布时间：2026-10-11 04:39:39 UTC，版本：`3a0906aa-cd8c-482c-abc4-ece29df9f4ee`，100% 流量，Source=Upload。
- 来源：基线 `27aa030090fe8ec98fd5d601764d610453b8d2d3` 加当时未提交的 SEO/Workers 工作树；源码现随本版本纳入 Git，首次部署的 Source 仍为 Upload，不是 Git 构建。
- 本地检查：39 项单元测试、50 项 Workers 浏览器检查通过；4 项桌面尺寸测试在手机项目按规则跳过；build、dry-run 通过。
- 线上检查：27 个 HTML 与本地产物一致；sitemap 24 页；四个 HTML 别名重定向正确；入口 JS/CSS、分享图和地球贴图内容一致；未知页面与缺失脚本为 404；哈希资源 immutable，正式页面无 noindex 响应头。Chrome 线上检查三个实验的参数控件、两个动态案例播放/重置和日语语言导航，无 pageerror。
- 待完成：Workers Builds 关联、可选 www 重定向、Search Console。

前轮发布时网站公开、源码私有，并移除了源码/贡献链接与个人署名。后续仓库公开及 GitHub 投稿入口变更见本轮记录；个人署名仍不展示。当前生成 24 页 HTML，sitemap 21 页；下次 Git 自动构建关联需使用此版本配置。

## 公开信息清理发布

2026-10-11 通过本机 Wrangler 更新同一个 Worker，版本 `19e1445e-0cdb-4c47-a96d-9ab7121ed3a5`。本次 24 页 HTML、21 页 sitemap、公开目录、入口 JS/CSS、图片和三语言旧贡献页 404 已线上核对。相同源码随本版本 commit/push 保存；该次上传仍为本地 CLI 上传，没有因此连接 Workers Builds。审查对象与验证范围见 [本轮复核](../../tooling/ai-review/2026-10-11-private-site.md)。

## www 主域名与 SEO/GEO 发布记录

维护者明确指定 www 为主域名，并授权 Agent 使用本机 Cloudflare 授权自行操作。2026-10-11 06:08:33 UTC，通过本地 Wrangler 发布同一个 Worker，版本 `4ca80440-735c-4088-8f2d-deb9a90020a2`，100% 流量；控制台来源为 Wrangler（CLI 部署列表将来源显示为 Unknown/deployment），并非 Git 构建。来源为基线 `7f8e0d552ca2036163013dbd0af46dbdaae47433` 加本轮未提交工作树，没有提交或推送。

- www Custom Domain 已绑定，HTTPS 可用；裸域保留原有代理 DNS/TLS 绑定，仅承担跳转入口。
- Zone Single Redirect `裸域永久重定向到 WWW`（规则 ID `d18d0603f7f34d389a75024c465b3775`）活动，匹配与目标表达式如上，301，保留查询字符串。14 个 HTTP/HTTPS 裸域请求覆盖三语言首页、实验/讲解、缺失资源及编码查询参数，均一次 301 到 HTTPS www。www HTTP 到 HTTPS 也为 301。
- 24 份线上 HTML（含三个 noindex 404 静态资源）与本地一致；比较时只扣除 Cloudflare 注入的 Web Analytics beacon 脚本。21 个 sitemap URL、robots、目录 JSON、分享图核对通过。实际未知路径、缺失脚本与三语言旧贡献页返回 404；正式内容没有 noindex 响应头。
- Chrome 线上检查三个实验参数、动态案例单步/播放/重置、日语导航与 canonical，以及中文手机首页，无 pageerror。浏览器退出等待停滞后仅终止本次测试进程，不把该清理动作作为产品验证。
- 本机 curl 的新 www HTTP 域名解析短暂失败；公共 DNS/Google DNS 已返回正确 A 记录。www HTTP 验收使用该公开 A 记录的 `--resolve`，HTTPS 与浏览器正常访问。该检查不等于所有地区 DNS 都已刷新。
- 控制台当前仍提示连接 Git 仓库，Workers Builds 尚未关联；保持现有本地生产发布方式。旧裸域首次上线与性能样本保留真实历史，没有改写成 www 性能数据。

本地验证及限制见 [本轮复核](../../tooling/ai-review/2026-10-11-seo-geo.md)。Search Console 的域名验证、www sitemap 提交和 Google 选定 canonical 待完成。

## Search Console HTML 验证文件发布

维护者提供 `google845b412e18b99e6e.html`，用于 `https://www.feynman-technique.com/` 的网址前缀属性验证。原始 53 字节不作修改，保存至 `frontend/public/`，构建复制验证通过。通过同一个 Worker 发布，版本 `7af3a770-2b69-4b3d-b0fe-973ab3721cd2`；仅上传一个新静态资产。来源为 `d38c74a20cd25e50a93dc6e264b67aa49ac75002` 加本次验证文件工作树，源码与记录随后保存到 Git。

线上 `https://www.feynman-technique.com/google845b412e18b99e6e.html` 返回同域 307 到 `/google845b412e18b99e6e`，最终 200，正文与下载文件逐字节一致，未注入统计脚本。英文、中文、日文首页仍为 200，缺失脚本仍为 404；sitemap 保持 21 个内容网址，不加入验证文件。Google 支持此种同域重定向，依据见 [SEO 文件验证说明](../SEO.md#search-console-html-文件验证)。

已完成文件发布和可访问性核对，尚未得到 Google 所有权验证结果。维护者返回 Search Console 点击“验证”，成功后提交 www sitemap；后续构建继续保留原验证文件。

## GitHub 贡献入口发布（2026-10-11）

维护者明确授权仓库改名为 `geoochi/feynman-technique`、改为公开并开放 Issue/PR 贡献。本地 remote 已同步新名称；Cloudflare Worker 仍为 `feynman`，两端域名与 301 规则不变。

本机 Wrangler 上传版本 `d95e4c0d-f7eb-49e5-bc8d-e66ef4b33dc9`，部署时间 `2026-10-11T09:32:33Z`，流量 100%。该次上传来自基线 `8b5dee0` 加本轮已验证工作树，不是 Workers Builds 的 Git 构建。三语言首页加入实验提案、PR 和贡献指南，目录、讲解、实验导航加入 GitHub；仍为 24 页 HTML 与 21 个 sitemap URL，Google 验证文件保留。

24 页线上 HTML 已与本地产物核对（只扣除平台注入的统计脚本）；robots、sitemap、公开目录与分享图一致，未知资源和 /contribute 返回 404，14 组裸域路径/查询参数重定向均为 301。检查与审查范围见 [本轮记录](../../tooling/ai-review/2026-10-11-community.md)。Git 自动构建仍待关联，后续连接时选择新仓库名称。


## MIT 正式授权（2026-10-11）

维护者明确授权原创代码、讲解、文档与图示采用 MIT，正式条款为根目录 LICENSE。构建自动将它复制为 dist/LICENSE.txt 并随网站分发；根目录文件为唯一正式来源，不手动维护第二份条款。第三方依赖、字体和 NASA 贴图继续使用自身许可/使用条件，来源通知随产物保留。许可变化不增加网页或 sitemap URL。

本轮已通过本机 Wrangler 发布同一个 Worker，版本 `8dd640d1-11ec-4719-8070-51be2994705d`，创建时间 `2026-10-11T09:40:22Z`，流量 100%。上传来源为 `910ffde` 加本轮已验证工作树，仍不是 Git 自动构建。24 份线上 HTML、LICENSE.txt、THIRD_PARTY_NOTICES.txt、目录、robots、sitemap 和入口 JS/CSS 与本地一致；三个案例 code/content 均为 MIT；sitemap 保持 21 页。未知资源与 /contribute 返回 404，裸域 301 保留路径与编码查询参数。[本轮复核](../../tooling/ai-review/2026-10-11-mit.md)

## 2026-10-13 Next 迁移发布准备（阶段历史）

默认 pnpm build 产物改为 out，Wrangler 的 Worker 名称、www/裸域绑定、HTML 规则与真实 404 不变；只交付静态文件，无 Next 运行服务器。缓存仅覆盖 /_next/static/* 的哈希资源，RSC 文本与 HTML 可更新。完整 out（含 RSC/segment 文件）作为同一版本上传，不能只复制 HTML 或使用 next start。GitHub Builds 尚未关联，推送仍不会更新官网。

发布前复查 Next 安全补丁、确认最终源码/审查范围及回退版本，重新完成冻结安装和生产构建；不要上传 noindex 预览产物。上一正式验收对应版本继续保留在本文件历史中，但回退候选是否仍可用需发布时在平台核实。获得发布授权后上传同一 Worker，随后核对正式域名、裸域 301、21 个内容 URL、3 个语言错误页、RSC/资源/验证文件、robots/sitemap 与交互。本文既有线上验收均为历史，不算本次 Next 上线验收。
