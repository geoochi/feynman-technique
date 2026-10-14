# Feynman Technique · 代理工作约定

更新：2026-10-13。本文件是 AI 代理与维护者在仓库中的工作入口；先阅读本文件，再按任务阅读相关文档。当前会话中用户的明确要求优先。新决策须同步相关文档，避免已废弃方案再次出现。

## 1. 项目定位与当前基线

项目帮助学习者通过可操作的可视化实验理解知识，并通过 GitHub 提交自己的学习案例。长期推进顺序与验收条件见 [开发路线图](docs/ROADMAP.md)。路线图中的候选能力不代表已经实现，也不自动授权实施或外部操作。

- 官网：[www.feynman-technique.com](https://www.feynman-technique.com)。裸域 `feynman-technique.com` 301 永久跳转到 HTTPS www，保留路径与查询参数。
- 仓库：`geoochi/feynman-technique`，已获维护者授权公开；默认分支 `main`。不擅自改变可见性、许可或仓库钩子。
- 原创代码、讲解、文档与图示采用根目录 [MIT 许可证](LICENSE)。第三方依赖、字体和 NASA 地球贴图保留各自条款与来源，不纳入项目 MIT 授权。
- 已实现：Next.js App Router 静态导出前端、十八个案例（二次函数、导数与切线、单摆、地球昼夜、波的叠加、弹簧振子、凸透镜成像、纬度与昼长、积分与面积、单位圆与正弦波、驻波、折射与全反射、阻尼振动、受迫振动与共振、欧姆定律、串联与并联、电容充放电、自由搭建电学工作台）、三语言目录与讲解、搜索、参数/播放、结构化网表参数、最小共享运行时、构建预渲染、SEO 与 GitHub Issue/PR 入口。
- 已发布：Next 静态导出版本于 2026-10-13 发布到 Cloudflare Workers Static Assets，Worker 名称 `feynman`，当前来源 `298d44b`。最近正式验收记录见 [部署指南](docs/DEPLOYMENT.md)，不能把历史验收写成本次重新验收。
- 尚待完成：Workers Builds 的 GitHub 关联、真实设备与性能预算验证、独立教学审阅、首个外部贡献案例。独立 SDK/CLI、电学工作台、Worker/WASM、历史版本归档均未实现。
- 当前由本机构建并通过 Wrangler 上传；`git push` 只保存源码，不自动更新官网。维护者已确认提交 sitemap，尚不能据此声称已收录或产生搜索效果。

## 2. 文档分工与开始工作

| 文档 | 用途 |
| --- | --- |
| [README](README.md)、[中文](README.zh-CN.md)、[日文](README.ja.md) | 面向普通读者，介绍产品、体验与贡献入口；英文为主，开头链接中日文 |
| [ROADMAP](docs/ROADMAP.md) | 长期目标、优先级、阶段成果与推进条件 |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | 技术结构、构建与浏览器运行、发布边界 |
| [文档入口](docs/README.md)、[历史归档](docs/archive/README.md) | 当前指南导航与已完成的方案、旧工具链和阶段记录 |
| [DEVELOPMENT](docs/DEVELOPMENT.md) | 当前可执行命令、目录、构建校验与验证范围 |
| [VISUAL_SPEC](docs/VISUAL_SPEC.md) | 视觉与布局基线、固定状态截图验收 |
| [CONTRIBUTING](CONTRIBUTING.md)、[案例协议](docs/CONTRIBUTING_DESIGN.md) | 投稿方式、文件要求、教学与科学审查 |
| [SEO](docs/SEO.md) | 索引与元信息规则、已确认状态及搜索观测待办；首轮计划已归档 |
| [DEPLOYMENT](docs/DEPLOYMENT.md)、[性能基线](docs/PERFORMANCE_BASELINE.md) | 发布配置、历史线上验收、测量方法与局限 |
| [本地 AI 审查](tooling/ai-review/README.md) | 审查方法与绑定具体版本的历史记录 |

开始时检查 `git status --short`、当前分支、HEAD 与相关代码；保护用户已有改动。以实际文件和外部状态为依据，不凭旧对话推断当前部署或授权。既有明确授权继续适用，不重复请求；授权不清楚的外部操作才询问。

## 3. 架构与技术边界

- 保持纯前端静态部署；不默认增加后端、登录、账户同步、数据库、ORM、CMS、Serverless Functions、请求时 SSR 或运行时 AI 接口。
- TypeScript + React + Next.js App Router 静态导出；CSS Modules + 限定作用域的 CSS Variables；二维使用 SVG/Canvas，三维使用 Three.js/React Three Fiber，公式使用 KaTeX。
- 前端已迁移到 Next.js App Router 静态生成，历史方案见 [迁移归档](docs/archive/2026-10-13-nextjs-migration.md)，当前操作见 DEVELOPMENT/DEPLOYMENT。默认 dev/typecheck/build/preview 统一为 Next/out；旧 Vite 入口与预渲染器已退出。科学计算、静态部署和案例协议边界继续适用；本地完成不代表已经更新官网。
- 科学模型优先纯 TS；重任务有实际需要时使用 Web Worker。它用于避免阻塞 UI，不会自动加速算法，也不是不可信代码的安全沙箱。Rust/WASM 只在测量证明必要时引入。
- Git 中的案例源码和讲解是唯一正式内容来源。PR 本身就是前端变更，不另行复制到数据库、大文件或隐蔽内容源。
- 只从构建枚举的可信 import 映射加载案例；不根据外部 URL 拼接可执行模块。按案例加载模型、纹理、三维资源，不塞入首页首包。
- 构建负责生成 HTML/CSS/JS/JSON 等文件；实验计算在访客浏览器执行。改参数不调用计算服务器，也不触发重新构建。
- 不添加 GitHub Actions、`.github/workflows`、webhook 服务、AI 审查后台或第二套生产发布通道。`.github` 可用于 Issue/PR 模板和基于真实维护者的 CODEOWNERS。
- 选依赖时核对官方文档与实际兼容性，固定工具链、直接依赖和 lockfile。密钥不能进入仓库、浏览器 bundle 或 `VITE_*`；未知 PR 先检查脚本和依赖，再在不带生产凭据的隔离环境验证。

## 4. 案例、科学模型与状态

- 案例放在 `frontend/examples/学科/slug/`。稳定 id/slug、manifest、参数/快照 schema、独立模型、view、独立 controller/Readouts、formulas.json、三语言 labels/讲解、预设、测试、封面与 ATTRIBUTION 由构建扫描校验；新增案例通常不改中心路由。
- 讲解按问题、预测、操作、观察、解释、验证、延伸组织，保留七章稳定 id；一个案例回答一个明确问题。只使用自有或获许可的内容，记录参考依据、素材来源、模型假设、单位、适用范围与误差。
- 计算模型与 React、DOM 和绘图分离。使用已知解、边界、守恒量、单调关系或收敛性验证，不用截图或重复实现本身的测试证明公式正确。
- 模拟时钟与渲染帧率分离，明确积分与步长；隐藏页面不积压补跑。高频更新留在运行时，React 订阅必要的低频摘要；卸载释放事件、Worker、纹理、几何体和渲染资源。
- 快照包含案例版本、参数、seed、时间、必要内部状态与相机；恢复前校验版本、边界与大小。只存参数不足以恢复有历史依赖的实验。运行时保留完整快照接口，实验页不提供导入导出。
- 语言、主题和视角变化不能改变科学参数或重置实验。语言不进入模型或快照，不复制三份模型，不调用在线翻译。
- 原创投稿采用 MIT 并保留真实署名；第三方材料继续遵守自己的条款。未完成独立教学审阅的案例保持 experimental，不编造审阅者、日期或效果。

## 5. 三语言、SEO 与公开信息

- 默认 `en`，英语沿用原路径；`zh-CN` 使用 `/zh/`，`ja` 使用 `/ja/`。顶部使用一个 English / 中文 / 日本語 下拉框；无 JavaScript 时提供语言链接。
- 公共文案位于 `frontend/packages/i18n`，案例文案位于 `labels.ts`；manifest schemaVersion 为 2，可见元数据与参数 labels 三语言完整，讲解分别维护。切换语言保留参数、时钟、模型内部状态与播放状态。
- 正式主域名来自 `frontend/site.config.ts`。`packages/seo` 共用页面枚举与元信息，静态 HTML 和客户端切换同步 title、description、绝对 canonical/hreflang、分享标签与真实 JSON-LD。
- 实验与讲解各自 canonical，每语言指向自身。manifest 可选 seo.experiment/seo.lesson，配置时三语言 title/description 必须完整且非空；未配置页面独立使用默认规则。讲解 H1 后提供核心答案，有实质正文时可使用问题式 H3，摘要不回填实验页。
- 404/未知页与预览 noindex；`SITE_INDEXABLE=false` 不输出 sitemap。新增页面同步预渲染与 sitemap 枚举，不伪造日期、评分、排名或 AI 引用效果。
- 网站保留 GitHub 导航与首页三语言 Issue/PR 投稿区；贡献指南在仓库维护，三语言 `/contribute` 仍返回 404 且不进入 sitemap。
- 卡片、浏览器目录和 JSON-LD 省略个人作者；源码 manifest 与 ATTRIBUTION 保留真实署名。根目录 LICENSE 与第三方法定许可通知随构建分发，公开目录过滤不得删除必要版权声明。

## 6. 视觉与交互约定

详细尺度以 VISUAL_SPEC 和已确认画面为准。目录使用浅色网格与切角卡片；现有实验为暖纸浅色界面，地球自身保留昼夜明暗；封面和无 WebGL 示意图使用浅色背景。不恢复黑金页面方案。电学深色仪表盘仅是后续计划。

- 桌面：最左侧简介与 1–3 个以问号结尾的问题，中央主图，右侧统一控制及其下方 Readouts。手机按主图、控制、读数、介绍重排；不能把读数重新堆到主图下方或独占一列。
- 实验问题由 lesson 的 problem 章节维护；完整七章讲解在独立笔记页。实验页不显示学习目标/适用条件、检验理解、依据来源区块或七步导航，主图底部只留简短声明。
- 动态实验仅保留播放/暂停、单步、重置、模拟时间、实验参数和重置参数；固定 1×，不显示快速探索、倍速、视角缩放或状态导入导出。操作讲解给出实际参数值。
- 播放区“重置”保留当前参数、回初始状态并暂停；“重置参数”恢复全部 schema 默认值并暂停。两者都不显示成功提示。
- 参数标签为当前语言说明加括号内的公式变量，保留数字输入和单位。二次函数稳定 id/slug 不变，`playback = false`，不显示播放、时间、暂停状态或扫描点，也不启动动画时钟。
- 单摆改变摆长必须在同一视口下按比例改变图形，不能自动取景抵消差异；只显示小角度周期，单位质量能量函数保留用于模型验证。
- 地球用正交视图容纳地球与三条完整太阳光箭头；箭头等长、平行、等距、末端对齐，随赤纬整体旋转，手机不能裁切。入射方向与 shader 太阳方向互为反向。
- 地表使用本地按案例加载的 NASA Blue Marble 2004 年 7 月 2048×1024 WebP，保留来源和条件；不恢复虚构陆地，不宣称实时天气。纹理失败或 WebGL 不可用时保留静态说明、参数与读数。
- 保留键盘、可见焦点、减少动效支持，信息不能只靠颜色。先校准字体、容器、网格和组件尺寸，再调整相机、材质与动效；手机需重新组织布局。
- 截图固定浏览器/系统、视口、DPR、缩放、语言、字体与实验状态；CSS 像素和物理像素分别记录。3D 偏差结合 GPU、抗锯齿、色彩与光照核实，不扩大遮罩掩盖问题。
- 不在文档、代码、注释、文件名、提交消息或测试样本中重新引入已移除的外部参考项目名称、域名和构建链接。技术查证使用相关官方文档。

## 7. 本地开发、验证与审查

Node 24.x（固定基线 24.11.1）、pnpm 12.10.1；命令在 `frontend/` 执行，实际脚本以 package.json 为准：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm check:lab
pnpm build
pnpm test:e2e
```

`pnpm test` 与 `pnpm check:lab` 均生成并校验清单、运行单元检查；没有独立 SDK/CLI、create:lab 或 --lab 筛选。浏览器检查使用 Google Chrome。生成目录、public 目录/索引/封面/许可证副本、.next/out、测试报告和依赖不提交。

| 改动 | 按影响选择验证 |
| --- | --- |
| 文档、工作约定与路线图 | 检查事实、链接、Markdown、命令示例和相关文档一致性；无需重跑重型实验 |
| 讲解、翻译、manifest | 清单/类型/构建检查；按涉及页面复验静态正文、多语言与 SEO |
| 科学模型或共享运行时 | 数值、边界、状态与受影响案例检查，再验证相关交互 |
| 页面、绘图或样式 | 构建、相关浏览器交互、桌面/手机与三语言视觉检查 |
| 域名、部署或生成流程 | 本地构建与实际平台路由、产物、索引和上线验收 |

AI 审查阅读 diff、模型/依赖、讲解/引用、实际检查结果与必要截图；记录目标 commit SHA，有未提交文件时说明工作树范围。问题给出位置、证据、影响与建议，未知项注明未核实。修复、rebase、更新基线或新增提交后复核最终结果；超时、不可用或不完整不得写成通过。独立教学审阅、本地工程检查和线上验收分别报告。

## 8. Git 与发布

维护者已明确给予本仓库持续授权：每次完成工作区修改及相称验证后，自动 commit 并 push 到已核对的远端与工作分支；涉及网站代码、内容、素材、依赖、构建或发布配置的改动，随后自动构建、部署到现有 feynman Worker 并完成线上验收。仅仓库说明、归档和工作约定的修改提交并推送即可。此约定持续有效，除非维护者明确暂停或撤销，不再逐次请求确认。

自动提交只包含当前任务的改动，保护维护者已有无关修改；检查暂存 diff、凭据、依赖、缓存、构建产物和临时文件，保留用户为主作者，不重写已推送历史。检查、推送或部署失败时修复或明确报告实际阻塞，不能记录为完成。合并、账号权限或其他外部操作继续按具体授权执行。

每次提交必须包含独立 trailer：

```text
Co-authored-by: Codex <noreply@openai.com>
```

提交前检查仓库级 `core.hooksPath=.githooks`；新克隆仅在本仓库执行 `git config --local core.hooksPath .githooks`，不改全局配置。commit-msg 钩子应幂等并保留其他共同作者；即使未启用也须主动补齐，不使用 `--no-verify`。提交后用 `git log -1 --format=full` 核对作者与 trailer；网页端合并/squash 同样检查最终消息。推送核对远端与分支。

- Worker 交付静态资源，不添加应用脚本/后端。配置为 `frontend/wrangler.jsonc`，目录 out、auto-trailing-slash、404-page，不添加 SPA 回退；缺失脚本/JSON/模型返回 404，哈希资源可长缓存，HTML 允许更新。
- Wrangler 保留 www 与裸域两个 Custom Domain；裸域绑定维持代理 DNS/TLS，Zone Redirect Rule 在资源交付前执行 301，不能仅删裸域绑定破坏入口。
- 接入 Git 前：构建 → Wrangler 上传同一个 Worker。完成关联后统一用 Workers Builds：仓库 `geoochi/feynman-technique`、根目录 frontend、生产分支 main、构建 `pnpm build`、部署 `pnpm deploy:workers`，按 DEPLOYMENT 固定 Node/pnpm。
- 非生产分支预览不是正式发布，平台不知道本地 AI 是否已审查；由维护者确认目标版本。需要额外自动化时先依据具体需求，不凭未来假设增加。
- 发布后确认部署对应源码、正式 URL、深链接、资源、301、真实 404 与 SEO；本地成功和平台构建成功分别核实。故障按平台机制恢复已验证部署，不能以盲改掩盖错误。

## 9. 每次工作的收尾

1. 确认结果满足本次要求并保持既有边界，更新受影响的状态说明与路线图。
2. 完成相称的验证，明确实际范围、结果、限制和未核实项，不伪造命令、数据、审阅者或链接。
3. 检查暂存内容和敏感信息，按持续授权自动提交、核对署名、推送并验证远端；涉及网站的改动自动发布并另行验收。部署后补充的纯文档记录只需提交推送，避免循环部署。
4. 汇报文件、完成状态、检查与必要用户事项；区分建议、已实现、已验证与已部署。历史记录保留当时事实，当前说明不得沿用旧结论。
