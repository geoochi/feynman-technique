# 2026-10-11 私有仓库与公开网站信息清理

审查基线：`67411ed70ffdf88994747b7feb920e2427cf01c1`。对象为本次工作树；frontend 变更的 12 个文件按路径排序，以“路径 + NUL + 文件字节 + NUL”拼接的 SHA-256：`abe48389bb6db5a35acf24a69279e5a46d6dc5bc29d962814c664e524c8d70c3`。

已阅读课程壳、目录布局、实验工具栏、公开数据生成、SEO 路由与结构化数据、三语言文案、相关检查及文档差异。用户要求保留私有仓库，暂时移除网站的 GitHub 与个人账号信息，并自动提交、推送。本次没有修改仓库可见性；GitHub API 回读 `isPrivate=true`、`visibility=PRIVATE`。

改动覆盖：

- 删除公开导航、实验页源码/改编/贡献链接、页脚贡献入口和首页社区招募区块；删除三语言贡献页及相关未使用文案和样式。
- 卡片只显示版本，讲解页保留教学审阅状态但不展示个人作者。JSON-LD 不再生成 author；原作者继续保存在私有 manifest/ATTRIBUTION 中，generate 在校验后将作者数组清空再写入浏览器目录及 bundle，不伪造替代作者。
- 预渲染改为 24 个 HTML 页面、21 个可收录地址；旧三语言 /contribute 返回真实 404，不进入 sitemap。实验/讲解路径、语言导航和模型计算没有改变。
- 第三方必要版权通知保留且字节不变。清理的是公开产品信息，没有删除私有源码溯源或素材许可依据。

验证：

- 最终类型检查与生产构建通过；39 项单元检查、50 项 Workers 浏览器检查通过，4 项手机项目的桌面尺寸矩阵按既定规则跳过。扩展原检查覆盖所有内容页无个人署名/项目链接、JSON-LD 无 author、公开 catalog 无账号信息、旧贡献页 404，以及实验加载后工具栏没有相关链接。
- 扫描最终 dist 的所有可解码文本文件，无个人账号名；24 个 HTML 均无 GitHub 链接或贡献链接；catalog 的作者数组均为空；不存在 contribute.html；sitemap 有 21 个 loc。
- `git diff --check` 通过。未添加依赖，未改变科学模型或参数边界。保留约 889 KB 地球 chunk 的既有警告。
- 原页面数量、公开入口、数据投影、私有仓库状态，以及当前本地上传和目标 Git 自动发布流程已同步到工作约定、架构、开发、视觉、贡献、SEO 与部署说明。

线上验证：

- 已通过本机 Wrangler 上传并更新同一个 `feynman` Worker，Custom Domain 为 `feynman-technique.com`，版本 `19e1445e-0cdb-4c47-a96d-9ab7121ed3a5`。上传基于本次工作树，随后将相同源码纳入本次 Git 提交；实际操作为本机 CLI 上传；远端本次部署列表 Source 标为 Unknown (deployment)，不将其伪记为 Upload 或 Git 构建。
- 正式域名下 24 个 HTML、入口 JS/CSS、分享图与地球贴图逐字节匹配最终 dist；三语言页面没有个人账号或 GitHub 链接，公开 catalog 没有账号名。旧三语言贡献页、未知 URL、缺失脚本均返回 404；21 页 sitemap 正常，四个 HTML 别名重定向保留查询；哈希资源缓存正常。
- Chrome 线上检查三个实验控件、单摆/昼夜播放与重置、日文语言导航和 canonical 更新，没有 pageerror。

当前本地构建后由 Wrangler 上传，源码 push 与发布是两个动作，网站由 Cloudflare 持有和交付，与本机是否持续开机无关。本次未连接 Workers Builds，也没有新增自定义 webhook 或 GitHub Actions。远端前次部署 Source=Upload；尝试只读核对 Builds 触发器时，当前 OAuth 返回 403，不将此结果当作“已确认所有触发器为空”。后续 Git 集成关联与授权仍需单独完成。

本记录为同一代理的本地复核与线上验证，不是独立审阅者结论；没有验证 Search Console、真实手机、地区网络或性能预算。
