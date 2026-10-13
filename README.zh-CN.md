# Feynman Technique

[English](README.md) · 简体中文 · [日本語](README.ja.md)

通过改变参数、观察结果、解释原因，把「知道」变成「理解」。

**[开始探索实验 →](https://www.feynman-technique.com/zh/)**

Feynman Technique 是持续成长的互动学习实验库。在浏览器里调整参数、验证预测，再阅读模型背后的原理。界面与讲解支持英语、中文和日语，切换语言会保留当前实验状态。

## 探索

| 实验 | 可以探索什么 |
| --- | --- |
| [二次函数](https://www.feynman-technique.com/zh/labs/function-transform) | 移动顶点，改变抛物线的形状与开口。 |
| [单摆与时间](https://www.feynman-technique.com/zh/labs/pendulum) | 改变摆长、重力与初始角度，探索周期。 |
| [地球的昼与夜](https://www.feynman-technique.com/zh/labs/day-night) | 探索自转、纬度与太阳赤纬如何影响日照。 |

每个实验都有独立讲解，说明公式、假设与参考依据。首批实验仍为实验性案例，尚未完成独立教学审阅。

## 一起创造下一个实验

你想用实验理解什么？**不会写代码也能参与。**

- [开 Issue 提出实验想法](https://github.com/geoochi/feynman-technique/issues/new?template=experiment.md)：描述问题、可以改变什么，以及希望学习者发现什么。
- [开 PR 贡献改进](https://github.com/geoochi/feynman-technique/pulls)：新增实验、完善讲解、修正模型或提供翻译。
- [报告错误或难懂的讲解](https://github.com/geoochi/feynman-technique/issues/new?template=bug.md)。

欢迎用中文、英语或日语交流。从[贡献指南](CONTRIBUTING.md)开始，一个讲得清楚的小实验就是很好的首次贡献。

## 本地运行

使用 Node 24（基线 24.11.1）和 pnpm 12.10.1。

```sh
git clone https://github.com/geoochi/feynman-technique.git
cd feynman-technique/frontend
pnpm install --frozen-lockfile
pnpm dev
```

技术栈为 TypeScript、React 与 Vite。实验在访客浏览器中计算，网站通过 Cloudflare Workers 静态资源托管。

开发与验证见[本地开发](docs/DEVELOPMENT.md)，案例要求见[案例设计](docs/CONTRIBUTING_DESIGN.md)，发布见[部署指南](docs/DEPLOYMENT.md)。

后续方向、阶段目标与推进条件见[长期开发路线图](docs/ROADMAP.md)。

## 许可证

原创代码、讲解、文档与图示统一采用 [MIT 许可证](LICENSE)。允许使用、修改、分发及商用，须保留版权与许可证声明。

第三方依赖、字体与 NASA 地球贴图保留各自条款，不包含在本项目的 MIT 授权范围内。来源及条件见各实验的 `ATTRIBUTION.md` 与[第三方许可通知](frontend/public/THIRD_PARTY_NOTICES.txt)。官网同时提供 [MIT 许可证副本](https://www.feynman-technique.com/LICENSE.txt)。
