import type { PreparedFormula } from "../core/types";
// Only markup compiled from validated, trusted static formula data reaches this component.
export function FormulaMarkup({ formula }: { formula: PreparedFormula }) {
  return (
    <div
      aria-label={formula.math}
      dangerouslySetInnerHTML={{ __html: formula.html }}
    />
  );
}
