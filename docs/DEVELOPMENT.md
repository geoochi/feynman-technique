# 本地开发与验证

日期：2026-10-11。当前为首期实现 v0.1.0，已通过 Workers Static Assets 首次发布；Git 自动构建关联尚未完成。

## 环境与命令

本地工具链基线：Node 24.11.1（frontend/.node-version）、pnpm 12.10.1。package.json 将生产环境限定在 Node 24.x；Workers Builds 用 NODE_VERSION=24.11.1、PNPM_VERSION=12.10.1 固定工具链。依赖全部固定直接版本并提交 pnpm-lock.yaml。pnpm-workspace.yaml 仅允许已检查的 esbuild 与 workerd 安装脚本（workerd 准备并验证平台二进制）；更改安装许可前先检查依赖脚本。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev                     # http://127.0.0.1:5173
pnpm typecheck
pnpm test                    # 模型、状态与构建校验测试
pnpm check:lab               # 校验所有案例并运行单元测试
pnpm build                   # 类型检查、Vite 构建、27 个静态 HTML 页面
pnpm preview --port 4173     # 查看产物
pnpm test:e2e                # 桌面/手机 Chromium 交互测试
pnpm preview:workers        # Workers 本地运行，需先构建
FEYNMAN_WORKERS=1 pnpm test:e2e # 用 Workers 本地路由验证产物
```

浏览器测试使用已安装的 Google Chrome（channel=chrome），不会在依赖安装时自动下载浏览器。其他机器先安装 Chrome，或自行调整 playwright.config.ts。测试产物在 test-results/，不提交 Git。当前没有 create:lab、--lab 筛选或独立发布 SDK。

开发模式仅将已注册的实验/讲解/贡献页面映射到开发入口，缺失资源不会回退为首页。要单独复验开发入口，可运行 FEYNMAN_DEV=1 pnpm exec playwright test --grep 'catalog|controls' --workers=1 --output=test-results-dev。

## 案例来源与构建

每个案例位于 frontend/examples/学科/slug，包含 manifest.json、parameters.schema.json、snapshot.schema.json、model.ts、view.tsx、labels.ts、model.test.ts、lesson.en.md、lesson.zh-CN.md、lesson.ja.md、presets.json、questions.json、preview.svg、ATTRIBUTION.md。模型没有 React、DOM 或绘图依赖。view.tsx 导出默认绘图组件、Readouts（公式与读数组件）和 model；两个组件接收同一份 ViewProps。课程壳负责介绍、主图和控制布局，案例不要再把公式、读数或控制放到默认绘图组件下方。

pnpm generate 只读取静态数据与文件，不执行案例模型。校验必填字段、id/slug 唯一性、元数据兼容版本、文件路径、1 MiB 单文件预算、数值参数默认值与预设、状态 schema、自测题、引用以及七章讲解。拒绝符号链接和越界文件。Markdown 经 sanitize-html 处理；封面只接受无脚本的本地 SVG。

生成 apps/web/generated/catalog.{json,ts}、registry.ts，以及 public/catalog.json、search-index.en.json、search-index.zh-CN.json、search-index.ja.json、previews/。这些文件不提交，开发与构建自动生成。新增案例不修改中心路由；新增或修改 manifest、讲解、预设后重新执行 pnpm generate 或重启 pnpm dev。当前支持英文、中文、日文、lesson 布局和有限数值参数，扩展协议需同时更新 schema 与实现。

生产构建为每种语言预渲染首页、贡献页、404、三个 labs 入口和三个 learn 讲解页，共 27 页。英语为默认语言，沿用现有路径；中文与日文分别增加 /zh/ 和 /ja/ 前缀，语言首页为 zh/index.html 与 ja/index.html，其余为 zh/labs/slug.html、ja/learn/slug.html 等。实验入口提供静态说明，加载后由客户端接管；学习页关闭 JavaScript 后仍能阅读。Workers auto-trailing-slash 提供不带扩展名的链接，不使用通配 SPA 重写。

SEO 域名由 site.config.ts 默认配置为 https://feynman-technique.com，可用公开构建变量 SITE_URL 覆盖。packages/seo 的页面枚举与元信息同时用于开发路由、预渲染、客户端语言导航和 sitemap；生产构建输出 robots.txt、包含 24 个内容页面的 sitemap.xml、每页绝对 canonical/hreflang、分享标签及 JSON-LD。404 noindex；开发、Workers Builds 非 main 分支或 SITE_INDEXABLE=false 的产物 noindex 且不输出 sitemap。实验入口静态正文包含核心问题。分享图已提交，修改其 SVG 后执行 pnpm generate:social-card，不作为生产构建依赖。完整规则与上线验收见 [SEO](SEO.md)。

公式与三维依赖只在相关实验加载。首批目录直接携带三个案例的文字元数据；案例库明显增长时可拆分讲解数据。共享渲染器尚未独立抽象，Worker/WASM 没有实际需求，未引入。

## 实验布局

语言由 URL 决定，顶部语言下拉框提供 English / 中文 / 日本語，关闭 JavaScript 时提供语言链接。公共 UI 文案由 packages/i18n 统一维护，案例绘图和读数文案由各自 labels.ts 维护。切换语言保留实验实例与播放状态；刷新页面重新初始化。数字输入标签取参数 labels[locale]，英文 title 用于原有参数校验错误；UI 边界错误按当前语言显示。七章使用稳定 id，快照版本与科学模型均不因翻译改变。构建缺少翻译时失败，避免混用中文讲解和其他语言界面。

桌面将标题、简介及 1–3 个以问号结尾的实验问题集中在最左侧。实验页移除学习目标与适用条件、检验理解、依据与来源三个区块，完整七章讲解仍可独立阅读。右侧框放实验参数与重置参数，参数标签用当前语言说明，并在括号内标注公式变量。动态案例另提供播放/暂停、单步、重置、模拟时间；二次函数只提供参数探索。公式与相关读数框紧接控制框下方，主图不再为读数单独留列；主图下只保留简短声明。播放固定为 1×，没有倍速、视角缩放或状态导入导出控件。画布随视口伸展，不固定在 320–350px。断点与主题见 VISUAL_SPEC.md。

单摆在固定视口和相机距离下按固定比例绘制 0.2–3 m，长度随摆长线性变化，图中有米刻度；改摆长不自动缩放视角。视角不进入科学计算。

## 模型与运行时

- 二次函数：纯函数 y = a(x − h)² + k；a=0 明确显示为常函数。只通过参数改变图像，不提供播放、时间或扫描采样点；稳定 id/slug 保持 math.function-transform / function-transform。
- 单摆：θ″ = −(g/L) sin θ，固定模拟步长 1/120 s，每步最多 1/240 s 的 RK4 子步；界面周期只表示小角度近似。初始角度输入显示度，内部为弧度。页面只显示小角度近似周期；单位质量能量函数保留用于模型守恒验证和完整讲解，不作为实验页读数。
- 昼夜：球形地球、固定太阳赤纬、平行光、24 小时太阳日；1 模拟秒代表 1 太阳小时。计算太阳高度和几何昼长，含极昼/极夜边界。场景采用赤道坐标，自转轴竖直、太阳方向随赤纬改变。地表使用 NASA Earth Observatory 的 Blue Marble 2004 年 7 月合成贴图，压缩为 2048×1024 WebP（272,086 字节），以 sRGB 读取并由 shader 计算光照；不代表实时天气。贴图经 Vite 哈希处理，仅进入昼夜案例时从本站加载，卸载时释放纹理；加载失败时显示静态示意并保留计算与参数。来源及使用依据见案例 ATTRIBUTION.md。页面、封面与 WebGL 2 不可用时的静态示意共用浅色背景，地球自身保留昼夜明暗，地轴与光线使用琥珀色。

运行时独立于渲染帧率：每次追赶最多采纳 0.1 秒墙上时间，隐藏页面丢弃积压；页面恢复不会补跑隐藏时段。高频模型状态保留在运行时，SVG 直接更新图形属性，R3F 每帧读取状态，React 摘要每 100 ms 更新。卸载释放帧循环、订阅与 R3F 场景资源。初始暂停，减少动效偏好不自动启动教学动画。

改参重新创建初始模型状态，并将模拟时间归零；播放区重置保留当前参数，回到初始状态并暂停。“重置参数”按 schema 恢复全部默认值、清除无效输入并暂停，从零时刻开始，不显示成功提示。快速探索下拉框已移除；仓库预设 JSON 仍可供案例数据校验和维护参考。相机缩放不修改科学参数。运行时上限 1,000,000 模拟秒，到达上限暂停。

“重置”和“重置参数”均不显示操作成功提示。

## 内部快照接口

地球场景采用正交相机，根据画布宽高调整取景。三条太阳光由等长圆柱与锥形箭头组成，共用随赤纬旋转的组；箭头方向与模型入射光方向一致，末端保持对齐。模型和时间积分不受取景变化影响。

运行时 snapshot() 返回的数据包含 labId、labVersion、sdkVersion、snapshotSchemaVersion、params、seed、simulationTime、internalState、camera、activeChapter。三个模型没有随机过程，seed 仍保留在协议中。activeChapter 保留用于兼容首版快照；当前实验页固定展示问题，不再提供章节切换。实验页没有快照导入导出入口，不上传状态。

运行时 restore() 先校验所有字段、版本、数值范围、状态 schema 和视角/章节，再原子恢复。失败不改变正在运行的状态；成功后保持暂停。文件选择、下载和 16 KiB 文件入口已随简化界面移除。内部快照不包含播放速度，页面固定为 1×；案例版本改变后明确拒绝旧快照，尚无旧版本档案或迁移器。

## 验证范围与限制

单元检查已包含：已知函数值与退化边界、小振幅单摆的解析近似、严格参数下 100 秒能量误差、积分收敛、周期缩放、春分与赤道太阳高度、极昼极夜、南北对称、完整状态续算与非法输入的原子拒绝。

Playwright 交互覆盖 1440×900、390×844，单摆布局补充 1920×1080、768×1024、5120×2580，DPR=1、浏览器 locale 为 zh-CN、Asia/Shanghai（站点 UI 覆盖英文、中文、日文）：目录筛选与搜索、三个深链接、单步/播放/暂停/重置、数字输入边界、默认参数恢复、摆长图形比例、核心问题、问题数量与问号、精简控制栏、无 JavaScript 讲解、缺失资源状态、无 WebGL 回退及页面溢出。控制栏检查包括没有倍速、缩放或状态导入导出入口。多语言检查覆盖默认英语、语言专属搜索、各语言直接深链接与静态讲解、参数边界提示、语言切换与历史返回时保留实验状态。截图属于本机人工检查材料，不是与外部设计图的像素一致证明。

首版（此次布局调整之前）2026-10-11 实测：Node 24.11.1、pnpm 12.10.1、macOS 27.0.1、Chrome 155.0.8059.40。25 项单元测试、16 项生产预览浏览器检查、8 项开发模式浏览器检查通过；类型检查与静态构建通过。生产预览还检查了案例 chunk 与课程壳 chunk 加载失败时的讲解/刷新提示。

首版产物：首页 JS 约 253.6 KB（gzip 80.2 KB），地球实验独立 chunk 约 885.0 KB（gzip 239.2 KB），后者超过 800 KB 构建警告线；没有提高警告线掩盖结果。该体积不代表实测帧率预算通过。字体与相应第三方许可通知随静态产物提供在 THIRD_PARTY_NOTICES.txt，不改变项目自身许可证。

尚未验证：真实手机触摸、完整键盘辅助技术、帧率/参数延迟性能预算、生产版本/网络地区表现、长期旧 chunk 保留机制。案例未经过独立学科维护者教学审阅。

此次布局改进复验：类型检查、静态构建与 25 项单元测试通过；生产浏览器检查 20 项通过（另外 4 项桌面尺寸矩阵在手机项目中按设计跳过），开发模式 8 项通过。检查包括公式排版、核心问题、主图尺寸、左右面板顺序和缩放不修改参数。1440/1920/768/390/5120 视口已检查布局与截图；没有建立像素差分基线。公式与读数框移到控制框下方后，复验类型检查、静态构建和 20 项生产浏览器检查通过；模型和运行时未变。

本轮参数修正：类型检查、静态构建与 22 项生产浏览器检查通过（4 项桌面矩阵在手机项目跳过）。桌面/手机实测摆长 0.5 m → 2 m 时屏幕绳长为四倍，重置参数后恢复 1 m、9.81 m/s²、15° 并暂停、时间归零；三个案例均检查所有默认值恢复与无效输入清除。

本轮问题精简：三个案例各显示三个以问号结尾的问题，删除实验页的辅助折叠区块，单摆仅显示小角度周期。类型检查、静态构建、22 项生产浏览器检查通过（4 项桌面矩阵在手机项目跳过）；模型与能量守恒测试未改动。

## Workers 发布配置

正式发布使用 Cloudflare Workers Static Assets；frontend/wrangler.jsonc 配置 dist、HTML 路由、真实 404 和自定义域名 feynman-technique.com。首次部署、GitHub 关联、工具链变量和线上验收见 [部署指南](DEPLOYMENT.md)。pnpm deploy:workers 上传已有产物，必须先运行 pnpm build。

本地最终审查后由维护者确认合并/推送，Workers Builds 负责后续自动发布。仓库不包含 GitHub Actions、应用后端、运行时 AI 或数据库。Cloudflare Workers 在此仅负责交付静态资源，与浏览器内用于计算的 Web Worker 不同。

Workers 部署复验：类型检查、27 页构建、39 项单元测试、Wrangler dry-run 通过；Workers 本地运行的 50 项浏览器检查通过，4 项手机项目中的桌面尺寸矩阵按设计跳过。正式 HTTPS 下逐字节核对 27 个 HTML 页面、入口 JS/CSS、分享图与地球贴图；sitemap 包含 24 页，四个 HTML 别名归一正确，未知页面/缺失脚本返回 404，哈希资源缓存正常。首次上传版本为 3a0906aa-cd8c-482c-abc4-ece29df9f4ee，来源为本地未提交工作树，不是 Git 构建。详见 [Workers 本地复核](../tooling/ai-review/2026-10-11-workers.md)。
