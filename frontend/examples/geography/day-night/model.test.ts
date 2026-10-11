import { describe, expect, it } from "vitest";
import { dayLength, solarAltitude, solarHour, earthRotation } from "./model";
describe("solar geometry", () => {
  it("has 12 hours of daylight at equinox", () => {
    for (const phi of [-89, -45, 0, 45, 89])
      expect(dayLength(phi, 0)).toBeCloseTo(12, 10);
  });
  it("passes equatorial sunrise, noon and midnight", () => {
    expect(solarAltitude(0, 0, 6)).toBeCloseTo(0, 10);
    expect(solarAltitude(0, 0, 12)).toBeCloseTo(90, 10);
    expect(solarAltitude(0, 0, 0)).toBeCloseTo(-90, 10);
  });
  it("handles polar day and night", () => {
    expect(dayLength(75, 23.44)).toBe(24);
    expect(dayLength(75, -23.44)).toBe(0);
  });
  it("is symmetric between hemispheres and seasons", () => {
    expect(dayLength(40, 23.44)).toBeCloseTo(dayLength(-40, -23.44), 10);
    expect(dayLength(40, 23.44) + dayLength(40, -23.44)).toBeCloseTo(24, 10);
  });
  it("wraps solar time at midnight", () => {
    expect(solarHour({ hour: 23 }, { elapsedHours: 2 })).toBe(1);
  });
  it("places the rising sun in the east and setting sun in the west", () => {
    // Rotate the observer's local east tangent (0, 0, 1) around north (+Y).
    // Sun points toward -X. Its dot product with east must change +1 to -1.
    const sunAlongEast = (hour: number) => -Math.sin(earthRotation(hour));
    expect(sunAlongEast(6)).toBeCloseTo(1, 10);
    expect(sunAlongEast(18)).toBeCloseTo(-1, 10);
  });
  it("keeps scene illumination consistent with solar altitude", () => {
    for (const latitude of [-75, 0, 31.2, 75])
      for (const declination of [-23.44, 0, 23.44])
        for (const hour of [0, 6, 9, 12, 18, 23]) {
          const phi = (latitude * Math.PI) / 180;
          const delta = (declination * Math.PI) / 180;
          const angle = earthRotation(hour);
          const normal = [
            -Math.cos(phi) * Math.cos(angle),
            Math.sin(phi),
            Math.cos(phi) * Math.sin(angle),
          ];
          const sun = [-Math.cos(delta), Math.sin(delta), 0];
          const illumination = normal.reduce(
            (sum, value, i) => sum + value * sun[i],
            0,
          );
          expect(illumination).toBeCloseTo(
            Math.sin(
              (solarAltitude(latitude, declination, hour) * Math.PI) / 180,
            ),
            10,
          );
        }
  });
});
