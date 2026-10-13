# Cloudflare Workers 静态部署

日期：2026-10-11。当前正式主域名：`https://www.feynman-technique.com`，裸域 301 到 www。Cloudflare OAuth 授权、Active Zone、www 绑定、HTTPS、裸域重定向和本轮 SEO/GEO 产物发布已完成，并通过线上验收。GitHub 自动构建关联尚未完成。

## 当前实际流程

当前源码已迁移为本机 pnpm build 生成 out（本次尚未上传；线上仍是此前 Vite 版本），再由本机 pnpm deploy:workers（Wrangler）上传到 Cloudflare。Cloudflare 负责持有、分发线上资源；网站不运行在本机，关闭本机不影响访问。git commit/push 只保存源码，尚不自动触发部署。完成 Workers Builds 的 GitHub 关联后，生产分支推送事件才会触发 Cloudflare 构建并发布；不用另写自定义 webhook 或 GitHub Actions。

## 部署方式

使用 Next.js App Router 静态导出，Workers Static Assets 交付 `frontend/out`；不添加 Worker 应用脚本、SSR、数据库或存储服务。科学计算仍在访问者浏览器运行。配置位于 `frontend/wrangler.jsonc`，Wrangler 固定为 4.149.0。

`auto-trailing-slash` 将 `labs/pendulum.html` 提供为 `/labs/pendulum`，将 `zh/index.html` 提供为 `/zh/`，别名自动重定向。`404-page` 对未知页面使用最近的语言目录 404 文件并返回 HTTP 404；缺失脚本也返回 404。不设置全站 SPA 回退。`public/_headers` 提供哈希资源长缓存、nosniff 和 workers.dev 的 noindex 响应头。正式配置关闭 workers.dev 与版本预览 URL。

## 首次本地发布

先核对 Cloudflare 中该域名所在的账户、Zone 是否 Active，以及 www 与裸域是否已有其他网站/DNS 记录。若存在其他用途，先处理冲突，避免覆盖。Wrangler 的 Custom Domain 配置会创建域名绑定和相应 DNS/证书，无需填写服务器 IP。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm build
pnpm test
FEYNMAN_WORKERS=1 pnpm test:e2e
pnpm exec wrangler deploy --dry-run
pnpm exec wrangler login
pnpm exec wrangler whoami
pnpm deploy:workers
```

`wrangler login` 使用浏览器 OAuth；不要将 API Token、密码或 OAuth 凭据提交到 Git 或发到聊天中。若登录账号有多个账户，先确定域名所在账户，再通过本机 `CLOUDFLARE_ACCOUNT_ID` 指定。部署对象为 `feynman`；发现同名现有 Worker 时先核对用途。

首次本地发布只初始化同一个生产 Worker，不代表 Git 自动发布已经关联。没有 Cloudflare 授权时，构建和 dry-run 可完成，实际上传不能完成。

## 后续 Git 自动发布

本地审查 → 维护者确认并更新 GitHub `main` → Workers Builds 自动构建和部署。Cloudflare Dashboard 中的 Workers & Pages 选择 `feynman`，在 Settings 的 Build 设置连接 `geoochi/feynman-technique`，授权 Cloudflare GitHub 集成访问该公开仓库；新项目也可从 Import a repository 入口创建。Worker 服务名称仍为 `feynman`，无需因仓库改名更改服务或域名。

| 设置 | 值 |
|---|---|
| Worker 名称 | `feynman`，与 Wrangler 配置一致 |
| Git 仓库 | `geoochi/feynman-technique` |
| 根目录 | `frontend` |
| 生产分支 | `main` |
| Build command | `pnpm build` |
| Deploy command | `pnpm deploy:workers` |
| Node 构建变量 | `NODE_VERSION=24.11.1` |
| pnpm 构建变量 | `PNPM_VERSION=12.10.1` |
| 构建公开地址 | `SITE_URL=https://www.feynman-technique.com`（与代码默认值一致，可不填） |
| 非生产分支构建 | 当前关闭 |

依赖按已提交的 pnpm lockfile 安装，静态资源目录由 Wrangler 的 `assets.directory` 指向 `out`，无需设置 Pages 的输出目录或添加自定义 Worker 入口。平台构建授权留在 Cloudflare，不写入浏览器公开环境变量或仓库。配置和 SEO 源码随本版本保存到 Git；连接 Git 构建时应选择包含这些配置的提交。GitHub 集成的账户授权需要由维护者完成。

当前 SEO 构建策略使用 Workers Builds 提供的 `WORKERS_CI` 与 `WORKERS_CI_BRANCH`：仅 `main` 可收录，其他分支或缺失分支 noindex 且不输出 sitemap。更换生产分支时同步更新 `scripts/site-config.ts` 和测试。私有演示构建使用 `SITE_INDEXABLE=false pnpm build`，随后正式发布前重新执行正常构建；不要上传残留演示产物。

