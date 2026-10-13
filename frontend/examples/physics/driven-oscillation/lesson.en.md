# Driven oscillation and resonance

Bolt a damped spring-mass oscillator to a periodic force and keep pushing it. Once the transient has died away the motion settles into a steady oscillation at the driving frequency ω_d, with amplitude A = F₀/√((k−mω_d²)²+(cω_d)²) and a phase lag φ = atan2(cω_d, k−mω_d²) behind the force. The headline result is that the amplitude peaks when the driving frequency approaches the natural frequency ω₀ = √(k/m) — that is resonance — and that more damping makes the peak lower and broader. With no driving force the oscillator simply loses its energy to damping and stops. To see what happens without a driving force first, go back to [Damped oscillation](/labs/damped-oscillation).

## Questions
Why does pushing an oscillator continuously sometimes give a tiny amplitude and sometimes a very large one?

Why does the steady-state amplitude shoot up when the driving frequency approaches the natural frequency ω₀ = √(k/m)?

If you increase the damping coefficient c, does the resonance peak grow or shrink?

## Predict
Write down your prediction first: as you sweep the driving frequency ω_d from small to large, does the steady amplitude keep increasing, or rise and then fall? If you double the damping c, does the peak height roughly halve?

## Try
Start from the defaults (m = 1 kg, k = 30 N/m, c = 0.8 N·s/m, F₀ = 2 N, ω_d = 5.5 rad/s) and press Play. Watch the displacement–time trace: it starts small, grows, and settles; the dashed lines are the steady-state envelope ±A. Set ω_d to 2, 5.5 and 11 rad/s in turn and note the steady amplitude A and the phase lag φ in the readouts, comparing them with the marker on the response curve. Then set c to 0.4 and 5 N·s/m and compare how sharp the resonance peak is. Finally set F₀ = 0 and watch the trace decay to zero.

## Observe
Away from ω₀ the steady amplitude is small: at ω_d = 2 rad/s, A ≈ 0.077 m, and at ω_d = 11 rad/s, A ≈ 0.022 m. At ω_d = 5.5 rad/s, close to ω₀ = √(30/1) ≈ 5.477 rad/s, A ≈ 0.454 m, far larger than at either end. Lowering c from 0.8 to 0.4 roughly doubles the peak to 0.90 m; raising it to 5 flattens the peak to about 0.073 m. The phase lag φ rises monotonically from about 0° at low frequency to about 180° at high frequency, passing through about 90° near resonance. At the start there is also a transient: the amplitude grows from zero and only approaches the steady value after about 2m/c ≈ 2.5 s. With F₀ = 0 there is no steady state at all — the trace decays to rest.

## Explain
### Where the steady state comes from
Substitute x = A cos(ω_d t − φ) into m x″ + c x′ + k x = F₀ cos(ω_d t). The displacement, velocity and acceleration amplitudes are A, Aω_d and Aω_d². Splitting the result into the component in phase with the drive and the component a quarter cycle behind it leaves k − mω_d² and cω_d, whose combined size is √((k−mω_d²)²+(cω_d)²). Hence A = F₀/√((k−mω_d²)²+(cω_d)²) and φ = atan2(cω_d, k − mω_d²).

### Why the peak sits near ω₀ = √(k/m)
The amplitude is largest where the denominator is smallest. Without damping the denominator is |k − mω_d²|, which vanishes at ω_d = √(k/m) = ω₀ and the amplitude diverges: that is the undamped resonance pole. Damping adds the term cω_d, which leaves a non-zero floor near ω₀ and keeps the amplitude finite — at ω_d = ω₀ it equals F₀/(cω₀). The smaller the damping, the lower the floor and the taller and narrower the peak.

### Transient, steady state and phase lag
The general solution is the steady solution plus a transient that decays like e^{−(c/2m)t}. Starting from rest the transient cannot be ignored: the amplitude grows over roughly 2m/c before the steady state takes over. The phase lag φ says how far the displacement falls behind the force. Well below resonance φ ≈ 0, with the displacement almost in step with the force; at resonance φ ≈ 90°, with the displacement a quarter cycle behind so that the velocity is in step with the force and the power input is largest; and well above resonance φ → 180°, with the displacement almost opposite to the force.

### Damping and the F₀ = 0 case
Damping dissipates mechanical energy through −c v, so with F₀ = 0 the oscillator performs a damped oscillation whose amplitude decays like e^{−(c/2m)t} to rest — there is no steady state. With F₀ > 0 the force keeps feeding energy in, and the steady amplitude is proportional to F₀ and inversely proportional to the damping.

## Check
Take m = 1 kg, k = 30 N/m, c = 0.8 N·s/m and F₀ = 2 N. At ω_d = 5.5 rad/s the readouts should give A ≈ 0.454 m and φ ≈ 93°; at ω_d = 2 rad/s, A ≈ 0.077 m and φ ≈ 4°; at ω_d = 11 rad/s, A ≈ 0.022 m and φ ≈ 175°. Setting c = 0.4 N·s/m should roughly double A to 0.90 m, and c = 5 N·s/m should drop it to about 0.073 m. With F₀ = 0 the trace should decay to zero, the readout should show a steady amplitude of 0, and the phase lag should stop showing a number. Use Step to advance 0.10 s at a time and compare the transient with the steady envelope.

## Explore further
If the force were not sinusoidal (a periodic square wave, say), could the steady state still be described by a single amplitude? If you coupled the same oscillator to a second direction with a different natural frequency, what would happen? To see how damping drains the energy when no force acts, go back to [Damped oscillation](/labs/damped-oscillation); and review where ω₀ = √(k/m) comes from in [Spring and period](/labs/spring-oscillator).
