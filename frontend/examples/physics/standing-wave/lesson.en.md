# Standing waves and nodes

Send two waves of equal frequency and equal amplitude along the same string in opposite directions: one travelling to the right and one to the left. Where they meet they add point by point, and the result is not a jumble sliding back and forth but a single curve that swings up and down as a whole — some points never move at all, while others swing the most. The points that never move are nodes, and the points that swing the most are antinodes. This experiment adds y₁ = A sin(kx − ωt) and y₂ = A sin(kx + ωt) to get y = 2A sin(kx)cos(ωt): the space factor sin(kx) separates from the time factor cos(ωt), which is exactly why the pattern is called a standing wave. Fixed ends demand sin(kL) = 0, so the wavelength can only be λₙ = 2L/n, and the mode number n counts how many half wavelengths fit on the string.

## Questions
Why can the resultant of two equal waves travelling in opposite directions be written as y = 2A sin(kx)cos(ωt), instead of continuing to travel to one side?

When both ends of the string are fixed, why can the wavelength not be chosen freely, but must satisfy λₙ = 2L/n?

A node never moves. Does that mean there is no energy there?

## Predict
Write down your prediction first: as the mode number n grows from 1 to 6, do the nodes become more or fewer? Does the wavelength get longer or shorter? If you double the amplitude A, do the node positions move?

## Try
Press Play and watch the two thin curves travel in opposite directions while the thick curve swings as a whole. Keep L = 2 m and v = 8 m/s and set the mode number to n = 1, 2, 3 in turn, noting the allowed wavelength λₙ, the frequency fₙ and the number of nodes in the readout panel. Then raise the amplitude A from 0.10 m to 0.20 m and watch whether the nodes move. Finally pause the animation at t = 0 and about a quarter period later to compare the shapes.

## Observe
The thick curve always passes through the same set of fixed points: the nodes. Between neighbouring nodes the curve swings the most, and its midpoint is an antinode. For n = 2 and L = 2 m the nodes sit at 0 m, 1.0 m and 2.0 m, the wavelength is λ₂ = 2.0 m and the frequency is f₂ = 4 Hz; for n = 3 the nodes become 0 m, 0.67 m, 1.33 m and 2.00 m, the wavelength shortens to λ₃ ≈ 1.33 m and the frequency rises to f₃ = 6 Hz. Changing the amplitude A only changes how far the string swings; the node positions do not move at all. In the two thin curves (y₁ and y₂) the waves are equal and opposite at every node, so the sum is zero, while at an antinode they add in the same direction and the resultant amplitude is twice a single wave.

## Explain
### How two counter-propagating waves add
The right-going wave y₁ = A sin(kx − ωt) and the left-going wave y₂ = A sin(kx + ωt) add algebraically at every point. Using sin α + sin β = 2 sin((α+β)/2)cos((α−β)/2) with α = kx − ωt and β = kx + ωt gives y = 2A sin(kx)cos(ωt). Position and time split into two independent factors: sin(kx) fixes how far each position can swing, and cos(ωt) fixes where the whole string is at that instant.

### How the fixed ends quantise the wavelength
Fixed ends mean y(0, t) = 0 and y(L, t) = 0 at every instant. From y = 2A sin(kx)cos(ωt), the condition at x = 0 is automatic because sin(0) = 0; at x = L it requires sin(kL) = 0, i.e. kL = nπ with n = 1, 2, 3, …. Substituting k = 2π/λ gives λₙ = 2L/n, meaning exactly n half wavelengths fit between the ends. The wavelength is not a free parameter but is derived from the mode number: the only allowed values are 2L, L, 2L/3, L/2, … The mode frequency follows as fₙ = v/λₙ = n v /(2L).

### Nodes and antinodes
Nodes occur where sin(kx) = 0, that is at x = kL/n for k = 0, 1, …, n — there are n + 1 of them, counting both ends. Because sin(kx) vanishes there, the displacement stays zero whatever cos(ωt) does, which is where the "never moves" comes from. The midpoint between two neighbouring nodes has |sin(kx)| = 1, so its displacement swings between ±2A: this is an antinode, and there are n of them. Note that "never moves" refers to the displacement being permanently zero; energy flows back and forth between the nodes and antinodes, so a node is not a place with no energy.

## Check
With L = 2 m and v = 8 m/s: for n = 2 the readouts should give λ₂ = 2.000 m, f₂ = 4.000 Hz and 3 nodes; for n = 3, λ₃ ≈ 1.333 m, f₃ = 6.000 Hz and 4 nodes. Changing the amplitude A to any value should leave the node readout and the node positions unchanged, altering only how far the antinodes swing. While playing, at a quarter period the curve should almost flatten onto the zero line, and a quarter period later it should return with the opposite phase to t = 0. Compare each case with the readout panel.

## Explore further
If the two waves had unequal amplitudes, would the nodes still be perfectly still? If one end of the string were left free instead of fixed, what would the allowed wavelengths become? Start from [Wave superposition](/labs/wave-superposition) to see how waves travelling the same way reinforce or cancel, then ask why travelling in opposite directions produces a standing pattern.
