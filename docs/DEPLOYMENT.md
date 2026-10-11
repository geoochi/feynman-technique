# Cloudflare Workers 静态部署

日期：2026-10-11。正式域名：`https://feynman-technique.com`。已完成 Cloudflare OAuth 授权、Active Zone 核对、Custom Domain 绑定与首次发布。GitHub 自动构建关联尚未完成。

## 当前实际流程

当前是本机 pnpm build 生成 dist，再由本机 pnpm deploy:workers（Wrangler）上传到 Cloudflare。Cloudflare 负责持有、分发线上资源；网站不运行在本机，关闭本机不影响访问。git commit/push 只保存源码，尚不自动触发部署。完成 Workers Builds 的 GitHub 关联后，生产分支推送事件才会触发 Cloudflare 构建并发布；不用另写自定义 webhook 或 GitHub Actions。

## 部署方式

保持 React + Vite 和构建时预渲染，Workers Static Assets 交付 `frontend/dist`；不添加 Worker 应用脚本、SSR、数据库或存储服务。科学计算仍在访问者浏览器运行。配置位于 `frontend/wrangler.jsonc`，Wrangler 固定为 4.149.0。

`auto-trailing-slash` 将 `labs/pendulum.html` 提供为 `/labs/pendulum`，将 `zh/index.html` 提供为 `/zh/`，别名自动重定向。`404-page` 对未知页面使用最近的语言目录 404 文件并返回 HTTP 404；缺失脚本也返回 404。不设置全站 SPA 回退。`public/_headers` 提供哈希资源长缓存、nosniff 和 workers.dev 的 noindex 响应头。正式配置关闭 workers.dev 与版本预览 URL。

## 首次本地发布

先核对 Cloudflare 中该域名所在的账户、Zone 是否 Active，以及根域名是否已有其他网站/DNS 记录。若存在其他用途，先处理冲突，避免覆盖。Wrangler 的 Custom Domain 配置会创建域名绑定和相应 DNS/证书，无需填写服务器 IP。

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

本地审查 → 维护者确认并更新 GitHub `main` → Workers Builds 自动构建和部署。Cloudflare Dashboard 中的 Workers & Pages 选择 `feynman`，在 Settings 的 Build 设置连接 `geoochi/feynman`，授权 Cloudflare GitHub 集成访问该私有仓库；新项目也可从 Import a repository 入口创建。保持仓库私有。

| 设置 | 值 |
|---|---|
| Worker 名称 | `feynman`，与 Wrangler 配置一致 |
| Git 仓库 | `geoochi/feynman` |
| 根目录 | `frontend` |
| 生产分支 | `main` |
| Build command | `pnpm build` |
| Deploy command | `pnpm deploy:workers` |
| Node 构建变量 | `NODE_VERSION=24.11.1` |
| pnpm 构建变量 | `PNPM_VERSION=12.10.1` |
| 构建公开地址 | `SITE_URL=https://feynman-technique.com`（与代码默认值一致，可不填） |
| 非生产分支构建 | 当前关闭 |

依赖按已提交的 pnpm lockfile 安装，静态资源目录由 Wrangler 的 `assets.directory` 指向 `dist`，无需设置 Pages 的输出目录或添加自定义 Worker 入口。平台构建授权留在 Cloudflare，不写入 `VITE_*` 或仓库。配置和 SEO 源码随本版本保存到 Git；连接 Git 构建时应选择包含这些配置的提交。GitHub 集成的账户授权需要由维护者完成。

当前 SEO 构建策略使用 Workers Builds 提供的 `WORKERS_CI` 与 `WORKERS_CI_BRANCH`：仅 `main` 可收录，其他分支或缺失分支 noindex 且不输出 sitemap。更换生产分支时同步更新 `scripts/site-config.ts` 和测试。私有演示构建使用 `SITE_INDEXABLE=false pnpm build`，随后正式发布前重新执行正常构建；不要上传残留演示产物。

## 域名与正式验收

Wrangler 配置绑定根域名 `feynman-technique.com`。DNS 接管不等于网站已经发布；须确认 Cloudflare Zone Active、Custom Domain 证书有效、实际页面能打开。维护者已在 Zone 的 SSL/TLS → Edge Certificates 开启 Always Use HTTPS；已实测 HTTP 返回 301 到 HTTPS，保留路径与查询参数。现有 Wrangler OAuth 不含 Zone Settings 编辑权限，此项由维护者在控制台完成。如需 `www`，在 Cloudflare 添加代理 DNS 与 Redirect Rule，将 `www.feynman-technique.com` 永久重定向到根域名并保留路径与查询；不要把它当第二个内容站点发布。

发布后核对：

- Workers 部署版本与来源；Git 构建须对应目标 commit SHA，首次本地上传的版本来源应与后续 Git 构建分别记录。
- 根域名、三语言入口及实验/讲解深链接直接返回 200，`.html` 与尾斜线别名归一正确。
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

当前网站保持公开访问、源码仓库保持私有；源码/贡献链接与个人署名已从公开页面及构建数据移除。当前生成 24 页 HTML，sitemap 21 页；下次 Git 自动构建关联需使用此版本配置。

## 公开信息清理发布

2026-10-11 通过本机 Wrangler 更新同一个 Worker，版本 `19e1445e-0cdb-4c47-a96d-9ab7121ed3a5`。本次 24 页 HTML、21 页 sitemap、公开目录、入口 JS/CSS、图片和三语言旧贡献页 404 已线上核对。相同源码随本版本 commit/push 保存；该次上传仍为本地 CLI 上传，没有因此连接 Workers Builds。审查对象与验证范围见 [本轮复核](../tooling/ai-review/2026-10-11-private-site.md)。
