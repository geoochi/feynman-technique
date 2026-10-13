# Derivatives and tangents

For f(x) = x², the slope between P = (x₀, x₀²) and Q = (x₀ + h, (x₀ + h)²) is 2x₀ + h when h ≠ 0. As h approaches zero from either side, that slope approaches 2x₀: the derivative at x₀. At h = 0, the difference quotient itself is undefined. A limit describes nearby values, not division by zero.

## Questions
How does the secant slope change as Q approaches P from the right or the left?

Does a horizontal tangent at the vertex mean the whole curve is horizontal?

Why is the difference quotient undefined at h = 0 even though the derivative exists?

## Predict
Keep x₀ = 1. Predict the secant slopes for h = 1, 0.1, and −0.1. Will the positive and negative gaps approach the same value? Write down your prediction before adjusting the controls.

## Try
Set x₀ = 1. Enter h = 1, 0.5, 0.1, and 0.01 in order. Record the secant slope, tangent slope, and absolute slope difference. Repeat with h = −1, −0.5, −0.1, and −0.01. The circle P stays at the base point; the square Q moves along the parabola. The straight solid line is the secant, and the dashed line is the tangent.

Enter h = 0 and read the explanation beside the readouts. Then set x₀ = 0 with h = 0.1 and −0.1. Finally try x₀ = −1 with the same gaps. Reset parameters returns to x₀ = 1 and h = 1. This experiment has no clock or playback.

## Observe
At x₀ = 1, positive gaps give slopes 3, 2.5, 2.1, and 2.01. Negative gaps give 1, 1.5, 1.9, and 1.99. The tangent slope stays at 2. The absolute slope difference is |h|, so halving the gap halves this error.

At the vertex x₀ = 0, the tangent is horizontal. At x₀ = −1, it slopes downward with slope −2. A derivative describes local change, not the height of the point or the direction of the entire curve. The graph keeps the same scale while parameters change. Closely spaced points may visually overlap; compare the readouts as well.

## Explain
### How does the difference quotient give a derivative?
A secant compares two distinct points. Its slope is the change in output divided by the signed change in input. Expanding the square gives, for h ≠ 0:

((x₀ + h)² − x₀²) / h = (2x₀h + h²) / h = 2x₀ + h.

The term h tends to zero from either side, leaving f′(x₀) = 2x₀. The tangent through P therefore has equation y = x₀² + 2x₀(x − x₀). It approximates the curve near P, not everywhere.

### Why not just set h to zero?
The original quotient would be 0/0, which has no defined value. Cancelling h was valid only for nonzero h. The derivative is the limit of these defined nearby quotients; it does not make the zero-gap quotient defined. The experiment hides the secant at h = 0 and keeps the analytically computed tangent.

The model uses the simplified expression for nonzero gaps to avoid subtracting nearly equal values. Coordinates are dimensionless and readouts round to three decimal places. Tiny gaps can look identical on screen or after rounding. The algebra establishes the limit; a finite collection of measurements only illustrates it. Other functions need their own analysis and may fail to have a derivative.

## Check
Without moving the controls, predict the slopes at x₀ = −1 for h = 0.1 and −0.1, then verify −1.9 and −2.1. Both approach −2. At x₀ = 0 with h = 0.1, the secant slope is 0.1 while the tangent slope is 0: a nearly horizontal line is not an exactly horizontal one.

Explain in your own words why h = 0 gives an undefined quotient but a well-defined derivative here. If your explanation says “divide by zero,” revisit the nonzero-gap expansion.

## Explore further
Return to [Quadratic functions](/labs/function-transform) to move and reshape a parabola. For f(x) = a(x − b)² + c, expand the difference quotient to predict f′(x₀) = 2a(x₀ − b). Here b denotes the horizontal shift; h in this experiment denotes the gap between inputs.

As a paper exercise, compare the right and left secant slopes of f(x) = |x| at zero. They approach 1 and −1, so there is no derivative there. This second function is not plotted in the experiment.
