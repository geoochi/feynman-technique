# Contribute an experiment

Thank you for helping people understand a new idea. Issues and pull requests in **English, 中文, or 日本語** are welcome.

## Start with a question

[Propose an experiment](https://github.com/geoochi/feynman-technique/issues/new?template=experiment.md) even if you do not write code. Tell us:

- What question should the experiment answer, and who is it for?
- What could the learner change or manipulate?
- What should they observe, predict, or explain?
- What references support the idea, and what assumptions or limits matter?

Translations, corrections, accessible interactions, and clearer explanations are also useful contributions. For a substantial new experiment, open an Issue first to discuss the scope. A small correction can go straight to a PR.

## Build an experiment

Fork the repository, create a branch, and run the frontend locally using Node 24 and pnpm 12.10.1:

```sh
git clone https://github.com/YOUR_USERNAME/feynman-technique.git
cd feynman-technique
git config --local core.hooksPath .githooks
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Copy a suitable example from `frontend/examples/` into a new subject/slug directory. Give it a unique, stable id and slug. Keep the scientific model in `model.ts`, independent of React and rendering; use `view.tsx` for the interactive scene and readouts. Include metadata, parameter and snapshot schemas, three-language labels and notes, presets, a preview, and source attribution. The catalog generator discovers valid examples automatically; you do not need to edit a central route list.

The notes should guide the learner through **problem → prediction → action → observation → explanation → verification → extension**. Use known solutions, boundary conditions, conservation laws, or convergence to check the model. Explain units, assumptions, approximation limits, and references. Keep assets local, properly attributed, and within the build limits.

The detailed file contract is in [experiment design](docs/CONTRIBUTING_DESIGN.md); working commands are in [development](docs/DEVELOPMENT.md). There is no separate SDK, CLI, server, or cloud account required for local development. If you cannot provide all three translations, start with an Issue or draft PR so we can coordinate; production builds require all three languages.

## Before opening a PR

For code or a new experiment, run:

```sh
pnpm typecheck
pnpm check:lab
pnpm build
```

Run the relevant browser checks with `pnpm test:e2e` when you change interactions or layouts (Google Chrome is required). For a small documentation fix, check the wording and links instead. State what you actually verified and anything that is still missing.

Use the PR template to explain the learning goal, model and references, observable result, validation, and asset permissions. Include desktop/mobile screenshots for visual changes. Maintainers review the proposed changes and run relevant checks before merging; merge or push currently does not automatically deploy the website.

## Attribution and permissions

Credit contributors and record third-party sources in `ATTRIBUTION.md`. Submit your own work or material you have permission to contribute. Do not include credentials, private data, generated build files, or assets with unclear rights.

No general open-source license has been granted yet. Existing cases use `LicenseRef-All-Rights-Reserved`; please discuss proposed licensing for a new contribution with the maintainer instead of assuming an MIT or Creative Commons license. A PR does not require transferring authorship or inventing a scientific reviewer.

仓库欢迎实验想法、纠错与翻译；不会写代码也可以开 Issue。新实验生产构建需要英中日三语言材料，暂时缺翻译可先开 Issue 或草稿 PR。

実験の提案・修正・翻訳を歓迎します。コードを書かなくても Issue を送れます。公開用ビルドには三言語が必要ですが、翻訳が未完成なら Issue やドラフト PR で相談してください。
