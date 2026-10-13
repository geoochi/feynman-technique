import type { Model, Params } from "../../../packages/core/types";

const radians = (degrees: number) => (degrees * Math.PI) / 180;

// |cos φ| below this value means the observer is effectively at a pole, where
// tan φ is no longer usable and the daily path runs parallel to the horizon.
const POLE_COS_THRESHOLD = 1e-9;

export type DayLengthState = "normal" | "polarDay" | "polarNight";

/**
 * Semi-diurnal hour angle H₀ in radians, from cos H₀ = −tan φ tan δ.
 * Clamped to [0, π]: π means the Sun never sets (polar day) and 0 means it
 * never rises (polar night). At the poles tan φ is replaced by the sign of
 * sin φ · sin δ so the value stays finite and no division by zero occurs.
 */
export function hourAngle(latitude: number, declination: number): number {
  const phi = radians(latitude);
  const delta = radians(declination);
  if (Math.abs(Math.cos(phi)) < POLE_COS_THRESHOLD) {
    const poleProduct = Math.sin(phi) * Math.sin(delta);
    return poleProduct > 0 ? Math.PI : poleProduct < 0 ? 0 : Math.PI / 2;
  }
  const cosHourAngle = -Math.tan(phi) * Math.tan(delta);
  if (cosHourAngle <= -1) return Math.PI;
  if (cosHourAngle >= 1) return 0;
  return Math.acos(cosHourAngle);
}

/** Geometric day length in hours, always inside [0, 24]. */
export function dayLengthHours(latitude: number, declination: number): number {
  const hours = (24 * hourAngle(latitude, declination)) / Math.PI;
  return Math.min(24, Math.max(0, hours));
}

/** Latitude where polar day or polar night begins: |φ| = 90° − |δ|. */
export function polarBoundaryLatitude(declination: number): number {
  return 90 - Math.abs(declination);
}

export function dayLengthState(
  latitude: number,
  declination: number,
): DayLengthState {
  const hours = dayLengthHours(latitude, declination);
  return hours >= 24 ? "polarDay" : hours <= 0 ? "polarNight" : "normal";
}

export const model: Model = {
  initial: () => ({ tick: 0 }),
  step: (state: Params, _params: Params, dt: number) => ({
    tick: state.tick + dt,
  }),
};