## 域名与正式验收

当前配置在 Wrangler 中绑定 `www.feynman-technique.com`，SEO origin 同样使用 HTTPS www。裸域 `feynman-technique.com` 只做 301 永久跳转，路径与查询参数原样保留。原先“www → 裸域”的方向作废。DNS 接管或修改仓库配置不代表切换完成；须核对实际绑定、两端证书、重定向和新产物。

本轮已按以下顺序完成切换；后续重新配置时遵循同样顺序，避免先撤掉现有入口：

1. 为现有 `feynman` Worker 添加 `www.feynman-technique.com` Custom Domain，等待 www 的 HTTPS 证书可用，先确认页面及深链接可访问。不要在 www 上配置转向裸域的规则。
2. 裸域保持代理 DNS（橙云），确认其 HTTPS 证书有效；在域名的 Redirect Rules 中新增 Single Redirect，条件为 `(http.host eq "feynman-technique.com")`，动态目标为 `concat("https://www.feynman-technique.com", http.request.uri.path)`，状态码 **301**，启用 **Preserve query string**。规则覆盖裸域的 HTTP 与 HTTPS；既有 Always Use HTTPS 可能先增加同域跳转，验收最终必须到 HTTPS www，且每个迁移跳转为 301。
3. 配置裸域跳转并验证后，再按授权发布本次 www SEO 产物和目标 Wrangler 配置。当前配置保留 www 和裸域的 Custom Domain；裸域绑定仅保留代理 DNS/TLS，由 Zone Redirect Rule 在静态资源交付前返回 301，不作为内容站。保留该绑定可避免后续 Wrangler 发布误删裸域 DNS。若以后改用纯跳转 DNS，应先保证接收入口，再按 Cloudflare 官方方案使用代理 A 记录 `@ → 192.0.2.1`；无需服务器 IP，不修改 MX/TXT 等其他用途记录。
4. 若 Workers Builds 或本机构建环境已有 `SITE_URL`，改为 `https://www.feynman-technique.com` 或删除旧覆盖值，重新构建。正式产物的 canonical、hreflang、分享 URL、JSON-LD、robots 与 sitemap 都必须使用 www；本次代码默认值已修改，但环境变量会覆盖它。
5. 完成后在 Search Console 提交 `https://www.feynman-technique.com/sitemap.xml`，检查 www 首页、三个实验及讲解页，并抽查中文/日文。旧裸域网址应是跳转入口，不能继续作为内容页 canonical。

现有 Wrangler OAuth 可管理 Worker/Custom Domain，但 DNS Records 与 Rulesets API 返回 403。维护者随后授权 Agent 自行操作 Cloudflare，Agent 通过本机已登录 Chrome 控制台部署 Redirect Rule，使用现有 OAuth 绑定 www 并上传静态产物；无需新增令牌或扩大权限。Custom Domain 管理与纯跳转 DNS 的关系须先核对实际状态，不能在旧绑定仍占用裸域时盲目覆盖它。

例子：`https://feynman-technique.com/zh/labs/pendulum?source=test` 应 301 到 `https://www.feynman-technique.com/zh/labs/pendulum?source=test`；对应 www 深链接直接返回 200。HTTP 裸域的最终目标相同。不要依赖前端 JavaScript 完成重定向。

具体动态表达式、查询保留与纯跳转 DNS 用法依据 [Cloudflare 官方重定向指南](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/)。

发布后核对：

- Workers 部署版本与来源；Git 构建须对应目标 commit SHA，首次本地上传的版本来源应与后续 Git 构建分别记录。
- www 主域名、三语言入口及实验/讲解深链接直接返回 200，`.html` 与尾斜线别名归一正确。
- 裸域 HTTP/HTTPS 请求均经 301 到 HTTPS www；保留 `/`、`/zh/`、`/ja/`、实验/讲解路径与查询，不循环、不出现 5xx。www 的 HTTP 到 HTTPS 同样保持路径与查询。
- 未知页面与缺失资源返回 404，正式页面没有 noindex 响应头，HTML canonical/hreflang 指向正式域名。
- robots.txt、包含 21 个内容地址的 sitemap.xml、分享图片和地球贴图正常；哈希资源长缓存，HTML 可更新。
- 检查 Git 推送触发生产发布；发生故障使用 Workers 的 Version History 回滚到此前已验证版本。

Search Console 的域名验证、sitemap 提交与线上性能测量单独验收；构建成功不表示搜索收录或网络性能已经达标。

