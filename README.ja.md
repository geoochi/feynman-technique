# Feynman Technique

[English](README.md) · [简体中文](README.zh-CN.md) · 日本語

パラメーターを変え、結果を観察し、理由を説明することで、数学と科学を理解しよう。

**[実験を探索する →](https://www.feynman-technique.com/ja/)**

Feynman Technique は、少しずつ成長するインタラクティブな学習実験集です。ブラウザーでパラメーターを操作し、予測を確かめ、モデルの原理を読むことができます。画面と解説は英語・中国語・日本語に対応し、言語を切り替えても実験の状態は保持されます。

## 探索

| 実験 | 試せること |
| --- | --- |
| [二次関数](https://www.feynman-technique.com/ja/labs/function-transform) | 頂点を動かし、放物線の形や向きを変える。 |
| [単振り子と時間](https://www.feynman-technique.com/ja/labs/pendulum) | 長さ・重力・初期角度を変え、周期を調べる。 |
| [地球の昼と夜](https://www.feynman-technique.com/ja/labs/day-night) | 自転・緯度・太陽赤緯が日照に与える影響を調べる。 |

各実験には、数式・仮定・参考資料を示した独立した解説があります。最初の実験は試作版であり、独立した教育内容のレビューはまだ完了していません。

## 次の実験を一緒につくろう

実験で理解したいことはありますか？**コードを書かなくても参加できます。**

- [Issue で実験を提案](https://github.com/geoochi/feynman-technique/issues/new?template=experiment.md)：問い、操作できる要素、学習者に発見してほしいことを教えてください。
- [PR で改善を投稿](https://github.com/geoochi/feynman-technique/pulls)：新しい実験、解説の改善、モデルの修正、翻訳を歓迎します。
- [不具合やわかりにくい解説を報告](https://github.com/geoochi/feynman-technique/issues/new?template=bug.md)。

英語・中国語・日本語での投稿を歓迎します。[コントリビューションガイド](CONTRIBUTING.md)から始めてください。小さくても、明確に説明できる実験はすばらしい最初の貢献です。

## ローカルで実行

Node 24（基準 24.11.1）と pnpm 12.10.1 を使用します。

```sh
git clone https://github.com/geoochi/feynman-technique.git
cd feynman-technique/frontend
pnpm install --frozen-lockfile
pnpm dev
```

TypeScript、React、Vite を使用しています。計算は閲覧者のブラウザーで行い、Cloudflare Workers の静的アセットとして配信します。

詳細は[開発と検証](docs/DEVELOPMENT.md)、[実験設計](docs/CONTRIBUTING_DESIGN.md)、[デプロイ](docs/DEPLOYMENT.md)を参照してください。

## 権利と出典

リポジトリは閲覧と協力のために公開しています。オープンソースライセンスはまだ付与しておらず、実験の manifest は `LicenseRef-All-Rights-Reserved` を使用しています。公開されていること自体は、一般的な再利用・再配布の許可を意味しません。第三者の素材はそれぞれの利用条件に従い、各実験の `ATTRIBUTION.md` とサイトの第三者ライセンス通知に記録しています。
