import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram: "Parabola with base point P, second point Q, secant and tangent",
  note: "Curve: y = x² · Solid line: secant · Dashed line: tangent · P: circle · Q: square. Fixed scale; coordinates have no units.",
  secant: "Secant slope",
  tangent: "Tangent slope",
  error: "Absolute slope difference",
  undefined: "Undefined",
  coincident: "h = 0: P and Q coincide. The quotient is undefined; the tangent still has slope 2x₀.",
  precision: "Readouts are rounded. Overlapping lines do not mean the slopes are exactly equal.",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "抛物线、基点 P、第二点 Q、割线与切线",
    note: "曲线：y = x² · 实直线：割线 · 虚直线：切线 · P：圆点 · Q：方点。固定比例尺，坐标无量纲。",
    secant: "割线斜率",
    tangent: "切线斜率",
    error: "斜率差的绝对值",
    undefined: "无定义",
    coincident: "h = 0：P、Q 重合，差商无定义；切线斜率仍为 2x₀。",
    precision: "读数经过舍入；两条线看起来重合，不代表斜率完全相等。",
  },
  ja: {
    diagram: "放物線、基点 P、第二点 Q、割線と接線",
    note: "曲線：y = x² · 実線の直線：割線 · 破線の直線：接線 · P：丸 · Q：四角。縮尺は固定、座標は無次元。",
    secant: "割線の傾き",
    tangent: "接線の傾き",
    error: "傾きの差の絶対値",
    undefined: "定義なし",
    coincident: "h = 0：P と Q が重なり、差商は定義されません。接線の傾きは 2x₀ です。",
    precision: "表示値は丸められています。線が重なって見えても、傾きが完全に等しいとは限りません。",
  },
};
