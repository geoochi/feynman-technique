# 移动端性能实验室基线

日期：2026-10-11（Asia/Shanghai）。本轮测量提供后续优化依据；没有真实用户数据，也没有判定 Core Web Vitals 通过或失败。

## 版本与条件

- 本地产物：基线 HEAD `7f8e0d552ca2036163013dbd0af46dbdaae47433` 上本次未提交的 SEO / GEO 改动；本地 `pnpm build` 通过后，用 `http://127.0.0.1:4173` 预览。
- 线上观测：`https://feynman-technique.com` 当时已发布内容，尚未包含本次开发产物。此次未通过平台核实部署 SHA，不能把本机 HEAD 当作线上部署证明。本地和线上是两个观测基线，不是同版本性能对照实验。
- 主机：Apple M1 Pro、macOS 27.0.1；Node 24.21.0、pnpm 12.10.1、Playwright 1.56.1、Chrome 155.0.8059.40（headless）。生产工具链配置未改。
- Chrome 模拟移动端：390×844 CSS px、DPR=1、触摸输入、英文界面、en-US 浏览器 locale、Asia/Shanghai 时区。使用桌面 Chrome 默认 User-Agent，不是实体 iPhone。
- CDP 限速：CPU 4× slowdown，网络延迟 150 ms，下行 1.6 Mbit/s，上行 0.75 Mbit/s。每次新浏览器上下文、禁用缓存，逐页串行运行，各三次；不同时运行测试或另一个性能采样进程。网络/CPU 限速仍不能精确复现某款手机及地区网络。
- 加载、控件可见、地球贴图就绪并完成字体加载后等待 2 秒，再采集加载指标；随后点一次学科筛选或播放按钮，观察 500 ms。所有 18 次返回 200，未捕获页面异常或失败请求。
- 响应大小使用 Resource Timing 的实际编码字节数。本地预览入口 JS 约 96 KB，与构建 gzip 大小相符；不能假定 Vite preview 一定不压缩。线上 CDN、网络与响应压缩可能不同。

## 指标含义与结果

