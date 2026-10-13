import { describe, expect, it } from "vitest";
import {
  dayLengthHours,
  dayLengthState,
  hourAngle,
  polarBoundaryLatitude,
} from "./model";

const SOLSTICE = 23.44;
const EQUINOX = 0;
const LATITUDES = [-90, -66.56, -45, -23.44, 0, 23.44, 45, 66.56, 90];
const DECLINATIONS = [-23.44, -12, 0, 12, 23.44];

describe("day length versus latitude", () => {
  it("keeps the equator at 12 hours for every solar declination", () => {
    for (const declination of DECLINATIONS)
      expect(dayLengthHours(0, declination)).toBeCloseTo(12, 12);
  });

  it("gives 12 hours at every latitude on the equinox", () => {
    for (const latitude of LATITUDES)
      expect(dayLengthHours(latitude, EQUINOX)).toBeCloseTo(12, 12);
  });

  it("matches the closed form at known latitudes on the June solstice", () => {
    expect(dayLengthHours(23.44, SOLSTICE)).toBeCloseTo(13.444664, 5);
    expect(dayLengthHours(45, SOLSTICE)).toBeCloseTo(15.425892, 5);
    expect(dayLengthHours(60, SOLSTICE)).toBeCloseTo(18.489830, 5);
    expect(dayLengthHours(-45, SOLSTICE)).toBeCloseTo(8.574108, 5);
  });

  it("increases with latitude when the declination is positive", () => {
    let previous = -1;
    for (let latitude = -90; latitude <= 90; latitude += 1) {
      const hours = dayLengthHours(latitude, SOLSTICE);
      expect(hours).toBeGreaterThanOrEqual(previous);
      previous = hours;
    }
    expect(previous).toBe(24);
  });
});

describe("polar day and polar night boundaries", () => {
  it("places the boundary at |φ| = 90° − |δ|", () => {
    expect(polarBoundaryLatitude(0)).toBe(90);
    expect(polarBoundaryLatitude(SOLSTICE)).toBeCloseTo(66.56, 10);
    expect(polarBoundaryLatitude(-SOLSTICE)).toBeCloseTo(66.56, 10);
  });

  it("reaches 24 h and 0 h exactly at the boundary latitude", () => {
    const boundary = polarBoundaryLatitude(SOLSTICE);
    expect(dayLengthHours(boundary, SOLSTICE)).toBe(24);
    expect(dayLengthHours(-boundary, SOLSTICE)).toBe(0);
    expect(dayLengthHours(boundary, -SOLSTICE)).toBe(0);
    expect(dayLengthHours(-boundary, -SOLSTICE)).toBe(24);
  });

  it("stays below 24 h just inside the boundary", () => {
    const boundary = polarBoundaryLatitude(SOLSTICE);
    // The curve is steep close to the boundary: 66.5° is 0.06° inside it.
    expect(dayLengthHours(66.5, SOLSTICE)).toBeCloseTo(23.421842, 5);
    expect(dayLengthHours(boundary - 0.5, SOLSTICE)).toBeCloseTo(22.342680, 5);
    const inside = dayLengthHours(boundary - 0.5, SOLSTICE);
    expect(inside).toBeGreaterThan(12);
    expect(inside).toBeLessThan(24);
  });

  it("labels the three regimes consistently with the curve", () => {
    expect(dayLengthState(75, SOLSTICE)).toBe("polarDay");
    expect(dayLengthState(75, -SOLSTICE)).toBe("polarNight");
    expect(dayLengthState(45, SOLSTICE)).toBe("normal");
    expect(dayLengthState(0, EQUINOX)).toBe("normal");
  });
});

describe("pole degeneracy", () => {
  it("returns 12 h, 24 h or 0 h at the poles without invalid numbers", () => {
    for (const latitude of [90, -90]) {
      expect(dayLengthHours(latitude, EQUINOX)).toBeCloseTo(12, 12);
      expect(dayLengthHours(latitude, SOLSTICE)).toBe(latitude > 0 ? 24 : 0);
      expect(dayLengthHours(latitude, -SOLSTICE)).toBe(latitude > 0 ? 0 : 24);
    }
  });

  it("keeps the hour angle finite and inside [0, π] everywhere", () => {
    for (const latitude of LATITUDES)
      for (const declination of DECLINATIONS) {
        const angle = hourAngle(latitude, declination);
        expect(Number.isFinite(angle)).toBe(true);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThanOrEqual(Math.PI);
      }
  });

  it("clamps every day length into [0, 24]", () => {
    for (let latitude = -90; latitude <= 90; latitude += 0.5)
      for (const declination of DECLINATIONS) {
        const hours = dayLengthHours(latitude, declination);
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThanOrEqual(24);
      }
  });
});

describe("symmetries of the curve", () => {
  it("mirrors the two hemispheres when the declination changes sign", () => {
    for (const latitude of [-66.56, -45, -23.44, 0, 23.44, 45, 66.56])
      expect(dayLengthHours(latitude, SOLSTICE)).toBeCloseTo(
        dayLengthHours(-latitude, -SOLSTICE),
        10,
      );
  });

  it("splits the year into complementary days at a fixed latitude", () => {
    for (const latitude of [-66.56, -45, -23.44, 0, 23.44, 45, 66.56])
      expect(
        dayLengthHours(latitude, SOLSTICE) +
          dayLengthHours(latitude, -SOLSTICE),
      ).toBeCloseTo(24, 10);
  });
});
