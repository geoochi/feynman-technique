import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram: "Spring-mass oscillator: block position, spring and equilibrium line",
  note: "Solid: spring · Dashed: equilibrium at x = 0 · No damping; the displayed period is the analytic value.",
  period: "Analytic period",
  kinetic: "Kinetic energy",
  potential: "Potential energy",
  total: "Total energy",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "弹簧振子的滑块位置、弹簧与平衡位置",
    note: "实线：弹簧 · 虚线：平衡位置 x = 0 · 无阻尼模型，显示的周期为解析值。",
    period: "解析周期",
    kinetic: "动能",
    potential: "势能",
    total: "总机械能",
  },
  ja: {
    diagram: "ばね振り子の物体の位置、ばねとつり合いの位置",
    note: "実線：ばね · 破線：つり合いの位置 x = 0 · 減衰なし。表示する周期は解析値。",
    period: "解析周期",
    kinetic: "運動エネルギー",
    potential: "位置エネルギー",
    total: "力学的エネルギー",
  },
};
