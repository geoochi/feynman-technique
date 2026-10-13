import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram:
    "A point rotating counterclockwise on a circle, with its height traced as a sine curve against time",
  note: "Fixed frame: the circle panel shows ±2 units and the time axis a fixed 12 s window that scrolls with the trace, so changing a parameter moves the drawing instead of rescaling it. Angles are entered and shown in degrees but computed in radians. The point turns counterclockwise, and y = R sin(ωt + φ₀) is drawn analytically while the phase advances by ω·dt at the fixed step dt = 1/120 s.",
  circleTitle: "Rotating point",
  curveTitle: "Projection against time",
  axisX: "x / m",
  axisY: "y / m",
  axisTime: "t / s",
  unitCircle: "Unit circle",
  generalCircle: "General circle",
  clipped: "R exceeds the fixed ±2 frame: the drawing is clipped, not rescaled.",
  amplitude: "Amplitude A (= R)",
  period: "Period T",
  angularSpeed: "Angular speed ω",
  phaseNow: "Phase θ (degrees)",
  readoutNote:
    "T = 2π/ω. Doubling ω halves the period, while changing R changes only the amplitude.",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "圆周上逆时针转动的一点，其高度随时间描成正弦曲线",
    note: "画面固定：圆面板显示 ±2 个单位，时间轴为固定 12 s 的窗口并随轨迹滚动，因此改变参数时图形只移动、不缩放。角度用度输入和显示，但计算使用弧度。点沿逆时针方向转动；曲线按解析式 y = R sin(ωt + φ₀) 绘制，相位在每个固定步长 dt = 1/120 s 内增加 ω·dt。",
    circleTitle: "转动的点",
    curveTitle: "投影随时间的变化",
    axisX: "x / m",
    axisY: "y / m",
    axisTime: "t / s",
    unitCircle: "单位圆",
    generalCircle: "一般圆",
    clipped: "R 超出固定的 ±2 画面：图形被裁剪，而不是改变比例尺。",
    amplitude: "振幅 A（= R）",
    period: "周期 T",
    angularSpeed: "角速度 ω",
    phaseNow: "相位 θ（度）",
    readoutNote:
      "T = 2π/ω。ω 加倍，周期减半；改变 R 只改变振幅，不改变周期。",
  },
  ja: {
    diagram:
      "円周上を反時計回りに回る点と、その高さが時間に対して描くサイン曲線",
    note: "画面は固定：円パネルは ±2 単位、時間軸は 12 s の固定窓で軌跡とともにスクロールする。パラメーターを変えても図は平行移動のみで、拡大縮小しない。角度は度で入力・表示するが、計算はラジアンで行う。点は反時計回りに回り、軌跡は解析式 y = R sin(ωt + φ₀) で描く。位相は固定刻み dt = 1/120 s ごとに ω·dt だけ進む。",
    circleTitle: "回転する点",
    curveTitle: "時間に対する射影",
    axisX: "x / m",
    axisY: "y / m",
    axisTime: "t / s",
    unitCircle: "単位円",
    generalCircle: "一般の円",
    clipped:
      "R が固定の ±2 の画面を超えています。図は切り取られ、縮尺は変わりません。",
    amplitude: "振幅 A（= R）",
    period: "周期 T",
    angularSpeed: "角速度 ω",
    phaseNow: "位相 θ（度）",
    readoutNote:
      "T = 2π/ω。ω を 2 倍にすると周期は半分。R を変えても振幅だけが変わり、周期は変わらない。",
  },
};
