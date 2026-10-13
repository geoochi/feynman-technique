import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram:
    "Two waves travelling in the +x direction and their sum, drawn on a shared x-axis",
  note: "Both waves travel in the +x direction at the same speed · no boundaries, no reflections, no damping · the sum is the algebraic sum of the two displacements at each point.",
  resultant: "Resultant amplitude",
  phase: "Phase difference",
  wavenumber: "Wave number k",
  amplitude1: "Amplitude of wave 1",
  amplitude2: "Amplitude of wave 2",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "沿 +x 方向传播的两列波及其合位移，共用同一 x 轴",
    note: "两列波以相同速度沿 +x 方向传播 · 无边界、无反射、无衰减 · 合位移是每一点两列波位移的代数和。",
    resultant: "合振幅",
    phase: "相位差",
    wavenumber: "波数 k",
    amplitude1: "第一列波的振幅",
    amplitude2: "第二列波的振幅",
  },
  ja: {
    diagram: "+x 方向へ進む2つの波とその合成変位を、共通の x 軸に描いた図",
    note: "2つの波は同じ速さで +x 方向へ進む · 境界・反射・減衰なし · 合成変位は各点での2つの変位の代数和。",
    resultant: "合成振幅",
    phase: "位相差",
    wavenumber: "波数 k",
    amplitude1: "第1の波の振幅",
    amplitude2: "第2の波の振幅",
  },
};
