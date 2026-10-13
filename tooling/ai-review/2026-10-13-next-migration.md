# Next.js 全量迁移本地复核

日期：2026-10-13（Asia/Shanghai）。首次本地验收目标基线为 `main` / `6d1ef4c4ca86fe3d3719955ff7b10c24bf632fb7` 加当时未提交工作树。检查包括 tracked diff 与新增 app、页面、客户端会话、案例 controller/readouts/formulas、生成/审计脚本及测试；不是对纯 HEAD 的验证。开始时已有的规划和文档改动保留。首次验收时未提交、推送、上传生产或核实云端状态；随后授权发布的源码与正式结果另记于文末。

## 实现与检查范围

- Next 16.4.0 / React 19.3.0（已核对官方及安装包内静态导出/Metadata/布局文档），App Router 多根布局静态导出。首页、讲解、实验框架由构建渲染，21 个规范内容 URL 和 3 个语言 404 保留。静态 Worker 无应用后端；名称、两个域名、混合尾斜线与真实 404 规则保持原配置。
- 构建内容集合与浏览器代码分离。首页只传当前语言卡片/搜索；讲解净化仅在构建侧，当前页面正文仍可能进入 RSC 载荷。公式构建为 HTML/MathML；状态校验用 Ajv standalone，不把 KaTeX/Ajv 编译器放入实验控制路径。
- 三个科学 model.ts 无改动。RuntimeLabConfig 不携带全文；model/Readouts 与 scene 使用各自可信静态 import 映射。二次函数没有播放/时钟；单摆比例与小角度周期、地球正交视图/太阳光/本地 NASA 图保留。
- 跨语言文档导航交接完整快照和 playing；一次性 token、目标 URL、期限、大小与版本校验。刷新/直接访问重新初始化。BFCache 等待浏览器刷新 Storage 视图后恢复；同语言笔记往返保留会话。预检失败不离开当前实验，真实文档失败可用浏览器后退恢复。
- 静态说明先可读；控制器/场景/关键客户端脚本、贴图/WebGL 故障分别回退，场景失败仍可改参/看读数；重试不依赖全站 SPA。
- 原 Vite 产品入口、配置、正常页面预渲染器、客户端 head 更新退出。Vitest 的 Vite 依赖仍保留。默认 dev/typecheck/build/preview/test:e2e 已统一，Wrangler 从 out 读取完整静态导航产物。

## 实际执行

工具链 Node 24.11.1、pnpm 12.10.1；Chrome 155.0.8059.40、macOS Darwin 27.0.0 / Apple M1 Pro。浏览器项目为桌面 1440×900、手机模拟 390×844，DPR=1；断点另覆盖 1920×1080、768×1024、5120×2580。实体手机与母语审校未执行。

| 检查 | 结果 |
| --- | --- |
| pnpm install --frozen-lockfile | 通过，锁文件无需修改，296 项供应链策略检查通过 |
| pnpm typecheck | 通过，生成清单/Next 类型并执行 tsc |
| pnpm check:lab | 51 项通过，含三个模型、完整状态延续、边界/原子拒绝恢复、目录/SEO/i18n |
| pnpm build | 通过；24 页导出审计、元信息/正文边界、robots/sitemap 与原始 LICENSE 校验通过 |
| SITE_INDEXABLE=false pnpm build | 通过，全部内容 noindex、无 sitemap |
| 非 main Workers 构建，显式 SITE_INDEXABLE=true | 通过，仍强制 noindex、无 sitemap；随后恢复正式产物 |
| pnpm test:e2e --output=test-results-migration-final | 90 项通过、4 项按设计跳过（手机项目不重复桌面断点矩阵） |
| FEYNMAN_DEV=1 浏览器控件检查 | 6 项通过，Next Strict Mode 下三个实验桌面/手机模拟；补齐 favicon 后复验，正常页面不再触发 favicon 的动态路由报错 |
| pnpm exec wrangler deploy --dry-run | 通过，读取 out 的 257 个资产；未上传 |
| 模型模块失败后局部重试补验 | 桌面/手机 2 项通过，重试后单步至 t=0.10 s；定位器歧义修正后复验 |
| 文档/收尾 | 115 个本地 Markdown 链接有效，git diff --check 通过；无暂存文件，新增实现中未发现所扫描的私钥/令牌格式 |
| 固定状态采集 | 保存 24 页 head/HTML 哈希与 24 张三语言桌面/手机截图；默认参数、暂停 t=0、字体与地球首帧/纹理就绪后采集 |

