import type { Model, Params } from "../../../packages/core/types";

/**
 * Refraction at an ideal plane interface between two media.
 *
 *   n₁ sin θ₁ = n₂ sin θ₂
 *
 *   θ₁  incidence angle, measured from the normal, inside medium 1.
 *   θ₂  refraction angle, measured from the normal, inside medium 2.
 *   n₁  refractive index of the medium the light comes from.
 *   n₂  refractive index of the medium the light enters.
 *
 * Consequences used by this case:
 *   θ₁ = 0        -> sin θ₂ = 0, so θ₂ = 0: normal incidence is not deviated.
 *   n₁ = n₂       -> θ₂ = θ₁: no change of direction at the interface.
 *   n₁ > n₂       -> there is a critical angle with sin θc = n₂/n₁; for
 *                    θ₁ > θc no real θ₂ satisfies the equation and the ray is
 *                    totally internally reflected.
 *
 * Only the directions are modelled. The intensity split between the reflected
 * and the refracted beam (Fresnel reflectance and transmittance) is NOT part of
 * this model, so the helpers below never report how much light goes each way.
 *
 * The helpers return `null` for cases in which no refracted ray exists (total
 * internal reflection, or a non-physical index) instead of returning NaN.
 */

const DEG = Math.PI / 180;

// Angles are compared with a tolerance so that a ray exactly at the critical
// angle counts as grazing refraction (θ₂ = 90°), not as total reflection.
const ANGLE_TOLERANCE = 1e-9;

/**
 * Critical angle in degrees, or `null` when total internal reflection is
 * impossible. From sin θc = n₂/n₁ this exists only for n₁ > n₂.
 */
export function criticalAngle(n1: number, n2: number): number | null {
  if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;
  if (n1 <= 0 || n2 <= 0) return null;
  const ratio = n2 / n1;
  if (!(ratio < 1)) return null;
  return Math.asin(ratio) / DEG;
}

/** Whether the ray is totally internally reflected (no refracted ray). */
export function isTotalInternalReflection(
  n1: number,
  n2: number,
  theta1Deg: number,
): boolean {
  if (!Number.isFinite(theta1Deg)) return false;
  const critical = criticalAngle(n1, n2);
  if (critical === null) return false;
  return theta1Deg > critical + ANGLE_TOLERANCE;
}

/**
 * Refraction angle θ₂ in degrees, or `null` when there is no refracted ray
 * (total internal reflection) or the indices are not physical. Never NaN.
 */
export function refractedAngle(
  n1: number,
  n2: number,
  theta1Deg: number,
): number | null {
  if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;
  if (n1 <= 0 || n2 <= 0) return null;
  if (!Number.isFinite(theta1Deg)) return null;
  if (isTotalInternalReflection(n1, n2, theta1Deg)) return null;
  const sine = (n1 * Math.sin(theta1Deg * DEG)) / n2;
  // Clamp the rounding residue at the grazing limit so asin stays finite.
  return Math.asin(Math.min(1, Math.max(-1, sine))) / DEG;
}

/**
 * A static case: nothing evolves with time. The state is a single bounded
 * number so that snapshot validation still has a real field to check.
 */
export const model: Model = {
  initial: (_params: Params) => ({ value: 0 }),
  step: (state: Params, _params: Params, _dt: number) => ({
    value: state.value,
  }),
};
