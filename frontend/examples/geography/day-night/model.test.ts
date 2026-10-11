import { describe, expect, it } from "vitest";
import { dayLength, solarAltitude, solarHour } from "./model";
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
});