全量浏览器检查覆盖目录搜索、三语言无 JS 正文、Metadata/JSON-LD、有效 RSC 请求、Workers 别名与真实资源 404、快照状态/历史/BFCache/存储及导航错误、布局、两类重置、按比例单摆、地球/WebGL/纹理/模块失败。新增科学算法与独立教学审阅不在本轮范围。截图抽查未发现构图或排版阻塞；未冻结像素差分阈值，不能声称逐像素一致。

原始输出位于忽略的 `frontend/test-results-migration-{final,dev,retry,visual,performance}`，历史 P0/P1 记录保持原事实。性能数据与未达预算见 [性能基线新增章节](../../docs/PERFORMANCE_BASELINE.md#2026-10-13-next-全量迁移)。

## 首次本地验收结论与发布边界（阶段历史）

P0–P4 的代码迁移与本地工程验收完成，P4 按计划记录未达项和处理决定；P5 本地发布准备完成。没有发现尚未解决的状态、静态内容、SEO 或 Workers 本地路由阻塞。地球大块仍触发 800,000 字节审阅警告；性能预算和实体设备验证不写成全部通过。

生产站未切换，Workers Builds 未关联。上一正式验收版本 `8dd640d1-11ec-4719-8070-51be2994705d` 仅来自历史部署记录；发布时须核实可回退性与实际线上版本。发布前复查 Next 官方安全补丁和适用范围，确认最终源码与正式可索引产物；上线后另外验收 www、裸域 301、资源/RSC、21 页、三语言 404、索引策略及交互。框架迁移不证明搜索流量或学习效果改善，独立教学审阅、实体手机与真实用户 CWV 仍未核实。

## 后续授权的发布前复核（2026-10-13）

维护者明确要求自动 commit、push、deploy。已核对 origin 为 geoochi/feynman-technique、main 无远端新增提交、core.hooksPath=.githooks、主作者 Geoo Chi。Wrangler 部署列表确认发布前 100% 流量版本为 8dd640d1-11ec-4719-8070-51be2994705d，可作为回退候选。

发布前审计发现 Ajv/KaTeX 两项已公布问题，固定升级至 Ajv 8.18.0、KaTeX 0.18.2，原始 LICENSE 与分发通知匹配。升级后 pnpm audit --prod 无已知漏洞，冻结安装、类型、51 项单元与正式可索引构建通过。参考 [Ajv 修复发布](https://github.com/ajv-validator/ajv/releases/tag/v8.18.0)、[KaTeX 安全公告](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7)。

Next npm latest 仍为 16.4.0。官方 [10 月 14 日更新预告](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) 尚未公布影响范围与修复版本，不能据纯静态部署断言所有预告问题均不适用；更新发布后应复查。本次交付仍为纯静态 out，不部署 Next 服务器。先前性能数值绑定原候选，尚未复测修复依赖后的性能。上线结果将独立记录。

升级后的首次完整浏览器检查为 89 通过、4 跳过、1 失败；该失败暴露关键脚本过早报错、错误提示 DOM 尚未解析的时序问题。Root 中缓存失败状态，在 DOMContentLoaded 再显示提示；随后重复故障检查与完整回归另记最终结果，不把首次失败写成通过。

修复后重建通过，关键客户端脚本失败在桌面/手机各重复 5 次，共 10 项通过；最终完整浏览器回归 90 项通过、4 项按设计跳过。暂存 diff 检查、凭据模式扫描、升级依赖原始许可证检查通过，未包含 out/.next/生成文件/测试材料/凭据。提交将保留 Geoo Chi 主作者和独立 Codex trailer。

## 已提交、推送与生产验收

全量代码及发布修复已提交为 ccedbd2c374d2b1f36f0200850a7fc6855ee0fa7，主作者/trailer 与远端 main SHA 已核对；随后从干净提交重建，部署版本 80b67878-c31f-447c-bca2-e22033a1e027、100% 流量。正式 24 份页面、196 个非 HTML 资源、跳转/404、三语言与实验检查通过。详细证据、首轮验收请求超时和脚本定位修正、未核实项见 [生产复核](2026-10-13-next-deployment.md)。后续文档状态提交不改变该静态产物来源。
