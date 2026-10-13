# Day length and latitude

On the same day, day length differs with latitude because Earth is nearly spherical: sunlight arrives almost parallel, so the angle between the Sun's daily path and the horizon changes from place to place, and day length follows cos H₀ = −tan φ tan δ. This case plots that relation as a static curve. It reuses the assumptions of the day-night case—spherical Earth, parallel sunlight, a 24-hour solar day and a fixed solar declination—and it ignores the Sun's apparent radius and atmospheric refraction, and does not simulate Earth's orbit or real-time weather.

## Questions
Why does day length differ with latitude on the same day?

Does day length at the equator change with solar declination?

At solar declination +23.44°, how far north must you go for polar day?

## Predict
At the equinox (δ = 0°), what day length do you expect at each latitude? Set declination to +23.44° and raise latitude from 0° to 90°: how should the curve change, and what values do you expect at the equator and at the pole?

## Try
Keep declination at +23.44° and move latitude from 0° to 90°, watching the dot on the curve. Then set declination to 0° and −23.44° and compare the three curves. The dashed vertical lines mark the polar boundaries |φ| = 90° − |δ|; the shaded bands show where polar day (warm) or polar night (cool) occurs.

## Observe
The curve is symmetric about the equator, which stays at 12 hours. When declination is positive, the northern hemisphere has more than 12 hours and the southern hemisphere less, and the difference grows with latitude until high northern latitudes reach 24 hours. Flipping the sign of declination mirrors the whole curve.

## Explain
### Where does the day-length formula come from?
For latitude φ, solar declination δ and hour angle H, the solar altitude α satisfies sin α = sin φ sin δ + cos φ cos δ cos H. At sunrise and sunset α = 0, which gives cos H₀ = −tan φ tan δ and a day length of D = 24H₀/π hours, with H₀ in radians. The day-night case uses the same geometric relation.

### Why are the equator and the equinox always 12 hours?
At φ = 0°, tan φ = 0, so cos H₀ = 0 and H₀ = π/2: the day is always 12 hours. At δ = 0°, tan δ = 0 and every latitude gives 12 hours—the equal day and night of the equinoxes.

### The polar-day and polar-night boundaries
When |φ| ≥ 90° − |δ|, the value −tan φ tan δ falls outside [−1, 1]: the side with the same sign as δ has polar day (D = 24 h) and the opposite side has polar night (D = 0 h). At δ = +23.44° the boundary sits at 66.56°, close to the Arctic Circle.

### Why are the poles a degenerate case?
At a pole the Sun's daily path runs parallel to the horizon, so there is no sunrise or sunset: at δ = 0° the day lasts 12 hours, and for δ ≠ 0° it can only be 24 h or 0 h. The model decides this from the sign of sin φ sin δ, so tan φ never needs to blow up.

## Check
Set declination to 0° and confirm that several latitudes all read 12.00 h. Then set latitude 45° and declination +23.44° for about 15.43 h; with declination −23.44° the two results should add up to 24.00 h. Finally set latitude 90° and −90° and check that the readouts stay finite and no invalid value appears.

## Explore further
Atmospheric refraction and the Sun's apparent radius are omitted, so real sunrise and sunset differ from these geometric results, and terrain and altitude add further variation. The curve is a geometric relation, not live weather. To understand why day and night happen at all, start with [Day and night on Earth](/labs/day-night). Treating declination as a seasonal parameter lets you compare seasons, but it is not a full orbital simulation.
