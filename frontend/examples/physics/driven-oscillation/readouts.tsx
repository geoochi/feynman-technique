import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import {
  dampingRatio,
  naturalFrequency,
  phaseLag,
  staticDeflection,
  steadyStateAmplitude,
} from "./model";

const DEGREES = 180 / Math.PI;

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const A = steadyStateAmplitude(p);
  const phi = phaseLag(p);
  const driven = p.force > 0;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.natural} />
        <p className={s.coefficients}>
          m = {p.mass.toFixed(1)} kg · k = {p.stiffness.toFixed(0)} N/m · c ={" "}
          {p.damping.toFixed(1)} N·s/m · F₀ = {p.force.toFixed(1)} N · ω_d ={" "}
          {p.driveFrequency.toFixed(1)} rad/s
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.steadyAmplitude}</span>
          <strong>
            {Number.isFinite(A) ? A.toFixed(3) : "∞"}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.phaseLag}</span>
          <strong>
            {driven ? (phi * DEGREES).toFixed(1) : "—"}
            <small>°</small>
          </strong>
        </div>
        <div>
          <span>{text.naturalFrequency}</span>
          <strong>
            {naturalFrequency(p).toFixed(3)}
            <small>rad/s</small>
          </strong>
        </div>
        <div>
          <span>{text.dampingRatio}</span>
          <strong>{dampingRatio(p).toFixed(3)}</strong>
        </div>
        <div>
          <span>{text.staticDeflection}</span>
          <strong>
            {staticDeflection(p).toFixed(3)}
            <small>m</small>
          </strong>
        </div>
        <div>
          <span>{text.buildUp}</span>
          <strong>
            {((2 * p.mass) / p.damping).toFixed(1)}
            <small>s</small>
          </strong>
        </div>
      </div>
    </>
  );
}
