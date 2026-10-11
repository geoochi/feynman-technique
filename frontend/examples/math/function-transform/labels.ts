import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram: "Reference parabola and current function on a coordinate grid",
  note: "Solid: current function · Dashed: y = x² · Dot: vertex. Change one parameter at a time.",
  constant: "Constant function",
  vertex: "Vertex",
  opening: "Opening",
  up: "Up ↑",
  down: "Down ↓",
  flat: "Horizontal →",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "原始抛物线与当前函数的对照坐标图",
    note: "实线：当前函数 · 虚线：y = x² · 圆点：顶点。每次改变一个参数，观察图像变化。",
    constant: "常函数",
    vertex: "顶点坐标",
    opening: "开口方向",
    up: "向上 ↑",
    down: "向下 ↓",
    flat: "水平 →",
  },
  ja: {
    diagram: "基準の放物線と現在の関数を比較する座標図",
    note: "実線：現在の関数 · 破線：y = x² · 点：頂点。一度に一つのパラメーターを変えよう。",
    constant: "定数関数",
    vertex: "頂点座標",
    opening: "開く向き",
    up: "上向き ↑",
    down: "下向き ↓",
    flat: "水平 →",
  },
};
