import { describe, expect, it } from "vitest";
import { localizedPath, resolveRoute, locales } from "../packages/i18n/locales";
import { messages } from "../packages/i18n/messages";
import { translate } from "../packages/i18n/I18n";
describe("language routing and messages", () => {
  it("keeps existing URLs English by default and resolves explicit language prefixes", () => {
    expect(resolveRoute("/labs/pendulum")).toEqual({
      locale: "en",
      path: "/labs/pendulum",
    });
    expect(resolveRoute("/zh/labs/pendulum/")).toEqual({
      locale: "zh-CN",
      path: "/labs/pendulum",
    });
    expect(resolveRoute("/ja")).toEqual({ locale: "ja", path: "/" });
    expect(resolveRoute("/japan/labs/pendulum")).toEqual({
      locale: "en",
      path: "/japan/labs/pendulum",
    });
  });
  it("round-trips every supported language without changing the experiment slug", () => {
    for (const locale of locales)
      for (const path of [
        "/",
        "/labs/function-transform",
        "/learn/day-night",
      ])
        expect(resolveRoute(localizedPath(locale, path))).toEqual({
          locale,
          path,
        });
  });
  it("requires nonempty messages with matching interpolation placeholders", () => {
    for (const texts of Object.values(messages)) {
      const tokens = (text: string) =>
        Array.from(text.matchAll(/\{\w+\}/g), (match) => match[0]).sort();
      for (const text of texts) {
        expect(text.trim()).not.toBe("");
        expect(tokens(text)).toEqual(tokens(texts[0]));
      }
    }
    expect(translate("en", "range", { min: 0, max: 3 })).toBe("Range: 0–3");
    expect(translate("ja", "found", { count: 3 })).toBe(
      "3 件の実験が見つかりました",
    );
  });
});
