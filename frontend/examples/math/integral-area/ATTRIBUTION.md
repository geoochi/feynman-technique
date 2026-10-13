# Sources and licensing

Original implementation, explanations and SVG diagram: geoochi, released under the repository [MIT license](../../../../LICENSE). No external image, font or data assets are used; the scene is drawn from the parameters with plain SVG.

Mathematical references: [OpenStax, Calculus Volume 1, §5.1 Approximating Areas](https://openstax.org/books/calculus-volume-1/pages/5-1-approximating-areas) and [§5.3 The Fundamental Theorem of Calculus](https://openstax.org/books/calculus-volume-1/pages/5-3-the-fundamental-theorem-of-calculus). The text, figures and code here are original and are not copied from the textbook.

Scope: a single dimensionless real function f(x) = x², with the exact antiderivative F(x) = x³/3. Each subinterval uses one sampling position s ∈ [0, 1]; the parameter n is rounded to an integer count of at least one. Display values are rounded, so a small plotted error is not a proof of convergence. The readout is the signed integral; because x² is never negative it coincides with the geometric area in this case.

Status: experimental. Independent teaching review and native-language review are still pending.
