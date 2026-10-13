import type { Localized } from "../../../packages/i18n/locales";
const en = {
  diagram:
    "Day length as a function of latitude for the current solar declination, with the polar-day and polar-night boundaries",
  note: "Solid: day length versus latitude for the current δ · Dashed vertical lines: polar boundaries at |φ| = 90° − |δ| · Dot: current latitude. Change δ to compare seasons.",
  latitude: "Latitude",
  declination: "Solar declination",
  dayLength: "Geometric day length",
  boundary: "Polar boundary",
  normal: "Ordinary day: the Sun rises and sets.",
  polarDay: "Polar day: 24 h of daylight.",
  polarNight: "Polar night: 0 h of daylight.",
  twelveHour: "12 h",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    diagram: "当前太阳赤纬下昼长随纬度变化的曲线图，并标出极昼与极夜边界",
    note: "实线：当前 δ 下的昼长随纬度变化 · 竖直虚线：极昼极夜边界 |φ| = 90° − |δ| · 圆点：当前纬度。改变 δ 可以比较不同季节。",
    latitude: "纬度",
    declination: "太阳赤纬",
    dayLength: "几何昼长",
    boundary: "极昼极夜边界",
    normal: "普通日：太阳升起又落下。",
    polarDay: "极昼：全天 24 小时受光。",
    polarNight: "极夜：全天 0 小时受光。",
    twelveHour: "12 h",
  },
  ja: {
    diagram: "現在の太陽赤緯における昼の長さと緯度の関係、および白夜・極夜の境界",
    note: "実線：現在の δ における昼の長さ · 縦の破線：白夜・極夜の境界 |φ| = 90° − |δ| · 点：現在の緯度。δ を変えて季節を比べよう。",
    latitude: "緯度",
    declination: "太陽赤緯",
    dayLength: "幾何学的な昼の長さ",
    boundary: "白夜・極夜の境界",
    normal: "ふつうの日：太陽が昇り、沈む。",
    polarDay: "白夜：一日中 24 時間、光が当たる。",
    polarNight: "極夜：一日中 0 時間、光が当たる。",
    twelveHour: "12 h",
  },
};
