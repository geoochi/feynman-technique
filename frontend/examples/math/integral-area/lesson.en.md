# Area under a curve

For f(x) = x², the area between the curve and the x-axis from x = a to x = b equals (b³ − a³)/3. A Riemann sum splits [a, b] into n subintervals of width Δx = (b − a)/n, samples one point xᵢ = a + (i + s)Δx in each subinterval, and adds the rectangle areas f(xᵢ)Δx. As n grows the sum approaches the exact integral, and the sampling position s decides whether the rectangles sit above or below a monotonic curve.

## Questions
How does the sum of the small rectangle areas approach the area under the curve as the number of subintervals n grows?

Why does sampling the left edge underestimate the area when f(x) = x² is increasing on the interval?

What does the readout show when the interval has zero length, and is it the signed integral or the geometric area?

## Predict
Keep a = 0 and b = 2. Predict the left sum for n = 1, 2, 4 and 8 before you move anything. Will the sum climb towards the exact value 8/3 ≈ 2.667 or fall towards it? Then predict how the error changes at s = 0.5 and s = 1.

## Try
Set a = 0, b = 2, n = 8. Start with s = 0 and read the sum, the exact value and the error. Move s to 0.5 and then to 1, and watch the sign of the error flip. Keep s = 0 and raise n through 4, 8, 16 and 40, recording how the error shrinks.

Then set a = b, for example a = b = 1: every rectangle has zero width and the sum is 0. Try a negative interval such as a = −2, b = 0, then reverse it to a = 2, b = 0. "Reset parameters" returns to a = 0, b = 2, n = 8, s = 0. The plot keeps a fixed scale, so parameters move the rectangles instead of rescaling the picture, and there is no clock or playback.

## Observe
On [0, 2] with n = 8 the left sum is 2.1875, below the exact 8/3 ≈ 2.6667, so the error is negative. The right sum is 3.1875, above the exact value, so the error is positive. The midpoint sum is 2.65625, much closer than either edge.

Doubling n roughly halves the left or right error but quarters the midpoint error. At n = 40 the left error is already under 0.05. When a = b every term vanishes and the readout says the interval has zero length; reversing the endpoints flips the sign of both the sum and the exact value.

## Explain
### Why does the sum approach the integral?
Each rectangle has width Δx and height f(xᵢ). The exact integral is the limit of these sums as Δx → 0, so that n = (b − a)/Δx grows without bound:

∫ₐᵇ f(x) dx = lim (n → ∞) Σ f(xᵢ) Δx.

For f(x) = x² the antiderivative is F(x) = x³/3, so the Fundamental Theorem of Calculus gives the exact value (b³ − a³)/3. For [0, 2] that is 8/3 ≈ 2.6667.

### Which point should sample each subinterval?
If f increases across a subinterval, the left edge gives the smallest height and the right edge the largest, so on [0, 2] the left sum sits below the exact value and the right sum above it: they bracket it. Choosing the midpoint reduces the error from order Δx to order Δx², which is why doubling n quarters the midpoint error but only halves the edge error. Sampling at s = 0, 0.5 or 1 is one choice inside the definition; the limit does not depend on which point inside each subinterval is used.

### Signed integral or geometric area?
The readout shows the signed integral ∫ₐᵇ f(x) dx. Because f(x) = x² is never negative, the signed integral equals the geometric area under the curve, so on this page the two numbers agree. For a function that dips below the x-axis the signed integral would subtract that region, and the geometric area would count it positively; the two would then differ. Reversing the endpoints, for example a = 2, b = 0, changes the sign of both the sum and the exact value.

## Check
Without moving the controls, predict the error at n = 16 for s = 0 on [0, 2], then check that it is close to −0.24. Predict the right-sum error for the same n and confirm it is about +0.24. At a = b = 1 confirm that the sum, the exact value and the error are all exactly 0.

Explain in your own words why the midpoint rule converges faster than the left or right rule, and why the signed integral would differ from the geometric area if f took negative values.

## Explore further
Continue from [Derivatives and tangents](/labs/derivative-tangent): there the difference quotient approaches the derivative, the local slope; here the rectangle sum approaches the integral, the accumulated area. The two ideas meet in the Fundamental Theorem of Calculus.

As a paper exercise, compute the left sum for f(x) = x on [0, 1] with n subintervals and show that it equals (1 − 1/n)/2, so the error is exactly 1/(2n) and vanishes as n grows.
