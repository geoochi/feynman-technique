import type { Localized } from "../../../packages/i18n/locales";
const en = {
  staticDiagram: "Static diagram of day and night on Earth",
  diagram:
    "Earth rotates west to east; the curved arrow above the north end of the axis shows rotation",
  credit: "Surface: NASA Earth Observatory",
  noWebGL:
    "WebGL unavailable. Static diagram shown; parameters and day length still work.",
  textureFailed:
    "Earth texture failed to load. Static diagram shown; parameters and day length still work.",
  loading: "Loading Earth texture…",
  polarDay: "Polar day: the Sun stays above the horizon all day.",
  polarNight: "Polar night: the Sun stays below the horizon all day.",
  note: "West-to-east rotation (counterclockwise from north) · Blue dot: observer · 1 simulation second = 1 solar hour.",
  hour: "Local solar time",
  length: "Geometric day length",
  daytime: "Day",
  nighttime: "Night",
  altitude: "Solar altitude",
};
export const labels: Localized<Record<keyof typeof en, string>> = {
  en,
  "zh-CN": {
    staticDiagram: "地球昼夜静态示意图",
    diagram: "地球自西向东自转；地轴北端上方的弧形箭头表示自转方向",
    credit: "地表贴图：NASA Earth Observatory",
    noWebGL: "WebGL 不可用，显示静态示意图；参数与昼长计算仍可使用。",
    textureFailed: "地球贴图加载失败，显示静态示意图；参数与昼长计算仍可使用。",
    loading: "正在加载地球贴图…",
    polarDay: "此处为极昼：太阳全天在地平线上方。",
    polarNight: "此处为极夜：太阳全天在地平线下方。",
    note: "自转：自西向东（北极上方看为逆时针） · 蓝点：观察点 · 1 模拟秒 = 1 个太阳小时。",
    hour: "当前当地太阳时",
    length: "几何昼长",
    daytime: "白昼",
    nighttime: "夜晚",
    altitude: "太阳高度",
  },
  ja: {
    staticDiagram: "地球の昼と夜の静的な模式図",
    diagram: "地球は西から東へ自転。地軸の北端上の曲線矢印が自転方向を示す",
    credit: "地表画像：NASA Earth Observatory",
    noWebGL:
      "WebGL を利用できません。模式図を表示します。パラメーターと昼の長さの計算は使えます。",
    textureFailed:
      "地球の画像を読み込めませんでした。模式図を表示します。パラメーターと昼の長さの計算は使えます。",
    loading: "地球の画像を読み込んでいます…",
    polarDay: "白夜：太陽は一日中、地平線より上にあります。",
    polarNight: "極夜：太陽は一日中、地平線より下にあります。",
    note: "西から東へ自転（北極から見ると反時計回り） · 青点：観測者 · 実験の 1 秒 = 太陽時の 1 時間。",
    hour: "現在の地方太陽時",
    length: "幾何学的な昼の長さ",
    daytime: "昼",
    nighttime: "夜",
    altitude: "太陽高度",
  },
};