FCP/LCP 是本次观察窗口内的实验室 paint 指标。LCP 不统计 Canvas 中的三维画面，实验入口首先展示预渲染封面；很早的 LCP 不表示地球实验已经加载完成。[Google 对 LCP 元素的说明](https://web.dev/articles/lcp)。

“控件可见”在页面 load 事件后观察搜索框/播放按钮，是观察到的时间上界，含浏览器自动化调用成本，不能当作精确的可交互时间；线上某次资源较晚结束可使它偏大。“地球就绪”表示 Canvas 和贴图来源链接已出现，说明贴图回调就绪，不表示已完成稳态帧率测量。CLS 取观察窗口内排除最近输入后的最大布局偏移会话值，不代表整次真实访问的 CLS。

“点击事件”是一次脚本触摸后，Event Timing 记录的最大事件时长；小于 16 ms 未记录时返回 null。这里只做少量代表性操作，既不是页面完整交互分布，也不是 INP。另存的 click-to-result 时长包含 Playwright 调用与检测开销，不用它判定用户延迟。[INP 的定义](https://web.dev/articles/inp)。

下表为三次的中位数，时间单位 ms。括号中的控件范围保留异常样本。

| 环境 | 页面 | FCP | LCP | CLS | 控件可见（范围） | 地球就绪 | 点击事件 |
|---|---|---:|---:|---:|---:|---:|---:|
| 本地改进版 | `/` | 488 | 488 | 0.0000 | 1237（1228–1243） | — | 32 |
| 本地改进版 | `/labs/pendulum` | 404 | 404 | 0.0000 | 2516（2503–2521） | — | 32 |
| 本地改进版 | `/labs/day-night` | 408 | 408 | 0.0055 | 3692（3650–3702） | 5584 | 64 |
| 线上现有版 | `/` | 568 | 568 | 0.0000 | 2449（1376–38255） | — | 32 |
| 线上现有版 | `/labs/pendulum` | 600 | 600 | 0.0000 | 2769（2734–2829） | — | 32 |
| 线上现有版 | `/labs/day-night` | 504 | 508 | 0.0055 | 4393（4351–4405） | 5702 | 64 |

线上首页的三个 LCP 样本为 1948、568、552 ms；控件观察时间为 2449、1376、38255 ms。保留第三次的 38 秒异常样本，没有丢弃它或认定为应用计算耗时。此次没有保存足以定位单个慢资源的网络 trace，因此原因尚未核实；后续脚本已增加资源 responseEnd/duration 与 loadEvent 字段，便于复测调查。大部分页面静态内容先出现，加载实验模块后有进一步等待。

## 有证据的后续建议

1. 优先在本轮上线后复测地球页，分别记录控件、Canvas 和贴图就绪时间，补充真实手机运行与帧率。当前约 5.6–5.7 秒的场景等待比静态 LCP 更能揭示实验加载体验；地球 JS 独立块 888.83 KB / gzip 239.87 KB，贴图 272.09 KB，均按案例请求。可评估减少三维模块依赖、把控制壳与大模块加载分离等方案；先验证错误回退、参数和语言状态，再决定实施方式。
2. 首页没有请求地球 JS 或贴图。当前入口 316.20 KB / gzip 96.07 KB，包含三语言完整讲解及 SEO 文案。本次文字改善使入口比计划中的基线 gzip 约增加 4 KB；三个案例时先保留当前简单数据结构。案例库增长时再拆轻量目录与讲解数据，确保预渲染正文完整和搜索、语言切换正确。不能从两个不同环境的三次样本推断某段代码造成性能回归。
3. 线上首页有资源等待波动。遇到重现时收集网络 trace，结合 Cloudflare 可用日志判断缓存、地区网络或单资源问题；无需因此增加应用后端。本轮不调整缓存规则或引入新的依赖。

## 复现与原始结果

使用已经安装的 Chrome，无新增依赖。在 `frontend` 先运行 `pnpm build`，启动 `pnpm preview --port 4173 --strictPort`，另一个终端执行：

```sh
node scripts/measure-performance.mjs http://127.0.0.1:4173 test-results-performance/local.json
node scripts/measure-performance.mjs https://feynman-technique.com test-results-performance/production.json
```

两个测量命令串行运行；需要使用 Node 24.x。此次本机环境通过 `PATH=/opt/homebrew/opt/node@24/bin:$PATH` 选择已安装的 Node 24.21.0，未更改项目工具链。默认路径是本地预览，默认输出为 `test-results-performance/mobile.json`。

脚本位于 [measure-performance.mjs](../frontend/scripts/measure-performance.mjs)，原始 18 个样本保存在忽略的 `frontend/test-results-performance/{local,production}.json`，不作为仓库内容提交。JSON 的 sourceCommit / sourceDirty 是本机工作树记录，线上部署须另行确认。后续变更工具、节流条件或版本需重新标注，不合并成同一基线。

此次观测窗口起始时间分别为本地 13:50:43、线上 13:51:53（Asia/Shanghai）。脚本在本次测量后补充了指标解释和资源详细计时字段；未对已有样本虚构这些字段。

方法参考：[Chrome 网络节流](https://developer.chrome.com/docs/devtools/network/reference#throttling)、[CPU 节流](https://developer.chrome.com/docs/devtools/performance/reference#throttle-cpu)、[CLS](https://web.dev/articles/cls)。

## 后续主域名切换

维护者随后确定正式主域名为 `https://www.feynman-technique.com`，裸域 301 到 www。以上 URL、命令和样本保留本次测量时的真实裸域目标；迁移完成后，生产复测命令的 origin 改用 HTTPS www，并单独验证裸域跳转链。不能将旧裸域性能基线改名成 www 已测量。
