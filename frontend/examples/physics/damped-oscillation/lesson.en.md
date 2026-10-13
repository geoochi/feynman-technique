# Damped oscillation: why does an oscillation die away?

Almost every real oscillation dies away: a spring-mass block moving through air or oil feels a drag force that points against its velocity. If that drag is proportional to the velocity, F = −c x′, the equation of motion becomes m x″ + c x′ + k x = 0. Writing ω₀ = √(k/m) for the natural frequency and ζ = c / (2√(mk)) for the damping ratio, everything depends on ζ alone: for ζ < 1 the block still oscillates but the amplitude decays as e^(−ζω₀t); at ζ = 1 it no longer oscillates and returns to equilibrium monotonically as fast as possible; for ζ > 1 it also does not oscillate, but the return is slower. The mechanical energy is only ever carried away by the drag, so it never increases.

## Questions
As you raise the damping coefficient c from zero, why does each swing get smaller until the motion stops?

Once the damping ratio ζ reaches 1 or more, does the block still shoot past the equilibrium position and swing back?

If you only pull the block farther out (a larger x₀) and leave the damping alone, does the decay rate — the ratio between successive peaks — change?

## Predict
Write down your answer first: when ζ goes from 0.2 to 1, does the motion oscillate faster or stop oscillating? Between an overdamped case (ζ > 1) and the critical case (ζ = 1), which one returns to equilibrium first?

## Try
Release the block from x₀ = 0.2 m and press Play, watching the displacement–time graph and its envelope. Then set the damping coefficient c to 0, 2, 10 and 25 N·s/m in turn (with m = 1 kg and k = 25 N/m these are ζ = 0, 0.2, 1 and 2.5), replaying after each change. Finally raise the mass to 4 kg and notice that the critical damping coefficient 2√(mk) moves with it. Changing any parameter restarts the model from rest at the chosen displacement.

## Observe
At ζ = 0 the amplitude never changes, the graph is an even sine-like curve and the mechanical energy reading stays constant. For 0 < ζ < 1 the curve still oscillates, but the peaks are squeezed by the envelope ±x₀e^(−ζω₀t) and every damped period multiplies the peak by the same factor. At ζ = 1 the curve no longer crosses x = 0 and instead approaches equilibrium monotonically. For ζ > 1 it is also monotonic, but the tail drags on longer. In every case the mechanical energy reading only falls.

## Explain
### What does the drag force do?
The drag F = −c x′ always opposes the velocity, so it does negative work on the block: dE/dt = −c v² ≤ 0. Energy is continuously drained away, and that is the origin of the decay. When c = 0 the derivative vanishes, the mechanical energy is conserved and the amplitude stays constant.

### Why is the decay exponential?
Substituting x = e^(λt) into m x″ + c x′ + k x = 0 gives the characteristic equation mλ² + cλ + k = 0 with roots λ = −ζω₀ ± ω₀√(ζ²−1). For ζ < 1 the roots are a complex pair and the solution is x(t) = e^(−ζω₀t)[x₀cos(ω_d t) + ((v₀ + ζω₀x₀)/ω_d)sin(ω_d t)] with ω_d = ω₀√(1−ζ²). The exponential factor e^(−ζω₀t) is exactly the envelope, while the bracket oscillates at the angular frequency ω_d. Damping lowers the frequency a little (ω_d < ω₀), so the damped period T_d = 2π/ω_d is slightly longer than the undamped period 2π/ω₀.

### When does the motion stop oscillating?
For ζ ≥ 1 the characteristic roots become real and the sine term disappears. At ζ = 1 the solution is x(t) = [x₀ + (v₀ + ω₀x₀)t]e^(−ω₀t); released from rest (v₀ = 0) both coefficients have the same sign, so x falls monotonically from x₀ to 0 and never crosses x = 0. For ζ > 1 the solution is x(t) = A e^(λ₁t) + B e^(λ₂t) with two negative real roots, again monotonic. So whether the block oscillates depends only on ζ: it oscillates for ζ < 1 and does not for ζ ≥ 1. Note that overdamping is not "more damping, faster return": once ζ > 1 the slowest decay rate −λ₁ = ω₀(ζ − √(ζ²−1)) actually shrinks as ζ grows, so the return takes longer; critical damping is the fastest of the non-oscillating cases.

## Check
Set c = 10 N·s/m (exactly 2√(mk) for m = 1 kg and k = 25 N/m); the readouts should show ζ = 1.000, the regime "critically damped" and a damped period of "no oscillation". Set c = 2 N·s/m and the readouts should show ζ = 0.200 with a damped period near 1.283 s, and the ratio between successive peaks should be about e^(−ζω₀T_d) = 0.277. Set c = 0 and the envelope becomes two horizontal lines while the mechanical energy reading stays constant. Raise m from 1 kg to 4 kg with k fixed: ω₀ halves, the critical damping coefficient becomes 2√(4×25) = 20 N·s/m, and the old c = 10 N·s/m is now underdamped. Changing only x₀ leaves ζ, ω₀ and T_d untouched while the mechanical energy scales with x₀².

## Explore further
This model only includes viscous drag proportional to the velocity. Real systems also lose energy to dry friction (Coulomb damping), air resistance and internal material losses, and each obeys a different decay law: dry friction makes the amplitude fall linearly instead of exponentially and can stop the block in a finite time. Add a periodic driving force and the oscillator can resonate — how would the amplitude then depend on the driving frequency? You can also return to [Spring and period](/labs/spring-oscillator) and compare the undamped period T = 2π√(m/k) with the damped period T_d = 2π/ω_d used here.
