# Unit circle and the sine curve

A point turning uniformly on a circle with angular speed ω has a height (its vertical coordinate) that changes in time exactly as y = R sin(ωt + φ₀): the radius R sets the amplitude, ω sets the period T = 2π/ω, and the initial phase φ₀ sets where the curve starts at t = 0. Project the point onto the vertical axis and then unfold that projection against time, and you get a sine curve — uniform circular motion and the sine function are two views of the same thing.

## Questions
If the radius grows from 1 m to 2 m, how does the amplitude of the sine curve change?

When the angular speed ω is doubled, by what factor does the period T = 2π/ω change?

When the initial phase φ₀ changes, how do the starting position on the circle and the start of the curve change?

## Predict
Write down a prediction first: if only ω is doubled while the radius is unchanged, does the period become half as long? If only the radius changes, does the period change at all? Then play the animation and compare.

## Try
Keep the default parameters (R = 1 m, ω = 2 rad/s, φ₀ = 0°), press Play, and watch the point turn counterclockwise while its height is traced onto the sine curve on the right. Use Step to advance exactly 0.1 s at a time. Then change ω from 2 rad/s to 4 rad/s and compare how many periods fit in the same time; then set the radius to 2 m and watch only the amplitude change. Changing a parameter resets the simulation time and the model state.

## Observe
The point always turns counterclockwise at a constant angular speed (the angle grows with time), and its vertical projection is exactly the height of the curve. A larger ω squeezes more periods into the fixed time window; a larger radius pushes the peaks and troughs farther from the axis, while the time between neighbouring peaks is unchanged. Changing the initial phase only slides the whole curve left or right.

## Explain
### Why is the height of a point on a circle a sine?
Let the point start at an angle φ₀ from the x-axis; at time t its angle is θ = ωt + φ₀, so its vertical coordinate is R sin θ. Writing θ as ωt + φ₀ gives y = R sin(ωt + φ₀). The sine curve is therefore not mysterious: it is the vertical projection of circular motion, unfolded against time.

### What sets the amplitude, the period and the phase?
The amplitude equals the radius, A = R; the period is set by the angular speed, T = 2π/ω, and does not depend on the radius; the initial phase φ₀ sets where the point starts on the circle at t = 0 and where the curve begins. Angles are shown in degrees in the interface but are always computed in radians, because ω in θ = ωt + φ₀ is measured in rad/s.

### A fixed scale
The circle panel always shows ±2 units and the time axis always spans a fixed 12 s window that scrolls with the trace. Changing a parameter moves the drawing without changing the scale; when R exceeds 2 m the part outside the fixed frame is clipped and a hint appears instead of an automatic rescale. Each fixed model step dt = 1/120 s advances the phase by ω·dt, and the curve is drawn from the analytic formula, so there is no numerical integration error.

## Check
Change ω from 2 rad/s to 4 rad/s: the period should go from π ≈ 3.14 s to π/2 ≈ 1.57 s, so twice as many periods fit in the same time. Change the radius from 1 m to 2 m: the amplitude becomes 2 m while the period reading stays the same. Change φ₀ from 0° to 90°: at t = 0 the curve should jump from 0 to +R. Reset parameters restores the defaults.

## Explore further
The link between circular motion and the sine also appears in other oscillations: the displacement of a [spring oscillator](/labs/spring-oscillator) is also a sine of time, with period T = 2π√(m/k), while [wave superposition](/labs/wave-superposition) adds two sine waves together. What happens if you add two circular motions with slightly different frequencies? If the amplitude or the angular speed changes with time, is the projection still a sine?
