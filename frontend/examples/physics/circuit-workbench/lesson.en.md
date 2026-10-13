# Circuit workbench

A DC circuit is solved by two rules and nothing else: the voltages around any closed loop add to zero, and the currents entering any node add to zero. On this bench you build the circuit yourself, and the readouts show what those rules imply for every branch — so the equivalent resistance you compute by hand can be checked against the solver's node voltages and branch currents.

## Questions

What happens to the current when you replace a 100 Ω resistor with a 200 Ω one?

Which gives more current: two 100 Ω resistors end to end, or two 100 Ω resistors side by side?

What does the workbench report when a wire joins both terminals of the source?

## Predict

Before you change anything, predict what the source current will be for two 100 Ω resistors in series, and for the same pair in parallel. Write both numbers down.

## Try

Pick the resistor tool, then click node 1 and node 2 to place an element. Pick the voltage source tool and connect node 0 to node 1. Use the wire tool to merge two nodes when you want them to act as one. Click an element to select it and change its value with the slider; the delete button removes it. Esc cancels a half-finished placement.

## Observe

Each branch appears as one operating point in the fixed U–I chart: the horizontal axis is terminal voltage, the vertical axis is branch current from node a to node b. Wires sit at 0 V because they merge nodes. The source point carries the delivered current as a negative branch current, and the readouts display it with the sign flipped so a delivering source reads positive.

## Explain

### Why do series and parallel give different resistances?

In series the same current passes through both resistors, so the voltages add and R_eq = R₁ + R₂. In parallel both resistors see the same voltage, so the currents add and 1/R_eq = 1/R₁ + 1/R₂. That is why the same pair can give you four times the current depending only on how you connect it.

### How does the workbench get its numbers?

It writes one Kirchhoff current equation per node and one voltage constraint for the ideal source, then solves that small linear system by Gaussian elimination with partial pivoting. Node 0 is the reference. Every branch quantity follows from the node voltages.

### Why does it sometimes refuse to answer?

Some topologies have no solution. A wire across the source's terminals short-circuits it, so the equations contradict each other. A sub-network with elements but no path back to the source is floating, and its voltages are undetermined. A source that never closes a loop with the reference has no loop at all. In each case the workbench names the problem instead of returning a number that is not there.

## Check

Set both resistors to 100 Ω and the source to 12 V. The readouts should show 0.06 A for the series order and 0.24 A for the parallel one, and the power balance ΣP should stay at zero to within rounding. Then add a wire across the source and confirm the solver reports a short circuit rather than a current.

## Explore further

Real sources have internal resistance, wires have resistance, and meters change what they measure. Which of the idealisations on this bench would break first if you connected a real battery to a real lamp?
