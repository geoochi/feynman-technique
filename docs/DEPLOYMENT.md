# Cloudflare Workers 静态部署

更新：2026-10-13。当前正式主域名：`https://www.feynman-technique.com`，裸域 301 到 www。Next 静态迁移已发布并通过线上验收，当前来源 426c88f（实验扩展 01–13），版本与检查见文末；更早的历史发布记录保留。GitHub 自动构建关联尚未完成。

## 当前实际流程

当前源码由本机 pnpm build 生成 Next 静态 out，再由本机 pnpm deploy:workers（Wrangler）上传到 Cloudflare；2026-10-13 已按这一方式发布。Cloudflare 负责持有、分发线上资源；网站不运行在本机，关闭本机不影响访问。git commit/push 只保存源码，尚不自动触发部署。完成 Workers Builds 的 GitHub 关联后，生产分支推送事件才会触发 Cloudflare 构建并发布；不用另写自定义 webhook 或 GitHub Actions。

维护者已持续授权代理在每次修改验证后自动 commit/push；网站代码、内容、素材、依赖及构建/发布配置改动再自动执行构建、Wrangler 部署与线上验收。纯仓库文档改动只提交推送，部署记录的文档提交不循环触发部署。当前自动执行由代理完成，Workers Builds 的 Git 关联仍待实施；详见 [工作约定](../AGENTS.md#8-git-与发布)。

## 部署方式

使用 Next.js App Router 静态导出，Workers Static Assets 交付 `frontend/out`；不添加 Worker 应用脚本、SSR、数据库或存储服务。科学计算仍在访问者浏览器运行。配置位于 `frontend/wrangler.jsonc`，Wrangler 固定为 4.149.0。

`auto-trailing-slash` 将 `labs/pendulum.html` 提供为 `/labs/pendulum`，将 `zh/index.html` 提供为 `/zh/`，别名自动重定向。`404-page` 对未知页面使用最近的语言目录 404 文件并返回 HTTP 404；缺失脚本也返回 404。不设置全站 SPA 回退。`public/_headers` 提供哈希资源长缓存、nosniff 和 workers.dev 的 noindex 响应头。正式配置关闭 workers.dev 与版本预览 URL。

## 已授权的本地发布

先核对 Cloudflare 中该域名所在的账户、Zone 是否 Active，以及 www 与裸域是否已有其他网站/DNS 记录。若存在其他用途，先处理冲突，避免覆盖。Wrangler 的 Custom Domain 配置会创建域名绑定和相应 DNS/证书，无需填写服务器 IP。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm typecheck
pnpm check:lab
pnpm build
pnpm test:e2e
pnpm exec wrangler deploy --dry-run
pnpm exec wrangler login
pnpm exec wrangler whoami
pnpm deploy:workers
```

`wrangler login` 使用浏览器 OAuth；不要将 API Token、密码或 OAuth 凭据提交到 Git 或发到聊天中。若登录账号有多个账户，先确定域名所在账户，再通过本机 `CLOUDFLARE_ACCOUNT_ID` 指定。部署对象为 `feynman`；发现同名现有 Worker 时先核对用途。

Wrangler 上传更新同一个现有 Worker，不代表 Git 自动发布已经关联。没有 Cloudflare 授权时，构建和 dry-run 可完成，实际上传不能完成。

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

2026-10-11 已完成域名切换。后续重新配置时遵循以下顺序，避免先撤掉现有入口：

1. 为现有 `feynman` Worker 添加 `www.feynman-technique.com` Custom Domain，等待 www 的 HTTPS 证书可用，先确认页面及深链接可访问。不要在 www 上配置转向裸域的规则。
2. 裸域保持代理 DNS（橙云），确认其 HTTPS 证书有效；在域名的 Redirect Rules 中新增 Single Redirect，条件为 `(http.host eq "feynman-technique.com")`，动态目标为 `concat("https://www.feynman-technique.com", http.request.uri.path)`，状态码 **301**，启用 **Preserve query string**。规则覆盖裸域的 HTTP 与 HTTPS；既有 Always Use HTTPS 可能先增加同域跳转，验收最终必须到 HTTPS www，且每个迁移跳转为 301。
3. 配置裸域跳转并验证后，再按授权发布本次 www SEO 产物和目标 Wrangler 配置。当前配置保留 www 和裸域的 Custom Domain；裸域绑定仅保留代理 DNS/TLS，由 Zone Redirect Rule 在静态资源交付前返回 301，不作为内容站。保留该绑定可避免后续 Wrangler 发布误删裸域 DNS。若以后改用纯跳转 DNS，应先保证接收入口，再按 Cloudflare 官方方案使用代理 A 记录 `@ → 192.0.2.1`；无需服务器 IP，不修改 MX/TXT 等其他用途记录。
4. 若 Workers Builds 或本机构建环境已有 `SITE_URL`，改为 `https://www.feynman-technique.com` 或删除旧覆盖值，重新构建。正式产物的 canonical、hreflang、分享 URL、JSON-LD、robots 与 sitemap 都必须使用 www；本次代码默认值已修改，但环境变量会覆盖它。
5. 完成后在 Search Console 提交 `https://www.feynman-technique.com/sitemap.xml`，检查 www 首页、三个实验及讲解页，并抽查中文/日文。旧裸域网址应是跳转入口，不能继续作为内容页 canonical。

2026-10-11 配置时，Wrangler OAuth 可管理 Worker/Custom Domain，但 DNS Records 与 Rulesets API 返回 403。维护者随后授权 Agent 自行操作 Cloudflare，Agent 通过本机已登录 Chrome 控制台部署 Redirect Rule，使用现有 OAuth 绑定 www 并上传静态产物；无需新增令牌或扩大权限。Custom Domain 管理与纯跳转 DNS 的关系须先核对实际状态，不能在旧绑定仍占用裸域时盲目覆盖它。

例子：`https://feynman-technique.com/zh/labs/pendulum?source=test` 应 301 到 `https://www.feynman-technique.com/zh/labs/pendulum?source=test`；对应 www 深链接直接返回 200。HTTP 裸域的最终目标相同。不要依赖前端 JavaScript 完成重定向。

具体动态表达式、查询保留与纯跳转 DNS 用法依据 [Cloudflare 官方重定向指南](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/)。

发布后核对：

- Workers 部署版本与来源；Git 构建须对应目标 commit SHA，首次本地上传的版本来源应与后续 Git 构建分别记录。
- www 主域名、三语言入口及实验/讲解深链接直接返回 200，`.html` 与尾斜线别名归一正确。
- 裸域 HTTP/HTTPS 请求均经 301 到 HTTPS www；保留 `/`、`/zh/`、`/ja/`、实验/讲解路径与查询，不循环、不出现 5xx。www 的 HTTP 到 HTTPS 同样保持路径与查询。
- 未知页面与缺失资源返回 404，正式页面没有 noindex 响应头，HTML canonical/hreflang 指向正式域名。
- robots.txt、包含 27 个内容地址的 sitemap.xml、分享图片和地球贴图正常；哈希资源长缓存，HTML 可更新。
- Git 自动构建关联后再核对推送触发发布；当前仍需手动上传。故障按平台 Version History 恢复此前已验证版本。

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

## 2026-10-13 Next 正式发布与验收

维护者明确授权自动提交、推送与部署。来源为已推送 main 的 `ccedbd2c374d2b1f36f0200850a7fc6855ee0fa7`，该提交重新构建的正式可索引 out 通过审计后由 Wrangler 上传。版本 `80b67878-c31f-447c-bca2-e22033a1e027`，部署创建于 `2026-10-13T06:40:54.285Z`（北京时间 14:40:54），100% 流量，tag 为 ccedbd2，消息包含完整源码 SHA。Worker 仍为 feynman，两个 Custom Domain 与 301 方向保留，Git 自动构建未关联。

21 个内容页面与 3 个语言 404 的线上 HTML 与本地一致；196 个非 HTML 资产含 JS/CSS/字体/纹理/目录/robots/sitemap/RSC 逐字节核对通过。Google 验证文件和 favicon 保留；14 个裸域请求 301、4 个别名 307 保留查询，9 个缺失页面/资源为真实 404。Chrome 桌面/手机模拟下三实验、语言状态/播放、静态导航及三语言无 JS 讲解通过。首轮资源请求超时后完整复验，未盲改配置。详细范围及限制见 [本次正式复核](../tooling/ai-review/2026-10-13-next-deployment.md)。

发布前平台核实旧版本 8dd640d1-11ec-4719-8070-51be2994705d，本次未回滚。依赖固定为 Next 16.4.0、Ajv 8.18.0、KaTeX 0.18.2；当前 production audit 无已知漏洞。Next 已预告 10 月 14 日安全更新，补丁与影响范围尚未公开，届时需复查。未重新测量线上性能、实体设备或搜索效果；部署记录的后续 Git 提交只更新文档，不改变上述静态产物来源。

## 历史记录

此前发布、域名切换、验证文件、社区入口及许可验收见 [初期部署历史](archive/2026-10-11-deployments.md)。日期明确的工程与生产复核继续保留在 tooling/ai-review。

## 2026-10-13 清理版本与自动发布

维护者明确给予持续自动 commit/push、网站改动自动部署的授权，已写入 AGENTS.md。清理源码 a35e6d4c5007db60479ce4ecdee03b9d2dbe75df 已推送 main；该提交重建的正式 out 通过 24 页审计后上传到同一 feynman Worker。

当前版本为 8d12ef67-3f27-4e4e-9f15-80e96c3abfca，部署创建于 2026-10-13T07:53:23.214Z（北京时间 15:53:23）、100% 流量，tag 为 a35e6d4，版本消息含完整源码 SHA。此前版本 80b67878-c31f-447c-bca2-e22033a1e027 保留历史，不算当前版本的重新验收。

本次正式复验：21 个内容页和 3 个语言 404 的 HTML 与产物一致；196 个非 HTML 资产含 RSC/segment、脚本/样式/字体/纹理、robots/sitemap 逐字节一致。18 个重定向、9 个缺失页/资源请求、Google 验证文件与缓存检查通过。Chrome 桌面/手机模拟下三个实验共 6 组语言/状态检查及三语言无 JS 讲解通过，无页面异常。原始材料归档到仓库旁的本机证据目录，详见 [清理复核](../tooling/ai-review/2026-10-13-repository-cleanup.md)。部署记录后续只提交推送，不再触发部署。

## 2026-10-13 导数与切线内容扩展发布

来源 `298d44ba9fb1f05a054ad44cb64fcc4537e1a8c6` 已推送 `origin/main`，固定 Node 24.11.1 / pnpm 12.10.1 从该提交重新构建并审计正式 out 后上传到现有 feynman Worker。版本 `61247a7c-3ed2-48c0-a70c-7f5d6fc094db`，部署创建于 `2026-10-13T08:18:38.963Z`（北京时间 16:18:38）、100% 流量，tag 为 298d44b，版本消息包含完整源码 SHA。上一版本 8d12ef67-3f27-4e4e-9f15-80e96c3abfca 保留，未执行回滚。两个 Custom Domain 不变，GitHub Builds 关联仍未完成。

新增第四个案例“导数与切线”，三语言实验/讲解均可直接访问，sitemap 为 27 个内容地址。正式复验 30 个 HTML（含 3 个语言 404）与本地产物一致，仅精确去除平台注入的 Cloudflare Insights 脚本后比较；223 个非 HTML 资源（包括 RSC/segment、JS/CSS、字体、纹理、封面、目录、验证文件和 robots/sitemap）逐字节一致。Next 特殊文件名按 URL 编码请求；未编码的 $ 会由平台返回 307 到编码 URL，此前检查脚本已修正，未改站点配置。

12 个 HTTP/HTTPS 裸域请求保留路径与查询并 301 到 HTTPS www；10 个缺失页面/脚本/JSON/模型及停用贡献页返回真实 404；2 个 HTML/尾斜线别名归一通过。哈希 JS 长缓存，实验 HTML 为 public, max-age=0, must-revalidate，正式页面无 noindex 响应头。

正式站 Chrome 桌面/手机模拟共 14 项检查通过：三语言新增实验的调参、零间隔、边界、重置与语言状态，关联讲解链接、搜索，全站无 JS 正文与 canonical/hreflang/JSON-LD。测试首次运行输出已完成逐项检查但未保留最终退出结果，恢复后完整重跑并确认 14 passed / exit 0，不以中断结果替代完成证明。

本轮未测量生产性能、实体设备或学习效果。独立教学审阅与母语审校待完成，案例保持 experimental。完整记录见 [本轮复核](../tooling/ai-review/2026-10-13-derivative-tangent.md)；后续发布记录提交仅更新文档，不再循环部署。

## 2026-10-13 实验扩展发布（01–04）

合并提交 `3a45196` 已推送 `origin/main`，由本机固定 Node 24.11.1 / pnpm 12.10.1 构建正式 out 后上传到现有 feynman Worker。版本 `f911d736-cf0b-44aa-8167-7b58a1bf2c88`，227 个文件上传，两个 Custom Domain（www 与裸域）不变。上一版本 `61247a7c-3ed2-48c0-a70c-7f5d6fc094db` 保留，未执行回滚。

新增四个案例：波的叠加（`physics.wave-superposition`）、弹簧振子（`physics.spring-oscillator`）、凸透镜成像（`physics.thin-lens`）、纬度与昼长（`geography.daylight-latitude`），均为三语言七章讲解。案例目录自包含，未修改任何中心路由或共享文件；并行开发所需的前置测试改造见提交 `36ded68`。

工程验证（本机）：`generate` 注册 8 个案例、`typecheck` 通过、单元测试 13 文件 102 项通过、`build` 输出 54 页（51 内容路由 + 3 个语言 404）且 SEO/正文边界/许可校验通过、Playwright e2e 128 通过 / 4 按设计跳过 / 0 失败。

线上验收：新案例 `/labs/wave-superposition`、`/zh/labs/thin-lens`、`/ja/learn/daylight-latitude`、`/labs/spring-oscillator` 返回 200；未知页 `/zh/labs/does-not-exist` 返回真实 404；裸域 `http://feynman-technique.com/labs/wave-superposition` 保留路径 301 到 HTTPS www；新案例 canonical 与 en/zh-CN/ja/x-default hreflang 正确；sitemap 为 51 个内容地址。

本轮未做实体设备与独立教学审阅；四个新案例保持 experimental。此发布记录为纯文档提交，不再循环触发部署。

## 2026-10-13 凸透镜绘图修复

反馈：凸透镜成像页没有坐标系，且改变物距时整张图会重新缩放。原因是绘图比例 `sx` 随参数（u、f、像距 v）自适应，违反「绘图不能用按当前参数自动缩放掩盖实验变化」。

修复（提交 `f430d5a`）：改为固定光学比例（横向每格 0.1 m、纵向每格 0.04 m），绘制带米制刻度的坐标系（网格、光轴、透镜平面、x/y 轴标注），像超出固定画面时给出提示；同步更新三语言说明文字，并新增回归测试 `tests/browser/thin-lens.spec.ts`（改变物距时固定参照不移动、物体移动）。

验证：`typecheck`、`build` 54 页与导出校验、Playwright e2e 130 通过 / 4 按设计跳过 / 0 失败。

发布：本机重新构建后上传现有 feynman Worker，版本 `16947142-5d34-4e6a-bb76-39666cd6bba8`，212 个文件上传，两个 Custom Domain 不变。线上验收：`/zh/labs/thin-lens` 与 `/labs/thin-lens` 返回 200；场景分块 `/_next/static/chunks/1_tk-ude5-2s_.js` 已更新（含 `y / m` 与「像超出画面」）。此记录为纯文档提交，不再循环触发部署。

## 2026-10-13 实验扩展发布（05、06、09、10）

合并提交 `0bfe35e` 已推送 `origin/main`，本机固定 Node 24.11.1 / pnpm 12.10.1 构建正式 out 后上传现有 feynman Worker。版本 `4fb6828e-139f-4c52-8c5c-622f85541ef2`，两个 Custom Domain 不变；上一版本 `16947142-5d34-4e6a-bb76-39666cd6bba8` 保留，未执行回滚。

新增四个案例：积分与面积累积（`math.integral-area`）、单位圆与正弦波（`math.unit-circle-sine`）、驻波与振动模式（`physics.standing-wave`）、折射与全反射（`physics.refraction`），均为三语言七章讲解。每个案例都使用固定比例的坐标系绘图，并自带 `tests/browser/<slug>.spec.ts` 回归测试（改变参数时固定参照不移动）。案例目录自包含，未修改任何共享文件。

工程验证（本机）：`generate` 注册 12 个案例、`typecheck` 通过、单元测试 17 文件 158 项通过、`build` 输出 78 页（75 内容路由 + 3 个语言 404）且 SEO/正文边界/许可校验通过、Playwright e2e 162 通过 / 4 按设计跳过 / 0 失败。

线上验收：`/labs/integral-area`、`/zh/labs/unit-circle-sine`、`/ja/labs/standing-wave`、`/labs/refraction` 均返回 200；sitemap 为 75 个内容地址。

本轮未做实体设备与独立教学审阅；四个新案例保持 experimental。此发布记录为纯文档提交，不再循环触发部署。

## 2026-10-13 实验扩展发布（07、08、11、12）

源码 `d7f0e74` 已推送 `origin/main`（含 W3 四个案例的合并与一处测试修复），本机固定 Node 24.11.1 / pnpm 12.10.1 构建正式 out 后上传现有 feynman Worker。版本 `21e35cb6-9636-4740-93f7-5055adad56bf`，两个 Custom Domain 不变；上一版本 `4fb6828e-139f-4c52-8c5c-622f85541ef2` 保留，未执行回滚。

新增四个案例：阻尼振动（`physics.damped-oscillation`）、受迫振动与共振（`physics.driven-oscillation`）、欧姆定律（`physics.ohms-law`）、串联与并联（`physics.series-parallel`），均为三语言七章讲解。每个案例都使用固定比例的坐标系绘图，并自带 `tests/browser/<slug>.spec.ts` 回归测试。案例目录自包含。

测试修复：`tests/browser/derivative.spec.ts` 原本把搜索「微分」的结果数硬编码为 1，新增的阻尼振动案例日文讲解含「微分方程式」使其变为 2；改为从生成的 catalog 派生期望数量。同类硬编码在更早的并行改造中已消除，仅此一处遗漏。

工程验证（本机）：`generate` 注册 16 个案例、`typecheck` 通过、单元测试 21 文件 231 项通过、`build` 输出 102 页（99 内容路由 + 3 个语言 404）且 SEO/正文边界/许可校验通过、Playwright e2e 194 通过 / 4 按设计跳过 / 0 失败。

线上验收：`/labs/damped-oscillation`、`/zh/labs/driven-oscillation`、`/labs/ohms-law`、`/labs/series-parallel` 均返回 200，未知页返回真实 404；sitemap 为 99 个内容地址。

本轮未做实体设备与独立教学审阅；四个新案例保持 experimental。此发布记录为纯文档提交，不再循环触发部署。

## 2026-10-13 实验扩展发布（13）

合并提交 `426c88f` 已推送 `origin/main`，本机固定 Node 24.11.1 / pnpm 12.10.1 构建正式 out 后上传现有 feynman Worker。版本 `a83b32dd-fab2-49d3-a853-2a72e7453e2d`，两个 Custom Domain 不变；上一版本 `21e35cb6-9636-4740-93f7-5055adad56bf` 保留，未执行回滚。

新增案例：电容充放电（`physics.rc-circuit`），三语言七章讲解。参数为电源电动势 E、初始电容电压 u₀、电阻 R、电容 C；模型用解析闭式 u(t) = E + (u₀−E)e^(−t/τ) 推进（τ = RC），因此没有步进误差，快照可精确恢复电容电压。绘图使用固定比例的坐标系（u–t 曲线、τ 标记与渐近线 E），并自带 `tests/browser/rc-circuit.spec.ts` 回归测试。

工程验证（本机）：`generate` 注册 17 个案例、`typecheck` 通过、单元测试 22 文件 242 项通过、`build` 输出 108 页（105 内容路由 + 3 个语言 404）且 SEO/正文边界/许可校验通过、Playwright e2e 202 通过 / 4 按设计跳过 / 0 失败。

线上验收：`/labs/rc-circuit`、`/zh/labs/rc-circuit`、`/ja/learn/rc-circuit` 返回 200，未知页返回真实 404；sitemap 为 105 个内容地址。

本轮未做实体设备与独立教学审阅；案例保持 experimental。此发布记录为纯文档提交，不再循环触发部署。
