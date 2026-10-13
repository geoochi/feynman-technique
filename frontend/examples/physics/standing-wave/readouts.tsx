import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import {
  antinodePositions,
  frequency,
  modeNumber,
  nodePositions,
  wavelength,
} from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const n = modeNumber(p);
  const nodes = nodePositions(p);
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.wavelength} />
        <FormulaMarkup formula={formulas.frequency} />
        <p className={s.coefficients}>
          n = {n} · L = {p.length.toFixed(2)} m · v = {p.speed.toFixed(2)} m/s
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.mode}</span>
          <strong>{n}</strong>
        </div>
        <div>
          <span>{text.wavelength}</span>
          <strong>
            {wavelength(p).toFixed(3)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.frequency}</span>
          <strong>
            {frequency(p).toFixed(3)}
            <small>Hz</small>
          </strong>
        </div>
        <div>
          <span>{text.nodeSpacing}</span>
          <strong>
            {(p.length / n).toFixed(3)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.nodes}</span>
          <strong>{nodes.length}</strong>
        </div>
        <div>
          <span>{text.antinodes}</span>
          <strong>{antinodePositions(p).length}</strong>
        </div>
      </div>
    </>
  );
}
