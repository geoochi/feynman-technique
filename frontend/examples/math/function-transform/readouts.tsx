import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <p className={s.coefficients}>
          a = {p.a.toFixed(1)} · h = {p.h.toFixed(1)} · k = {p.k.toFixed(1)}
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{p.a === 0 ? text.constant : text.vertex}</span>
          <strong>
            {p.a === 0
              ? `y = ${p.k.toFixed(1)}`
              : `(${p.h.toFixed(1)}, ${p.k.toFixed(1)})`}
          </strong>
        </div>
        <div>
          <span>{text.opening}</span>
          <strong>{p.a > 0 ? text.up : p.a < 0 ? text.down : text.flat}</strong>
        </div>
      </div>
    </>
  );
}
