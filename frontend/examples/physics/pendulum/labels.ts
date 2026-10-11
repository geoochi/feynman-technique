import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram: "Pendulum position, string and initial amplitude",
  note: "Solid: string · Dashed: initial amplitude · No drag; the small-angle period is approximate.",
  period: "Small-angle period",
  formula: String.raw`T_{\mathrm{small\ angle}} \approx 2\pi\sqrt{\frac{L}{g}}`,
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "单摆的位置、摆线与初始振幅",
    note: "实线：摆线 · 虚线：初始振幅 · 无阻力非线性模型，小角度周期为近似值。",
    period: "小角度近似周期",
    formula: String.raw`T_{\small\mathrm{小角度}} \approx 2\pi\sqrt{\frac{L}{g}}`,
  },
  ja: {
    diagram: "単振り子の位置、糸と初期振幅",
    note: "実線：糸 · 破線：初期振幅 · 抵抗のない非線形モデル。小角近似の周期を表示。",
    period: "小角近似の周期",
    formula: String.raw`T_{\mathrm{小角近似}} \approx 2\pi\sqrt{\frac{L}{g}}`,
  },
};
