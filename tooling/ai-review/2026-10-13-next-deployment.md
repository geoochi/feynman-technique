# Next 静态迁移生产发布复核

日期：2026-10-13（Asia/Shanghai）。维护者明确授权自动 commit、push、deploy。源码提交 `ccedbd2c374d2b1f36f0200850a7fc6855ee0fa7`，已推送 origin/main 并核对远端 SHA；Geoo Chi 为主作者，独立 `Co-authored-by: Codex <noreply@openai.com>` trailer 已检查。

## 来源、配置与发布

- Node 24.11.1、pnpm 12.10.1、Next 16.4.0、React 19.3.0、Ajv 8.18.0、KaTeX 0.18.2。升级修复依赖后生产审计无已知漏洞，冻结安装、类型、51 项单元、正式构建审计通过。修复早期客户端脚本错误提示的 DOM 时序后，故障重复检查 10 项通过，完整浏览器回归 90 通过、4 按设计跳过。
- 提交后重新构建正式可索引 out，21 个内容 URL、3 个语言 404、robots/sitemap、许可证和内容边界检查通过。同一产物上传同一 Worker；没有应用后端或 Next 服务器，没有改变两个 Custom Domain 或裸域重定向方向。
- 部署版本 `80b67878-c31f-447c-bca2-e22033a1e027`，平台创建时间 `2026-10-13T06:40:54.285Z`（北京时间 14:40:54），100% 流量。Tag `ccedbd2`，版本消息包含完整源码 SHA。Wrangler CLI 部署列表将来源显示为 Unknown/deployment，实际由本机 Wrangler 上传，未接入 Git 自动构建。
- 发布前核实的旧版本为 `8dd640d1-11ec-4719-8070-51be2994705d`；本次没有回滚。后续上线记录与文档提交只修改 Markdown，静态产物仍绑定上面的代码提交。

## 实际线上检查

正式 origin 为 `https://www.feynman-technique.com`。HTTP 验收报告在干净源码提交上启动；候选为该提交重新构建的 out，没有用旧验收代替本次结果。

| 范围 | 结果 |
| --- | --- |
| 21 个英/中/日内容 URL | HTTP 200，HTML 与本地导出逐字节一致；正确语言、正文、Metadata/JSON-LD、canonical/hreflang、可索引 head/响应头 |
| 3 个语言 404 | HTTP 404，错误 HTML 与本地一致，语言与 noindex 正确 |
| 196 个非 HTML 资源 | JS/CSS/字体/纹理/图片/JSON/robots/sitemap/RSC/segment 文件逐字节一致；所有 /_next/static 哈希资源缓存规则正确 |
| Google 验证文件与 favicon | 同域跳转后 200、字节与源文件一致；验证文件保留，未将其加入 sitemap |
| 14 个裸域 HTTP/HTTPS 请求 | 301 到 HTTPS www，路径和编码查询保留 |
| 4 个 HTML 别名 | 307 到既定规范路径，查询保留 |
| 9 个缺失页面/资源请求 | 三语言未知页和 /contribute、缺失 JS/JSON/SVG 均为真实 404；没有 SPA 回退 |
| Chrome 155.0.8059.40 正式站交互 | 1440×900 与 390×844、DPR=1，三个案例共 6 组场景通过；三语言参数/单步时间保留，动态案例播放状态保留，地球纹理/Canvas 完成；无页面异常 |
| 同语言客户端导航 | 首页→实验→讲解→实验的静态 RSC 请求成功、元信息更新正确 |
| 禁用 JavaScript | 三种语言单摆讲解可读，H1、七章及目标/引用完整 |

首轮资源核对在 175 个资产后出现一次 30 秒请求超时，未记为通过；降低并发并使用最多三次请求重试后，完整 HTTP 核对通过，未调整网站配置。首次浏览器验收脚本误定位首页不存在的讲解直达链接，已修正为实际入口并完整重跑；这是验收脚本问题，没有改动产品代码。最终报告均为 passed。

原始 HTTP/浏览器结果、首次失败材料和桌面/手机地球截图保存在忽略的 frontend/test-results-next-deployment，不提交缓存、凭据或生成产物。截图只用于构图检查，不宣称像素一致。

## 限制与后续

工程、本次生产可访问性/交互验收通过。性能预算仍按 [首轮迁移测量](../../docs/PERFORMANCE_BASELINE.md#2026-10-13-next-全量迁移) 保留未达项，未重测正式站性能；实体手机、真实用户 CWV、独立教学审阅和搜索效果仍未知。

发布前核对 Next npm latest 为 16.4.0。官方 [10 月 14 日安全更新预告](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) 尚未公开影响范围与补丁，更新发布后需复查；不能据静态部署或当前 audit 结果断言预告问题均不适用。没有创建监控或计划任务。
