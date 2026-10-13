import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram: "Riemann rectangles and the curve y = x² on a fixed coordinate grid",
  note: "Fixed scale: 0.5 per horizontal grid cell and 1 per vertical cell, so changing a parameter moves the rectangles instead of rescaling the picture. Curve: y = x² · Bars: Riemann rectangles · Dots: sampling points.",
  approximation: "Riemann sum",
  exact: "Exact value",
  error: "Error (sum − exact)",
  width: "Subinterval width Δx",
  sampling: "Sampling",
  left: "Left edge (s = 0)",
  right: "Right edge (s = 1)",
  midpoint: "Midpoint (s = 0.5)",
  custom: "Interior point",
  zeroInterval: "a = b: the interval has zero length, so every sum is exactly 0.",
  signed:
    "The readout is the signed integral ∫ₐᵇ f(x) dx. Because f(x) = x² is never negative, it equals the geometric area under the curve; a function that dipped below the axis would make the two differ.",
  under: "On the increasing part of f, sampling the left edge underestimates the area.",
  over: "On the increasing part of f, sampling the right edge overestimates the area.",
  mixed:
    "The interval crosses the vertex at x = 0, so edge sums mix over- and under-estimates.",
  interior:
    "Sampling inside each subinterval balances the errors of the two edges.",
  xAxis: "x",
  yAxis: "y",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "固定坐标网格上曲线 y = x² 与黎曼矩形",
    note: "固定比例尺：横向每格 0.5、纵向每格 1，改变参数时图形只移动、不缩放。曲线：y = x² · 矩形：黎曼和 · 圆点：采样点。",
    approximation: "黎曼和（近似值）",
    exact: "精确值",
    error: "误差（和 − 精确值）",
    width: "子区间宽度 Δx",
    sampling: "采样方式",
    left: "左端点（s = 0）",
    right: "右端点（s = 1）",
    midpoint: "中点（s = 0.5）",
    custom: "内部点",
    zeroInterval: "a = b：区间长度为零，所有和都恰好为 0。",
    signed:
      "读数显示的是带符号定积分 ∫ₐᵇ f(x) dx。由于 f(x) = x² 不会取负值，它与曲线下的几何面积相等；若函数出现负值，两者就会不同。",
    under: "在 f 递增的区间上，取左端点会使面积偏小。",
    over: "在 f 递增的区间上，取右端点会使面积偏大。",
    mixed: "区间跨过顶点 x = 0，两端采样都同时包含偏大与偏小。",
    interior: "在子区间内部采样，可以平衡两端带来的误差。",
    xAxis: "x",
    yAxis: "y",
  },
  ja: {
    diagram: "固定した座標格子の上に描いた y = x² の曲線とリーマン和の長方形",
    note: "固定スケール：横 1 目盛 0.5、縦 1 目盛 1。パラメーターを変えても図は拡大縮小せず、長方形が動く。曲線：y = x² · 長方形：リーマン和 · 点：標本点。",
    approximation: "リーマン和（近似値）",
    exact: "正確な値",
    error: "誤差（和 − 正確な値）",
    width: "小区間の幅 Δx",
    sampling: "標本の取り方",
    left: "左端（s = 0）",
    right: "右端（s = 1）",
    midpoint: "中点（s = 0.5）",
    custom: "内部の点",
    zeroInterval: "a = b：区間の長さが 0 なので、どの和も正確に 0 になる。",
    signed:
      "表示は符号付き定積分 ∫ₐᵇ f(x) dx です。f(x) = x² は負にならないため、曲線下の図形の面積と一致します。負の値をとる関数では両者は異なります。",
    under: "f が増加する区間では、左端をとると面積を過小評価する。",
    over: "f が増加する区間では、右端をとると面積を過大評価する。",
    mixed:
      "区間が頂点 x = 0 をまたぐため、両端の和には過小と過大が混ざる。",
    interior:
      "小区間の内部で標本をとると、両端の誤差が打ち消し合う。",
    xAxis: "x",
    yAxis: "y",
  },
};
