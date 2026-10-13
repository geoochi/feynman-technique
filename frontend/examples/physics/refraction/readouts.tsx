import { useI18n } from "../../../packages/i18n/I18n";
import { labels } from "./labels";
import type { ReadoutProps } from "../../../packages/core/types";
import { FormulaMarkup } from "../../../packages/ui/FormulaMarkup";
import s from "../../../packages/ui/Scene.module.css";
import {
  criticalAngle,
  isTotalInternalReflection,
  refractedAngle,
} from "./model";

export function Readouts({ params: p, formulas }: ReadoutProps) {
  const { locale } = useI18n();
  const text = labels[locale];
  const { theta1, n1, n2 } = p;
  const theta2 = refractedAngle(n1, n2, theta1);
  const thetaC = criticalAngle(n1, n2);
  const totalInternal = isTotalInternalReflection(n1, n2, theta1);
  const state = totalInternal
    ? text.stateTotalInternal
    : theta1 < 1e-9
      ? text.stateUndeviated
      : text.stateRefracted;
  return (
    <>
      <div className={s.formula}>
        <FormulaMarkup formula={formulas.default} />
        <FormulaMarkup formula={formulas.critical} />
        <p className={s.coefficients}>
          θ₁ = {theta1.toFixed(1)}° · n₁ = {n1.toFixed(2)} · n₂ ={" "}
          {n2.toFixed(2)}
        </p>
      </div>
      <div className={s.readings}>
        <div>
          <span>{text.refraction}</span>
          <strong>
            {theta2 === null ? text.notApplicable : theta2.toFixed(1)}
            {theta2 !== null && <small>°</small>}
          </strong>
        </div>
        <div>
          <span>{text.critical}</span>
          <strong>
            {thetaC === null ? text.noCritical : thetaC.toFixed(1)}
            {thetaC !== null && <small>°</small>}
          </strong>
        </div>
        <div>
          <span>{text.incidence}</span>
          <strong>
            {theta1.toFixed(1)}
            <small>°</small>
          </strong>
        </div>
        <div>
          <span>{text.state}</span>
          <strong>{state}</strong>
        </div>
      </div>
    </>
  );
}
