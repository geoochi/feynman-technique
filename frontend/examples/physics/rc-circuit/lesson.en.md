# RC circuit and time constant

The voltage across a capacitor does not jump to the source EMF because changing that voltage means moving charge, and charge can only flow through the resistor: the current is limited by R, so the voltage can only change at a finite rate. Combining Kirchhoff's voltage law E = iR + u with the capacitor law i = C du/dt gives RC du/dt = E − u, whose solution is u(t) = E + (u₀ − E)e^(−t/τ) with τ = RC. The switch closes at t = 0 and the capacitor starts at u₀; after one time constant τ the gap to E has shrunk to 1/e of its original size, and as t → ∞ the voltage tends to E. It is the same circuit reasoning as [Ohm's law](/labs/ohms-law) and [Series and parallel](/labs/series-parallel), with a capacitor that stores charge — which is what introduces time.

## Questions
Why does the voltage across the capacitor need time to change instead of jumping straight to the source EMF?

If you increase the resistance R or the capacitance C, does the capacitor reach the source EMF sooner or later?

If the capacitor already carries a voltage higher than the source (u₀ > E), does it discharge or keep charging, and where does it finally settle?

## Predict
Write down your judgement first: with u₀ = 0 and E = 6 V, after one time constant τ is the capacitor voltage about 63%, 86% or 95% of 6 V? If you make τ four times larger, by what factor does the time to reach the same fraction change? Then set u₀ = 10 V and E = 0 V and predict whether the curve rises or falls.

## Try
Keep E = 6 V, u₀ = 0 V, R = 40 Ω and C = 0.05 F, so τ = RC = 2 s. Press play and watch the curve leave u₀ and approach E. Pause and use Step to advance 0.10 s at a time, noting the capacitor-voltage reading at t = 0.10, 1.00 and 2.00 s. Then set C = 0.1 F so τ = 4 s, replay, and compare how much flatter the curve becomes. Finally set u₀ = 10 V and E = 0 V to watch discharging. The switch closes at t = 0; changing any parameter (or pressing reset) re-opens the circuit, sets the time back to zero and restores the capacitor voltage to u₀ — the capacitor's internal state is its own voltage, and the run continues from that voltage.

## Observe
The curve leaves u₀ and moves monotonically towards E, never overshooting E or turning back at it. A larger τ gives a flatter curve and a smaller τ a steeper one; changing R or C alters only the speed, never the final E. With u₀ < E the curve rises (charging), with u₀ > E it falls (discharging), and with u₀ = E it is a horizontal line. At the default parameters the curve near t = 0 is slanted rather than vertical, which shows that the rate of change of the voltage is finite; with a very small τ (for example 0.2 s) the same change is squeezed into a narrow strip at the left end of the window.

## Explain
### Why can the capacitor voltage not jump?
The charge stored on the capacitor and its voltage obey q = C u, and the current is the rate at which charge is carried, i = dq/dt = C du/dt. Charge can only move through the resistor, which limits the current to i = (E − u)/R, so du/dt = (E − u)/(RC) is always finite. A finite rate of change means the voltage varies continuously in time and cannot jump to E in an instant. Only as R → 0 would the rate diverge, which is exactly the ideal short-circuit limit.

### Where does the exponential come from?
Apply Kirchhoff's voltage law around the loop: the source EMF E equals the drop iR across the resistor plus the capacitor voltage u, so E = iR + u. Substituting i = C du/dt gives RC du/dt + u = E. This is a first-order linear equation; separating variables as du/(E − u) = dt/(RC) and integrating yields u(t) = E + (u₀ − E)e^(−t/τ) with τ = RC. The two constants give the two limits directly: at t = 0 the voltage is u₀, and as t → ∞ the exponential vanishes and u → E.

### What does the time constant τ mean?
τ = RC has units of seconds and is the single time scale of the process. After one τ the gap between the capacitor voltage and E has shrunk to 1/e ≈ 0.368 of its original value; charging from u₀ = 0 gives u(τ) = E(1 − 1/e) ≈ 0.632E. After 5τ the gap is only about 0.7%, which is why the process is usually called finished there. The current i(t) = ((E − u₀)/R)e^(−t/τ) is largest at t = 0 and decays with the same exponential. Note that τ depends only on the product RC: swapping R and C (for example halving R and doubling C) leaves the curve shape completely unchanged.

## Check
With the default parameters τ = 40 × 0.05 = 2 s. Stepping to t = 0.10 s should read about u = 6(1 − e^(−0.05)) ≈ 0.293 V; stepping to t = 2.00 s should read about 6(1 − 1/e) ≈ 3.793 V; and stepping to t = 10.00 s should read about 6(1 − e^(−5)) ≈ 5.960 V, leaving a gap of only about 0.7%. Set C = 0.1 F so τ = 4 s; the reading at t = 2.00 s should drop to about 6(1 − e^(−0.5)) ≈ 2.361 V, clearly below 3.793 V. Change R from 40 Ω to 80 Ω and the curve should coincide with the previous one, because τ is 4 s in both cases. Conversely, halve R to 20 Ω while doubling C to 0.1 F and τ stays 2 s, so the curve matches the default exactly. Set u₀ = 10 V and E = 0 V; the reading at t = 2.00 s should be about 10/e ≈ 3.679 V. Set u₀ equal to E and the current reading is 0 A while the curve stays flat.

## Explore further
Real circuits also have source resistance, capacitor leakage and the parasitic capacitance and inductance of the wires, all of which bend the curve away from a pure exponential, and the capacitor's equivalent series resistance adds a small voltage step at the instant of switching. What happens to the capacitor voltage if the source is not a constant EMF but changes in time, such as a square wave? What curve appears if you cascade two RC circuits? You can also revisit [Ohm's law](/labs/ohms-law) for the instantaneous response of a purely resistive loop, or [Series and parallel](/labs/series-parallel) to compare the rules for combining resistors with the energy storage of the capacitor here.
