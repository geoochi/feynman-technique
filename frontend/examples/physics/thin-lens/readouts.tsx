import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import { imageDistance, imageKind, magnification } from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const { u, f, h } = p;
  const v = imageDistance(u, f);
  const m = magnification(u, f);
  const kind = imageKind(u, f);
  const finite = Number.isFinite(v);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.magnification} />
        <p className={s.coefficients}>
          u = {u.toFixed(2)} m · f = {f.toFixed(2)} m · h = {h.toFixed(2)} m
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.imageDistance}</span>
          <strong>
            {finite ? v.toFixed(3) : "∞"}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.magnification}</span>
          <strong>
            {finite ? m.toFixed(2) : "∞"}
            <small>×</small>
          </strong>
        </div>
        <div>
          <span>{text.imageKind}</span>
          <strong>
            {kind === "real"
              ? text.real
              : kind === "virtual"
                ? text.virtual
                : text.infinite}
          </strong>
        </div>
        <div>
          <span>{text.orientation}</span>
          <strong>
            {kind === "real"
              ? text.inverted
              : kind === "virtual"
                ? text.upright
                : text.notApplicable}
          </strong>
        </div>
      </div>
    </>
  );
}
