# Series and parallel circuits

In a series circuit the current is the same everywhere and the source voltage is divided between the resistors in proportion to their resistance; in a parallel circuit the branches share the same voltage and the source current is divided between them in inverse proportion to their resistance. The series equivalent resistance R_eq = R₁ + R₂ is larger than either resistor, while the parallel equivalent resistance follows 1/R_eq = 1/R₁ + 1/R₂ and is smaller than either resistor. With the same source V and the same R₁ and R₂, the series circuit draws less current and dissipates less total power, while the parallel circuit draws more of both.

## Questions
Why do the voltages across the two resistors of a series circuit add up to exactly the source voltage?

Why does the sum of the two branch currents of a parallel circuit equal the total current supplied by the source?

Why is the series equivalent resistance always larger than either resistor, while the parallel equivalent resistance is always smaller than either one?

## Predict
Before changing anything, predict whether the series current I grows or shrinks when R₁ is increased from 100 Ω to 300 Ω with V and R₂ held fixed, and how the total current of the parallel circuit changes. Write your prediction down and compare it with the experiment.

## Try
Keep V = 6 V and R₂ = 300 Ω and set R₁ to 100 Ω, then 300 Ω, then 1000 Ω. Each time record the series I, V₁ and V₂, the parallel I₁, I₂ and total I, and both equivalent resistances. Then set R₁ = R₂ = 100 Ω and vary the source voltage V to watch the currents and voltages scale.

## Observe
In series, V₁ + V₂ = V, the current is the same everywhere, and R_eq = R₁ + R₂ is larger than either resistor. In parallel, I₁ + I₂ = I, both branches share the same voltage, and R_eq is smaller than either resistor. For R₁ = R₂ = 100 Ω the series R_eq is 200 Ω and the parallel R_eq is 50 Ω. The series current is I = V/(R₁+R₂) and the parallel total current is I = V/R₁ + V/R₂ = V/R_eq. Raising R₁ from 100 Ω to 300 Ω lowers the series current and also lowers the parallel total current.

## Explain
### Why a series circuit divides voltage
A series circuit has a single path, so charge cannot pile up anywhere and the current is the same everywhere: I = V/(R₁+R₂). Ohm's law then gives the voltage across each resistor, V₁ = I·R₁ and V₂ = I·R₂, and these add up to exactly the source voltage V. The larger resistance takes the larger share of the voltage.

### Why a parallel circuit divides current
The two parallel branches are connected across the same pair of nodes, so they share the same voltage, equal to the source voltage V. Each branch current follows from Ohm's law: I₁ = V/R₁ and I₂ = V/R₂. The current supplied by the source must split between them at the node, so I = I₁ + I₂. The smaller resistance takes the larger share of the current.

### Equivalent resistance
Treat the two resistors as a single component. In series the voltages add while the current is shared, so R_eq = R₁ + R₂, larger than either resistor. In parallel the currents add while the voltage is shared, so 1/R_eq = 1/R₁ + 1/R₂ and R_eq is smaller than either resistor. When R₁ = R₂ = R the series equivalent is 2R and the parallel equivalent is R/2, exactly one quarter of it.

## Check
Take V = 6 V, R₁ = 100 Ω and R₂ = 200 Ω. In series, R_eq = 300 Ω, I = 0.02 A, V₁ = 2 V and V₂ = 4 V, with V₁ + V₂ = 6 V = V. In parallel, I₁ = 0.06 A, I₂ = 0.03 A and I = 0.09 A, with I₁ + I₂ = I; R_eq = 200/3 ≈ 66.7 Ω and the total power is P = V·I = 0.54 W. Check both again with P = V²/R_eq.

## Explore further
When the two resistors are equal (R₁ = R₂ = R) the parallel equivalent resistance is exactly one quarter of the series equivalent; derive this yourself. You can also change the ratio of R₁ to R₂ and watch how the voltage and current splits follow it. To compare how another experiment describes change with a formula, read [Thin lens and images](/labs/thin-lens).
