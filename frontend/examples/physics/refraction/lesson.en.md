# Refraction of light

When light passes from one medium into another at an angle, its direction changes at the interface: this is refraction. The new direction follows Snell's law, n₁ sin θ₁ = n₂ sin θ₂, where θ₁ is the incidence angle and θ₂ the refraction angle, both measured from the normal, and n₁ and n₂ are the refractive indices of the two media. Three cases follow immediately: at normal incidence (θ₁ = 0) sin θ₁ = 0, so θ₂ = 0 and the ray is not deviated; when the two indices are equal, θ₂ = θ₁; and when n₁ > n₂ there is a critical angle with sin θc = n₂/n₁, beyond which the equation has no real solution, the refracted ray disappears and total internal reflection occurs. This experiment models the ray directions only; it does not compute how much intensity goes into the reflected and the refracted beam.

## Questions
Why does light bend at the interface, and always toward the normal, when it passes from air into glass at an angle?

As the incidence angle grows the refraction angle grows too — but are the two proportional?

When light travels from glass into air, why does the refracted ray disappear once the incidence angle passes a certain value?

## Predict
Do not change anything yet. Take n₁ = 1.00 (air) and n₂ = 1.50 (glass). Predict whether the refraction angle is larger or smaller than the incidence angle as θ₁ grows from 0° to 60°, and whether doubling the incidence angle doubles the refraction angle. Write your prediction down and compare it with the experiment.

## Try
Keep n₁ = 1.00 and n₂ = 1.50, then set θ₁ = 0°, 30°, 60° and 89°, recording θ₂ each time and watching the readings of sin θ₁ and sin θ₂. Then set n₁ = 1.50 and n₂ = 1.00 and increase θ₁ slowly from 0°, looking for the angle at which the refracted ray just disappears (θ₂ approaches 90°); that incidence angle is the critical angle.

## Observe
At θ₁ = 0° we get θ₂ = 0°: the ray travels along the normal without bending. When n₂ > n₁ (air into glass) the refraction angle is smaller than the incidence angle and the ray bends toward the normal; both angles grow with θ₁, but not at the same rate. When n₁ = n₂, θ₂ = θ₁ and the direction does not change. When n₁ > n₂ (glass into air) the refraction angle is larger than the incidence angle and the ray bends away from the normal; near the critical angle θ₂ rises quickly toward 90°, and beyond it the refracted ray disappears and only the reflected ray remains — total internal reflection.

## Explain
### The form of the law
Snell's law is n₁ sin θ₁ = n₂ sin θ₂. It says that the product of the refractive index and the sine is the same on both sides — not that the two angles themselves are equal or proportional. Seen as a relation between the sines the equation is linear, but angle and sine are not proportional to each other, so doubling the incidence angle does not double the refraction angle.

### Why normal incidence is not deviated
At θ₁ = 0, sin θ₁ = 0, hence sin θ₂ = 0 and θ₂ = 0. In terms of wavefronts, at normal incidence the whole wavefront reaches the interface at the same time, so the difference in propagation speed between the two media cannot tilt it, and the direction is unchanged.

### Critical angle and total internal reflection
When n₁ > n₂, sin θ₂ = (n₁/n₂) sin θ₁. As θ₁ grows the right-hand side reaches 1 at the incidence angle that satisfies sin θc = n₂/n₁, the critical angle. For θ₁ > θc the right-hand side exceeds 1 and no refraction angle satisfies the equation: there is no refracted ray, and all the light returns into medium 1 — total internal reflection. When n₁ ≤ n₂ the right-hand side can never exceed 1, so no critical angle exists.

## Check
With n₁ = 1.00 and n₂ = 1.50: at θ₁ = 30°, sin θ₂ = sin 30°/1.5 = 0.3333, so θ₂ ≈ 19.5°; at θ₁ = 60°, sin θ₂ = sin 60°/1.5 ≈ 0.5774, so θ₂ ≈ 35.3°. With n₁ = 1.50 and n₂ = 1.00: sin θc = 1/1.5 = 0.6667, so θc ≈ 41.8°; at θ₁ = 41°, sin θ₂ = 1.5 × sin 41° ≈ 0.9841 and θ₂ ≈ 79.8°; at θ₁ = 45°, 1.5 × sin 45° ≈ 1.061 > 1, so there is no solution and total internal reflection occurs. Check every case by confirming that n₁ sin θ₁ equals n₂ sin θ₂.

## Explore further
Refraction is the basis of image formation by lenses: a convex lens uses the difference in refractive index across its surfaces to bend rays so that they converge or diverge, and you can follow this in [Thin lens and images](/labs/thin-lens). You can also write the refractive index as n = c/v and read the "turn" as a consequence of the different propagation speeds in the two media, then look up the Fresnel equations for the energy split that this experiment deliberately leaves out.
