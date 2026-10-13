import type { Model, Params } from "../../../packages/core/types";

/**
 * Sign convention (Chinese textbook / 人教版 convention).
 *
 *   1/u + 1/v = 1/f
 *
 *   u > 0  object distance, always on the incident side of the lens.
 *   f > 0  focal length of a converging (convex) lens.
 *   v > 0  real image on the far side of the lens.
 *   v < 0  virtual image on the same side as the object.
 *
 * The lateral magnification is signed as m = -v / u, so
 *   m < 0  inverted image (always real here),
 *   m > 0  upright image (always virtual here),
 *   |m|    the size ratio image height / object height.
 *
 * When u = f the equation gives 1/v = 0, i.e. no finite image: the outgoing
 * rays are parallel. The helpers below guard that pole explicitly, so they
 * never divide by zero.
 */

// Relative tolerance for treating an object as sitting exactly on the focal plane.
const FOCAL_TOLERANCE = 1e-9;

export type ImageKind = "real" | "virtual" | "infinite";

/** Signed image distance v from the thin-lens equation; Infinity when u = f. */
export function imageDistance(u: number, f: number): number {
  const denominator = u - f;
  if (Math.abs(denominator) <= FOCAL_TOLERANCE * Math.max(1, Math.abs(f)))
    return Number.POSITIVE_INFINITY;
  return (u * f) / denominator;
}

/** Signed lateral magnification m = -v / u; Infinity when u = f. */
export function magnification(u: number, f: number): number {
  if (u === 0) return Number.NaN; // outside the documented domain u > 0
  const v = imageDistance(u, f);
  if (!Number.isFinite(v)) return Number.POSITIVE_INFINITY;
  return -v / u;
}

/** Nature of the image from the sign of v. */
export function imageKind(u: number, f: number): ImageKind {
  const v = imageDistance(u, f);
  if (!Number.isFinite(v)) return "infinite";
  return v > 0 ? "real" : "virtual";
}

/** Signed image height h' = m h. */
export function imageHeight(u: number, f: number, h: number): number {
  return magnification(u, f) * h;
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
