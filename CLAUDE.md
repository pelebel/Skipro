# SkiPro: Liquid Edition

A specialized weather application for skiers and snowboarders that evaluates skiing conditions using a custom scoring algorithm.

## Project Overview
SkiPro provides real-time weather data and a "Pro Score" (0-100) to determine the quality of skiing conditions based on snowfall, temperature, humidity, and wind.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **API**: Open-Meteo API (Geocoding and Forecast)
- **Deployment**: Static site

## Key Technical Details
- **Pro Score Algorithm**: Located in `script.js` (`calculateProScore`). It weights snowfall volume, temperature ranges (optimal: -18°C to -10°C), humidity, and wind speed.
- **UI Style**: iOS-inspired "Liquid" design with dynamic gradients and backdrop filters.
- **Units**: Supports both Celsius and Fahrenheit.

## Development Guidelines
- **Styling**: Follow the glassmorphism theme defined in `style.css`. Use CSS variables for colors and glass effects.
- **API Usage**: All weather data is fetched from `api.open-meteo.com` and geocoding from `geocoding-api.open-meteo.com`.
- **Mobile First**: The app is designed for mobile viewports (max-width: 430px).

## Project Structure
- `index.html`: Main entry point and UI structure.
- `style.css`: Styles and animations.
- `script.js`: Core logic, API integration, and scoring algorithm.