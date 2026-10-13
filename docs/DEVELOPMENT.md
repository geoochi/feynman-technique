# 本地开发与验证

更新：2026-10-13。当前源码已统一为 Next.js App Router 静态导出；正常页面由 Next 构建渲染，实验在浏览器运行。迁移版本已在官网发布并完成线上验收，来源 ccedbd2。完整记录见 [迁移计划](archive/2026-10-13-nextjs-migration.md)和 [部署记录](DEPLOYMENT.md)。

## 当前环境与命令

固定 Node 24.11.1（24.x）与 pnpm 12.10.1，Next 16.4.0、React/React DOM 19.3.0、Ajv 8.18.0、KaTeX 0.18.2。直接依赖和 lockfile 精确固定；安装脚本许可仍只有 esbuild/workerd。Vitest 仍依赖 Vite，项目已移除 Vite 应用入口和插件。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev                     # Next，http://127.0.0.1:3000
pnpm generate                # 协议、公式、完整内容、可信控制器/场景/贴图映射
pnpm typecheck               # 生成内容、Next 路由类型、TypeScript
pnpm check:lab               # 内容、科学模型和运行时单元检查
pnpm build                   # Next 静态导出、URL/404/SEO 整理、产物审计
pnpm preview                 # Wrangler 本地 out 静态服务，端口 4173
pnpm test:e2e                # 已安装 Google Chrome，桌面/手机模拟
pnpm preview:workers         # 与 preview 相同
pnpm deploy:workers          # 仅上传既有 out；网站改动按持续授权自动发布
```

没有 next start/next export、独立 SDK/CLI、create:lab 或 --lab 筛选。修改案例文案、清单和公式后 pnpm generate 或重启 dev；尚无内容生成监听器。测试产物、.next、out、next-env.d.ts、生成目录与依赖均忽略，不提交。Next dev 自动维护 frontend/AGENTS.md 的本地版本文档指引，该文件保留为源码工作约定。

## 构建与内容边界

案例仍放 examples/学科/slug。必需文件为 manifest、参数/状态 schema、model.ts、model.test.ts、view.tsx、readouts.tsx、controller.ts、formulas.json、labels.ts、三语言 Markdown、预设、题目、封面和 ATTRIBUTION。generate 只读案例静态文件，不执行模型；校验路径/符号链接/大小、三语言/七章、schema/参数、素材与静态公式。Markdown 净化沿用原流程，公式以 KaTeX trust:false 在构建时编译，浏览器仅呈现 HTML/MathML。

完整 catalog 只供构建侧页面及 SEO；server-only 边界和导出检查阻止讲解集合进入浏览器 JS。首页只传当前语言卡片/搜索字段；当前页面正文可能进入 RSC 数据。公共 catalog.json、search-index.<locale>.json、封面、Google 验证文件与许可 URL 继续兼容。状态 schema 在构建时用 Ajv standalone 编译，浏览器不加载 Ajv 编译器；controller 仅导出 model/Readouts，场景独立按需加载；运行时只接收 RuntimeLabConfig，不携带全文。

默认输出 out，21 个内容 URL 与 3 个语言 404；Next 还会生成内部错误/导航文件。英文旧路径、zh/ja 前缀保留；仅把本地化首页 HTML 整理为 index.html，RSC/segment 载荷原路径整体发布。真实 404 与别名由 Workers auto-trailing-slash/404-page 承担，不使用 SPA 回退。只有 /_next/static/* 哈希资源长缓存，RSC/HTML 可更新。

默认正式配置输出 sitemap；SITE_INDEXABLE=false 或非 main 的 Workers 构建都 noindex 且不留 sitemap。SITE_URL 只接受 HTTPS origin；Next Metadata、JSON-LD 与 robots/sitemap 使用同一纯规则。删除了旧 head.ts/applyMetadata、prerender.ts、Vite 配置与入口。

## 浏览器与运行时

初始暂停；manifest.playback=false 的二次函数不启动时钟。参数、两个重置、单摆比例、地球相机/平行太阳光与本地 NASA 图保持原有行为。控制器和场景独立加载，静态框架/示意/问题/笔记链接先可读；模型失败时禁用控制并给出重试，场景失败时仍可调参/查看读数。贴图失败或无 WebGL 保留静态说明；资源随卸载释放。

语言交接用当前标签页短期完整快照及 playing，校验导航标识、目标、版本、大小和期限。刷新/直接访问开始新实验；普通历史与 BFCache 分别验证，BFCache 在 Storage 视图更新后恢复并启用控件。快照继续校验 seed、时间、内部状态、相机与章节；不提供用户导入/导出入口。

最终数值、浏览器、性能和真实设备限制见 [全量迁移复核](../tooling/ai-review/2026-10-13-next-migration.md)，模型仍为 experimental。工程检查不能替代独立教学审阅，生产验收以对应版本的部署记录为准。

## 历史与验证材料

迁移前的操作和验收已移至 [Vite 开发历史](archive/2026-10-13-vite-development.md)。本地工程记录保留在 tooling/ai-review，当前生产验证见 [Next 部署复核](../tooling/ai-review/2026-10-13-next-deployment.md)。历史测试次数不作为当前改动的通过证明。

本地构建目录和报告可在验证后清除，再由相应命令生成。原始性能/截图/部署证据先归档再清理，不把原始观测当缓存丢弃。2026-10-13 的本机材料已移至仓库旁 feynman-local-archives 的日期压缩包，原 test-results 路径仅代表记录当时的位置；新克隆不自带这些本机材料。
