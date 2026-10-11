# Day and night on Earth

Earth’s rotation carries most places between the sunlit and dark sides, producing day and night. Latitude and solar declination—the Sun’s angle north or south of the equatorial plane—determine how long a place stays lit; at high latitudes, some conditions produce polar day or polar night. This geometric model uses a spherical Earth, parallel sunlight and a 24-hour solar day with fixed declination. It omits refraction, the Sun’s apparent radius and terrain, and does not simulate an orbit. Change latitude and declination to compare day lengths.

## Questions
Why is it daytime in some places and nighttime in others at the same moment?

When solar declination is 0°, is day length the same at different latitudes?

Why does polar day occur at latitude 75° when solar declination is +23.44°?

## Predict
How long is the day at the equator at the equinox? At the northern summer solstice, can you always see sunset as you move to higher latitudes?

## Try
Set latitude and solar declination to 0° and play through a full day. The blue dot is the observer; the amber arrows show sunlight. Then set declination to +23.44° and compare day length at latitudes 31.2° and 75°.

One simulation second represents one solar hour. Solar time is not time-zone clock time: 12 h means the Sun crosses the local upper meridian.

Earth rotates from west to east, counterclockwise when viewed from above the North Pole. The curved arrow above the north end of the axis indicates this direction. As a result, a local observer sees the Sun rise in the east and set in the west.

## Observe
It is daytime when the observer is on the lit side and nighttime on the unlit side. This model counts daytime when solar altitude is above 0°. Under some high-latitude conditions, the observer stays on the lit side all day: polar day.

## Explain
### How do latitude and solar declination set day length?
For latitude φ, solar declination δ, and hour angle H = 15° × (solar time − 12), solar altitude α satisfies sin α = sin φ sin δ + cos φ cos δ cos H.

At sunset α = 0, so cos H₀ = −tan φ tan δ. An ordinary day's length is 24H₀/π hours, with H₀ in radians. If the right-hand side is ≤ −1, there is polar day; if ≥ 1, there is polar night.

### Why can high latitudes have polar day?
At latitude 75° and declination +23.44°, even the lowest solar altitude of the day stays above the horizon: the observer’s full rotation lies on the lit side, so day length is 24 hours. With declination −23.44°, the path stays on the dark side and day length is zero. The signs of latitude and declination matter; reversing both swaps hemispheres with the same day length.

### What does this scene model?
The scene uses equatorial coordinates for rotation and changes sunlight direction with declination; it does not simulate Earth's orbit. The surface uses NASA Earth Observatory's Blue Marble: Next Generation satellite composite for July 2004. It shows real land and ocean rather than live weather; lighting is computed independently.

## Check
At declination 0°, several latitudes should all give 12 hours of daylight. Then set latitude to 75° and declination to +23.44° and −23.44° to observe polar day and polar night.

## Explore further
Atmospheric refraction, the Sun's apparent radius, and terrain are omitted, so actual sunrise and sunset differ from these geometric results. Changing declination explores seasonal conditions but is not a complete seasonal or orbital simulation.
