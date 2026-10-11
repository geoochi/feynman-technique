# Feynman

通过交互式实验理解知识，把学习中的发现分享给更多人。

目前可以探索三个实验：**二次函数、单摆与时间、地球的昼与夜**。调节参数、观察变化、阅读原理。

访问 [feynman-technique.com](https://feynman-technique.com)。

源码仓库当前保持私有，网站暂不提供源码或社区贡献入口。

网站默认英语，可通过顶部语言下拉框切换中文和日语；切换语言会保留当前实验状态。

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

使用 Node 24（本地基线 24.11.1）和 pnpm 12.10.1。网站为纯前端静态应用，已部署到 Cloudflare Workers；案例目前为实验性内容。

- [架构与实现范围](docs/ARCHITECTURE.md)
- [本地开发与验证](docs/DEVELOPMENT.md)
- [视觉规范](docs/VISUAL_SPEC.md)
- [案例贡献指南](docs/CONTRIBUTING_DESIGN.md)
- [SEO 与上线验收](docs/SEO.md)

- [Cloudflare Workers 部署](docs/DEPLOYMENT.md)
