# Feynman Technique

English · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

Understand math and science by changing something, observing what happens, and explaining why.

**[Explore the experiments →](https://www.feynman-technique.com)**

Feynman Technique is a growing collection of interactive learning experiments. Adjust parameters in your browser, test a prediction, and read the explanation behind the model. The interface and notes are available in English, Chinese, and Japanese; switching languages preserves your experiment state.

## Explore

| Experiment | Try it |
| --- | --- |
| [Quadratic functions](https://www.feynman-technique.com/labs/function-transform) | Move the vertex and change the shape of a parabola. |
| [Pendulum and time](https://www.feynman-technique.com/labs/pendulum) | Change length, gravity, and starting angle to explore the period. |
| [Day and night on Earth](https://www.feynman-technique.com/labs/day-night) | Explore how rotation, latitude, and solar declination affect daylight. |

Each experiment includes separate notes with formulas, assumptions, and references. These first experiments are marked experimental and are awaiting independent teaching review.

## Help create the next experiment

What would you like to understand through an experiment? **You do not need to write code to contribute.**

- [Open an Issue with an experiment idea](https://github.com/geoochi/feynman-technique/issues/new?template=experiment.md): describe the question, what the learner could change, and what they should discover.
- [Send a pull request](https://github.com/geoochi/feynman-technique/pulls): add an experiment, improve an explanation, fix a model, or help with a translation.
- [Report a bug or an unclear explanation](https://github.com/geoochi/feynman-technique/issues/new?template=bug.md).

English, Chinese, and Japanese contributions are welcome. Start with the [contribution guide](CONTRIBUTING.md); a small, well-explained experiment is a great first contribution.

## Run locally

Use Node 24 (baseline 24.11.1) and pnpm 12.10.1.

```sh
git clone https://github.com/geoochi/feynman-technique.git
cd feynman-technique/frontend
pnpm install --frozen-lockfile
pnpm dev
```

Built with TypeScript, React, and Next.js App Router using static export. Models run in the visitor's browser; the site is hosted as static assets on Cloudflare Workers. The Next.js migration was deployed and verified on October 13, 2026.

For checks and implementation details, see [development](docs/DEVELOPMENT.md), [experiment design](docs/CONTRIBUTING_DESIGN.md), and [deployment](docs/DEPLOYMENT.md).

For the next stages and milestones, see the [development roadmap](docs/ROADMAP.md) (Chinese).

## License

Original code, explanations, documentation, and artwork are licensed under the [MIT License](LICENSE). You may use, modify, distribute, and use them commercially while retaining the copyright and license notices.

Third-party dependencies, fonts, and the NASA Earth texture retain their own terms and are excluded from the project's MIT grant. See each experiment's `ATTRIBUTION.md` and the [third-party notices](frontend/public/THIRD_PARTY_NOTICES.txt). The deployed site includes a copy of the [MIT license](https://www.feynman-technique.com/LICENSE.txt).
