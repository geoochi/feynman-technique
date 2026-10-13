import type { Localized } from "../../../packages/i18n/locales";

const en = {
  diagram:
    "Circuit of one source and one resistor beside the current–voltage characteristic line",
  note: "Fixed frame: the voltage axis runs 0–12 V and the current axis 0–6 A, so changing a parameter moves the operating point instead of rescaling the picture. The circuit is schematic. The resistance is kept at 1 Ω or more, so the loop is never an ideal short circuit and the current always stays finite.",
  circuitTitle: "Circuit",
  plotTitle: "I–V characteristic",
  axisVoltage: "V / V",
  axisCurrent: "I / A",
  sourceVoltage: "V",
  resistance: "R",
  currentArrow: "I",
  operatingPoint: "Operating point",
  offFrame: "Operating point above the frame (I > 6 A)",
  current: "Current I",
  power: "Power P",
};

export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "一个电源与一个电阻组成的回路，以及电流—电压特性直线",
    note: "固定坐标框：电压轴 0–12 V、电流轴 0–6 A，改变参数时只有工作点在框内移动，画面不会缩放。电路为示意。电阻始终不小于 1 Ω，因此回路不会是理想短路，电流始终有限。",
    circuitTitle: "电路",
    plotTitle: "伏安特性",
    axisVoltage: "V / V",
    axisCurrent: "I / A",
    sourceVoltage: "V",
    resistance: "R",
    currentArrow: "I",
    operatingPoint: "工作点",
    offFrame: "工作点超出画面（I > 6 A）",
    current: "电流 I",
    power: "功率 P",
  },
  ja: {
    diagram: "1 つの電源と 1 つの抵抗からなる回路と、電流—電圧特性の直線",
    note: "固定フレーム：電圧軸は 0–12 V、電流軸は 0–6 A。パラメーターを変えても動作点が枠内を動くだけで、図は拡大縮小しない。回路は模式図。抵抗は常に 1 Ω 以上なので、回路が理想的な短絡になることはなく、電流は常に有限である。",
    circuitTitle: "回路",
    plotTitle: "電流—電圧特性",
    axisVoltage: "V / V",
    axisCurrent: "I / A",
    sourceVoltage: "V",
    resistance: "R",
    currentArrow: "I",
    operatingPoint: "動作点",
    offFrame: "動作点が画面外（I > 6 A）",
    current: "電流 I",
    power: "電力 P",
  },
};
