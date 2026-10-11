import type { Model, Params } from "../../../packages/core/types";
const radians = (degrees: number) => (degrees * Math.PI) / 180;
// Positive rotation around the north axis follows eastward longitude on the map.
export function earthRotation(hour: number) {
  return radians((hour - 12) * 15);
}
export function solarAltitude(
  latitude: number,
  declination: number,
  hour: number,
) {
  const phi = radians(latitude),
    delta = radians(declination),
    H = earthRotation(hour);
  return (
    (Math.asin(
      Math.max(
        -1,
        Math.min(
          1,
          Math.sin(phi) * Math.sin(delta) +
            Math.cos(phi) * Math.cos(delta) * Math.cos(H),
        ),
      ),
    ) *
      180) /
    Math.PI
  );
}
export function dayLength(latitude: number, declination: number) {
  const x = -Math.tan(radians(latitude)) * Math.tan(radians(declination));
  return x <= -1 ? 24 : x >= 1 ? 0 : (24 * Math.acos(x)) / Math.PI;
}
export function solarHour(p: Params, s: Params) {
  return (((p.hour + s.elapsedHours) % 24) + 24) % 24;
}
export const model: Model = {
  initial: () => ({ elapsedHours: 0 }),
  step: (s, _p, dt) => ({ elapsedHours: s.elapsedHours + dt }),
};
