# Plan: Pro Score 2.0 Implementation

This plan upgrades the SkiPro scoring algorithm from a basic additive model to a professional-grade "Ski Condition Index" based on meteorological research.

## 1. State Management Centralization
- Move global variables (`currentUnit`, `cachedWeatherData`, `cachedLocation`, `currentLang`) into a single `state` object.
- Update all functions to reference `state` instead of global variables.

## 2. Professional Scoring Algorithm (`calculateProScore`)
- **Wind Chill**: Implement the professional formula for "felt" temperature to penalize extreme cold/wind.
- **Snow Quality (Density Proxy)**: Use relative humidity as a multiplier for snowfall volume.
    - Humidity < 50%: $\times 1.2$ (Dry Powder)
    - 50% - 70%: $\times 1.0$ (Standard)
    - > 70%: $\times 0.7$ (Heavy/Wet Snow)
- **Bluebird Bonus**: Add $+15$ points if the sky is clear (`weather_code === 0`) and there is fresh snow.
- **Melt-Freeze Cycle Penalty**: Subtract $20$ points if the daily max is above $0^\circ\text{C}$ and the min is below $0^\circ\text{C}$ (creates a hard crust/ice).
- **Rain-on-Snow Penalty**: Heavy penalty ($-30$) if rain is detected followed by freezing temperatures.

## 3. UI/UX Transparency
- **Detailed Metrics**: Update `renderCard` to display:
    - Relative Humidity (%)
    - Wind Chill (felt temperature)
    - Condition Label (e.g., "Powder", "Icy", "Heavy")
- **Dynamic Labels**: Change "Fair/Good/Epic" to include the specific condition type.

## 4. Verification Plan
- Verify that the state object is correctly updated on unit/language changes.
- Test a "Bluebird" scenario (Clear sky, low temp, fresh snow) $\to$ Score should be Epic.
- Test a "Melt-Freeze" scenario (Max 2°C, Min -2°C) $\to$ Score should be penalized.
- Verify that humidity and wind chill are correctly displayed in the UI.