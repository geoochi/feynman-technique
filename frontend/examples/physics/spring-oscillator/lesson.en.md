# Spring and period

For an ideal horizontal spring-mass oscillator the period is T = 2π√(m/k): a heavier mass oscillates more slowly, a stiffer spring more quickly, and the amplitude does not change the period at all. The experiment animates the block and shows how kinetic and potential energy trade places while their total stays constant. It is a natural companion to [Pendulum and time](/labs/pendulum), where the period depends on length rather than on mass.

## Questions
How does the period change when you quadruple the mass and keep the same spring?

What happens to the period if you make the spring four times stiffer?

Does pulling the block farther from equilibrium before releasing it change the time of one oscillation?

## Predict
If the mass quadruples while the stiffness stays the same, does the period double, halve, or stay the same? Write your prediction before you compare.

## Try
Release the block from 0.2 m and press Play. Pause, set the mass to 4 kg, and time one full oscillation again. Then restore the mass and raise the stiffness from 20 N/m to 80 N/m. Changing a parameter restarts the model from rest at the chosen displacement.

## Observe
A larger mass oscillates more slowly; a stiffer spring oscillates faster. The block moves fastest as it passes the equilibrium point x = 0 and is momentarily at rest at the extremes. With no damping the motion never stops, and a larger starting displacement only makes the block travel farther, not slower.

## Explain
### Why does the period depend on mass and stiffness?
The spring obeys Hooke's law, F = −k x, so Newton's second law gives m x″ = −k x, that is x″ = −(k/m) x. The solution is x(t) = x₀ cos(ωt) with ω = √(k/m), so the period is T = 2π/ω = 2π√(m/k). Quadrupling m doubles T; quadrupling k halves T.

### Why is the period independent of amplitude?
The equation x″ = −(k/m) x is linear: the restoring force is exactly proportional to the displacement. Scaling the initial displacement by any factor scales the whole motion by that same factor, so the time for one cycle is unchanged. Amplitude changes how far and how fast the block moves, not how long a cycle takes.

### Where does the energy go?
The mechanical energy is E = ½ k x² + ½ m v². At the extremes the energy is all potential (v = 0); at x = 0 it is all kinetic (x = 0). With no damping the total stays constant. The fixed simulation step is 1/120 s, split into RK4 substeps of 1/960 s, so the numerical solution carries a small error and is not exact.

## Check
Quadrupling the mass from 1 kg to 4 kg should double the displayed period; quadrupling the stiffness from 20 N/m to 80 N/m should halve it. Changing only the initial displacement should leave the period unchanged. At x₀ = 0 the block stays at rest, so the displayed period describes a small oscillation around that equilibrium.

## Explore further
Real springs lose energy to internal friction and air drag, and a real spring has its own mass. How would damping change the energy over time? When does the massless-spring assumption stop being useful? Compare with the [pendulum](/labs/pendulum), where the period depends on length rather than on mass.
