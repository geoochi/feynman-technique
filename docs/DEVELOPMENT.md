# 本地开发与验证

日期：2026-10-11。当前为首期本地实现 v0.1.0，尚未部署。

## 环境与命令

本地工具链基线：Node 24.11.1（frontend/.node-version）、pnpm 12.10.1。package.json 将生产环境限定在 Node 24.x；Vercel 会自行滚动更新补丁。依赖全部固定直接版本并提交 pnpm-lock.yaml。pnpm-workspace.yaml 仅允许 esbuild 的安装脚本；更改安装许可前先检查依赖脚本。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev                     # http://127.0.0.1:5173
pnpm typecheck
pnpm test                    # 模型、状态与构建校验测试
pnpm check:lab               # 校验所有案例并运行单元测试
pnpm build                   # 类型检查、Vite 构建、9 个静态 HTML 页面
pnpm preview --port 4173     # 查看产物
pnpm test:e2e                # 桌面/手机 Chromium 交互测试
```

浏览器测试使用已安装的 Google Chrome（channel=chrome），不会在依赖安装时自动下载浏览器。其他机器先安装 Chrome，或自行调整 playwright.config.ts。测试产物在 test-results/，不提交 Git。当前没有 create:lab、--lab 筛选或独立发布 SDK。

开发模式仅将已注册的实验/讲解/贡献页面映射到开发入口，缺失资源不会回退为首页。要单独复验开发入口，可运行 FEYNMAN_DEV=1 pnpm exec playwright test --grep 'catalog|controls' --workers=1 --output=test-results-dev。

## 案例来源与构建

每个案例位于 frontend/examples/学科/slug，包含 manifest.json、parameters.schema.json、snapshot.schema.json、model.ts、view.tsx、model.test.ts、lesson.zh-CN.md、presets.json、questions.json、preview.svg、ATTRIBUTION.md。模型没有 React、DOM 或绘图依赖。view.tsx 导出默认 React 组件和 model。

pnpm generate 只读取静态数据与文件，不执行案例模型。校验必填字段、id/slug 唯一性、元数据兼容版本、文件路径、1 MiB 单文件预算、数值参数默认值与预设、状态 schema、自测题、引用以及七章讲解。拒绝符号链接和越界文件。Markdown 经 sanitize-html 处理；封面只接受无脚本的本地 SVG。

生成 apps/web/generated/catalog.{json,ts}、registry.ts，以及 public/catalog.json、search-index.json、previews/。这些文件不提交，开发与构建自动生成。新增案例不修改中心路由；新增或修改 manifest、讲解、预设后重新执行 pnpm generate 或重启 pnpm dev。当前只支持中文、lesson 布局和有限数值参数，扩展协议需同时更新 schema 与实现。

生产构建预渲染首页、贡献页、404、三个 labs 入口和三个 learn 讲解页。实验入口提供静态说明，加载后由客户端接管；学习页关闭 JavaScript 后仍能阅读。路由文件为 labs/slug.html 与 learn/slug.html，Vercel cleanUrls 提供不带扩展名的链接，不使用通配 SPA 重写。

公式与三维依赖只在相关实验加载。首批目录直接携带三个案例的文字元数据；案例库明显增长时可拆分讲解数据。共享渲染器尚未独立抽象，Worker/WASM 没有实际需求，未引入。

## 模型与运行时

- 函数变换：纯函数 y = a(x − h)² + k；a=0 明确显示为常函数。播放只移动采样点。
- 单摆：θ″ = −(g/L) sin θ，固定模拟步长 1/120 s，每步最多 1/240 s 的 RK4 子步；界面周期只表示小角度近似。初始角度输入显示度，内部为弧度。能量显示单位质量 J/kg。
- 昼夜：球形地球、固定太阳赤纬、平行光、24 小时太阳日；1 模拟秒代表 1 太阳小时。计算太阳高度和几何昼长，含极昼/极夜边界。场景采用赤道坐标，自转轴竖直、太阳方向随赤纬改变；原创程序化陆地是示意，不是地图。WebGL 2 不可用时保留静态示意与计算。

运行时独立于渲染帧率：每次追赶最多采纳 0.1 秒墙上时间，隐藏页面丢弃积压；页面恢复不会补跑隐藏时段。高频模型状态保留在运行时，SVG 直接更新图形属性，R3F 每帧读取状态，React 摘要每 100 ms 更新。卸载释放帧循环、订阅与 R3F 场景资源。初始暂停，减少动效偏好不自动启动教学动画。

改参和预设重新创建初始模型状态，并将模拟时间归零；重置保留当前参数。相机缩放不修改科学参数。运行时上限 1,000,000 模拟秒，到达上限暂停。

## 快照

导出 JSON 包含 labId、labVersion、sdkVersion、snapshotSchemaVersion、params、seed、simulationTime、internalState、camera、activeChapter。三个模型没有随机过程，seed 仍保留在协议中。界面不承诺把状态同步到其他设备，也不会自动上传。

导入最大 16 KiB，先校验所有字段、版本、数值范围、状态 schema 和视角/章节，再原子恢复。失败不改变正在运行的状态；成功后保持暂停。快照不包含播放速度，恢复时保留当前查看者速度。案例版本改变后明确拒绝旧快照；尚无旧版本档案或迁移器。

## 验证范围与限制

单元检查已包含：已知函数值与退化边界、小振幅单摆的解析近似、严格参数下 100 秒能量误差、积分收敛、周期缩放、春分与赤道太阳高度、极昼极夜、南北对称、完整状态续算与非法输入的原子拒绝。

Playwright 覆盖 1440×900、390×844，DPR=1、中文、Asia/Shanghai：目录筛选与搜索、三个深链接、单步/播放/暂停/重置、数字输入边界、预设、章节、自测、快照下载和恢复、无 JavaScript 讲解、缺失资源状态、无 WebGL 回退及页面溢出。截图属于本机人工检查材料，不是与外部设计图的像素一致证明。

2026-10-11 实测：Node 24.11.1、pnpm 12.10.1、macOS 27.0.1、Chrome 155.0.8059.40。25 项单元测试、16 项生产预览浏览器检查、8 项开发模式浏览器检查通过；类型检查与静态构建通过。生产预览还检查了案例 chunk 与课程壳 chunk 加载失败时的讲解/刷新提示。

当前产物：首页 JS 约 253.6 KB（gzip 80.2 KB），地球实验独立 chunk 约 885.0 KB（gzip 239.2 KB），后者超过 800 KB 构建警告线；没有提高警告线掩盖结果。该体积不代表实测帧率预算通过。字体与相应第三方许可通知随静态产物提供在 THIRD_PARTY_NOTICES.txt，不改变项目自身许可证。

尚未验证：真实手机触摸、完整键盘辅助技术、768/1920 视口、帧率/参数延迟性能预算、真实 Vercel 路由和缓存、生产版本/网络地区表现、长期旧 chunk 保留机制。案例未经过独立学科维护者教学审阅。

## 未来发布配置

关联 geoochi/feynman 私有仓库，设置根目录 frontend、Node 24.x、生产分支 main，安装 pnpm install --frozen-lockfile、构建 pnpm build、输出 dist。frontend/vercel.json 仅准备配置；不代表已经创建项目或上线。

本地最终审查后由维护者确认合并/推送，Vercel Git 集成才负责自动发布。仓库不包含 GitHub Actions、后端、运行时 AI、数据库或第二条生产部署通道。上线后另行检查目标提交、正式 URL、cleanUrls 深链接、缺失文件 404、缓存及平台回滚。