## 官方参考

- [Static Assets 入门](https://developers.cloudflare.com/workers/static-assets/get-started/)
- [HTML 路由](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [静态站点与 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [响应头](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [构建设置与环境变量](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [构建工具版本](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [生产与预览分支](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

## 首次发布记录（历史）

- Worker：`feynman`，Custom Domain：`feynman-technique.com`，HTTPS 首页及三语言深链接可访问。
- 发布时间：2026-10-11 04:39:39 UTC，版本：`3a0906aa-cd8c-482c-abc4-ece29df9f4ee`，100% 流量，Source=Upload。
- 来源：基线 `27aa030090fe8ec98fd5d601764d610453b8d2d3` 加当时未提交的 SEO/Workers 工作树；源码现随本版本纳入 Git，首次部署的 Source 仍为 Upload，不是 Git 构建。
- 本地检查：39 项单元测试、50 项 Workers 浏览器检查通过；4 项桌面尺寸测试在手机项目按规则跳过；build、dry-run 通过。
- 线上检查：27 个 HTML 与本地产物一致；sitemap 24 页；四个 HTML 别名重定向正确；入口 JS/CSS、分享图和地球贴图内容一致；未知页面与缺失脚本为 404；哈希资源 immutable，正式页面无 noindex 响应头。Chrome 线上检查三个实验的参数控件、两个动态案例播放/重置和日语语言导航，无 pageerror。
- 待完成：Workers Builds 关联、可选 www 重定向、Search Console。

前轮发布时网站公开、源码私有，并移除了源码/贡献链接与个人署名。后续仓库公开及 GitHub 投稿入口变更见本轮记录；个人署名仍不展示。当前生成 24 页 HTML，sitemap 21 页；下次 Git 自动构建关联需使用此版本配置。

## 公开信息清理发布

2026-10-11 通过本机 Wrangler 更新同一个 Worker，版本 `19e1445e-0cdb-4c47-a96d-9ab7121ed3a5`。本次 24 页 HTML、21 页 sitemap、公开目录、入口 JS/CSS、图片和三语言旧贡献页 404 已线上核对。相同源码随本版本 commit/push 保存；该次上传仍为本地 CLI 上传，没有因此连接 Workers Builds。审查对象与验证范围见 [本轮复核](../tooling/ai-review/2026-10-11-private-site.md)。

## www 主域名与 SEO/GEO 发布记录

维护者明确指定 www 为主域名，并授权 Agent 使用本机 Cloudflare 授权自行操作。2026-10-11 06:08:33 UTC，通过本地 Wrangler 发布同一个 Worker，版本 `4ca80440-735c-4088-8f2d-deb9a90020a2`，100% 流量；控制台来源为 Wrangler（CLI 部署列表将来源显示为 Unknown/deployment），并非 Git 构建。来源为基线 `7f8e0d552ca2036163013dbd0af46dbdaae47433` 加本轮未提交工作树，没有提交或推送。

- www Custom Domain 已绑定，HTTPS 可用；裸域保留原有代理 DNS/TLS 绑定，仅承担跳转入口。
- Zone Single Redirect `裸域永久重定向到 WWW`（规则 ID `d18d0603f7f34d389a75024c465b3775`）活动，匹配与目标表达式如上，301，保留查询字符串。14 个 HTTP/HTTPS 裸域请求覆盖三语言首页、实验/讲解、缺失资源及编码查询参数，均一次 301 到 HTTPS www。www HTTP 到 HTTPS 也为 301。
- 24 份线上 HTML（含三个 noindex 404 静态资源）与本地一致；比较时只扣除 Cloudflare 注入的 Web Analytics beacon 脚本。21 个 sitemap URL、robots、目录 JSON、分享图核对通过。实际未知路径、缺失脚本与三语言旧贡献页返回 404；正式内容没有 noindex 响应头。
- Chrome 线上检查三个实验参数、动态案例单步/播放/重置、日语导航与 canonical，以及中文手机首页，无 pageerror。浏览器退出等待停滞后仅终止本次测试进程，不把该清理动作作为产品验证。
- 本机 curl 的新 www HTTP 域名解析短暂失败；公共 DNS/Google DNS 已返回正确 A 记录。www HTTP 验收使用该公开 A 记录的 `--resolve`，HTTPS 与浏览器正常访问。该检查不等于所有地区 DNS 都已刷新。
- 控制台当前仍提示连接 Git 仓库，Workers Builds 尚未关联；保持现有本地生产发布方式。旧裸域首次上线与性能样本保留真实历史，没有改写成 www 性能数据。

本地验证及限制见 [本轮复核](../tooling/ai-review/2026-10-11-seo-geo.md)。Search Console 的域名验证、www sitemap 提交和 Google 选定 canonical 待完成。

## Search Console HTML 验证文件发布

维护者提供 `google845b412e18b99e6e.html`，用于 `https://www.feynman-technique.com/` 的网址前缀属性验证。原始 53 字节不作修改，保存至 `frontend/public/`，构建复制验证通过。通过同一个 Worker 发布，版本 `7af3a770-2b69-4b3d-b0fe-973ab3721cd2`；仅上传一个新静态资产。来源为 `d38c74a20cd25e50a93dc6e264b67aa49ac75002` 加本次验证文件工作树，源码与记录随后保存到 Git。

线上 `https://www.feynman-technique.com/google845b412e18b99e6e.html` 返回同域 307 到 `/google845b412e18b99e6e`，最终 200，正文与下载文件逐字节一致，未注入统计脚本。英文、中文、日文首页仍为 200，缺失脚本仍为 404；sitemap 保持 21 个内容网址，不加入验证文件。Google 支持此种同域重定向，依据见 [SEO 文件验证说明](SEO.md#search-console-html-文件验证)。

已完成文件发布和可访问性核对，尚未得到 Google 所有权验证结果。维护者返回 Search Console 点击“验证”，成功后提交 www sitemap；后续构建继续保留原验证文件。

## GitHub 贡献入口发布（2026-10-11）

维护者明确授权仓库改名为 `geoochi/feynman-technique`、改为公开并开放 Issue/PR 贡献。本地 remote 已同步新名称；Cloudflare Worker 仍为 `feynman`，两端域名与 301 规则不变。

本机 Wrangler 上传版本 `d95e4c0d-f7eb-49e5-bc8d-e66ef4b33dc9`，部署时间 `2026-10-11T09:32:33Z`，流量 100%。该次上传来自基线 `8b5dee0` 加本轮已验证工作树，不是 Workers Builds 的 Git 构建。三语言首页加入实验提案、PR 和贡献指南，目录、讲解、实验导航加入 GitHub；仍为 24 页 HTML 与 21 个 sitemap URL，Google 验证文件保留。

24 页线上 HTML 已与本地产物核对（只扣除平台注入的统计脚本）；robots、sitemap、公开目录与分享图一致，未知资源和 /contribute 返回 404，14 组裸域路径/查询参数重定向均为 301。检查与审查范围见 [本轮记录](../tooling/ai-review/2026-10-11-community.md)。Git 自动构建仍待关联，后续连接时选择新仓库名称。


## MIT 正式授权（2026-10-11）

维护者明确授权原创代码、讲解、文档与图示采用 MIT，正式条款为根目录 LICENSE。构建自动将它复制为 dist/LICENSE.txt 并随网站分发；根目录文件为唯一正式来源，不手动维护第二份条款。第三方依赖、字体和 NASA 贴图继续使用自身许可/使用条件，来源通知随产物保留。许可变化不增加网页或 sitemap URL。

本轮已通过本机 Wrangler 发布同一个 Worker，版本 `8dd640d1-11ec-4719-8070-51be2994705d`，创建时间 `2026-10-11T09:40:22Z`，流量 100%。上传来源为 `910ffde` 加本轮已验证工作树，仍不是 Git 自动构建。24 份线上 HTML、LICENSE.txt、THIRD_PARTY_NOTICES.txt、目录、robots、sitemap 和入口 JS/CSS 与本地一致；三个案例 code/content 均为 MIT；sitemap 保持 21 页。未知资源与 /contribute 返回 404，裸域 301 保留路径与编码查询参数。[本轮复核](../tooling/ai-review/2026-10-11-mit.md)

## 2026-10-13 Next 迁移发布准备（未发布）

默认 pnpm build 产物改为 out，Wrangler 的 Worker 名称、www/裸域绑定、HTML 规则与真实 404 不变；只交付静态文件，无 Next 运行服务器。缓存仅覆盖 /_next/static/* 的哈希资源，RSC 文本与 HTML 可更新。完整 out（含 RSC/segment 文件）作为同一版本上传，不能只复制 HTML 或使用 next start。GitHub Builds 尚未关联，推送仍不会更新官网。

发布前复查 Next 安全补丁、确认最终源码/审查范围及回退版本，重新完成冻结安装和生产构建；不要上传 noindex 预览产物。上一正式验收对应版本继续保留在本文件历史中，但回退候选是否仍可用需发布时在平台核实。获得发布授权后上传同一 Worker，随后核对正式域名、裸域 301、21 个内容 URL、3 个语言错误页、RSC/资源/验证文件、robots/sitemap 与交互。本文既有线上验收均为历史，不算本次 Next 上线验收。
