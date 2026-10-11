# Pendulum and time

## Questions
How many times longer is the period when the length increases from 0.5 m to 2 m?

At a fixed length, does stronger gravity make the pendulum swing faster or slower?

Is the small-angle period still accurate when the initial angle increases from 5° to 70°?

## Predict
If the length quadruples while gravity and the small amplitude stay the same, does the period also quadruple? Make a prediction before comparing.

## Try
Set the initial angle to 5°, press Play, and watch the time needed to return to the highest point on the same side. Pause, change the length from 0.5 m to 2 m, and compare again. Changing a parameter restarts the model from release at rest.

## Observe
A longer pendulum swings more slowly; stronger gravity makes it swing faster. The bob is fastest at the bottom and momentarily at rest at either end. With no drag, this model does not stop on its own.

## Explain
The nonlinear equation θ″ = −(g/L) sin θ describes the motion. Only for small angles does sin θ ≈ θ, giving the approximate period T ≈ 2π√(L/g). The displayed period is this approximation; the motion itself uses RK4 integration of the nonlinear equation.

Energy per unit mass is E/m = ½(Lω)² + gL(1 − cos θ), in J/kg. The fixed simulation step is 1/120 s, split into two RK4 steps of 1/240 s. The numerical solution has error and is not exact.

## Check
Changing the length from 0.5 m to 2 m should approximately double the small-angle period. Then set the initial angle to 70° and check whether the actual return time is longer. At an initial angle of zero the bob stays still; the displayed period describes a small perturbation of that equilibrium.

## Explore further
Real pendulums lose energy to air resistance and pivot friction. How would damping change the energy? When do the point-mass and inextensible-string assumptions stop being useful?
