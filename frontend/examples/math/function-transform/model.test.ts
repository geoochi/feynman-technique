import { describe, expect, it } from "vitest";
import { evaluate } from "./model";
describe("function transformations", () => {
  it("passes known points for translation and inversion", () => {
    expect(evaluate(2, { a: -2, h: 2, k: 3 })).toBe(3);
    expect(evaluate(3, { a: -2, h: 2, k: 3 })).toBe(1);
    expect(evaluate(1, { a: -2, h: 2, k: 3 })).toBe(1);
  });
  it("degenerates to a constant at a=0", () => {
    for (const x of [-10, 0, 10])
      expect(evaluate(x, { a: 0, h: 3, k: 2 })).toBe(2);
  });
});
