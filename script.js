// Weather code to icon mapping
const WEATHER_ICONS = {
    0: '☀️',    // Clear sky
    1: '🌤️',    // Mainly clear
    2: '⛅',    // Partly cloudy
    3: '☁️',    // Overcast
    45: '🌫️',   // Fog
    L: '🌫️',    // Mist
    s: '🌫️',    // Slight snow
    61: '🌧️',   // Slight rain
    63: '🌧️',   // Rain
    65: '🌧️',   // Heavy rain
    71: '❄️',   // Slight snow fall
    73: '❄️',   // Moderate snow fall
    75: '❄️',   // Heavy snow fall
    77: '❄️',   // Snow canonical
    80: '🌧️',   // Slight rain showers
    81: '🌧️',   // Moderate rain showers
    82: '🌧️',   // Heavy rain showers
    95: '⛈️',   // Thunderstorm
};

function getIcon(code) {
    return WEATHER_ICONS[code] || '🌡️';
}

const state = {
    weather: null,
    location: null,
    lang: 'en',
    cachedWeatherData: null,
    cachedLocation: null
};

const translations = {
    en: {
        welcome: 'Tap "Go" or enter a city to begin.',
        use_location: '📍 Use My Location',
        realtime: 'Real-time',
        live: 'Live',
        error_not_found: 'Location not found.',
        search_placeholder: 'Search mountains...',
        go_btn: 'Go',
        today: 'Today',
        tomorrow: 'Tomorrow',
        live_forecast: 'Live + Forecast',
        no_snow: 'No Snow',
        score_epic: 'Epic',
        score_good: 'Good',
        score_fair: 'Fair',
        score_poor: 'Poor'
    },
    es: {
        welcome: 'Toca "Ir" o introduce una ciudad para empezar.',
        use_location: '📍 Usar mi ubicación',
        realtime: 'En tiempo real',
        live: 'En vivo',
        error_not_found: 'Ubicación no encontrada.',
        search_placeholder: 'Buscar montañas...',
        go_btn: 'Ir',
        today: 'Hoy',
        tomorrow: 'Mañana',
        live_forecast: 'En vivo + Pronóstico',
        no_snow: 'Sin nieve',
        score_epic: 'Épico',
        score_good: 'Bueno',
        score_fair: 'Regular',
        score_poor: 'Pobre'
    },
    fr: {
        welcome: 'Appuyez sur "Rechercher" ou saisissez une ville pour commencer.',
        use_location: '📍 Utiliser ma position',
        realtime: 'En temps réel',
        live: 'En direct',
        error_not_found: 'Lieu non trouvé.',
        search_placeholder: 'Rechercher...',
        go_btn: 'Rechercher',
        today: 'Aujourd\'hui',
        tomorrow: 'Demain',
        live_forecast: 'Direct + Prévisions',
        no_snow: 'Pas de neige',
        score_epic: 'Épique',
        score_good: 'Bon',
        score_fair: 'Passable',
        score_poor: 'Médiocre'
    },
    de: {
        welcome: 'Tippen Sie auf "Los" oder geben Sie eine Stadt ein, um zu beginnen.',
        use_location: '📍 Mein Standort',
        realtime: 'Echtzeit',
        live: 'Live',
        error_not_found: 'Ort nicht gefunden.',
        search_placeholder: 'Berge suchen...',
        go_btn: 'Los',
        today: 'Heute',
        tomorrow: 'Morgen',
        live_forecast: 'Live + Vorhersage',
        no_snow: 'Kein Schnee',
        score_epic: 'Episch',
        score_good: 'Gut',
        score_fair: 'Mittel',
        score_poor: 'Schlecht'
    }
};

function t(key) {
    return translations[state.lang]?.[key] || translations['en'][key] || key;
}

function getScoreMetadata(score) {
    if (score >= 85) return { color: "epic", text: t('score_epic') };
    if (score >= 65) return { color: "good", text: t('score_good') };
    if (score < 45) return { color: "bad", text: t('score_poor') };
    return { color: "fair", text: t('score_fair') };
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = t(key);
    });
    document.getElementById('cityInput').placeholder = t('search_placeholder');
    document.querySelector('.search-box button').innerText = t('go_btn');
}

function toggleUnits() {
    // This function is now deprecated as we only use Celsius
    console.log('Unit toggling is disabled. Metric system is now permanent.');
}

function convertTemp(temp) {
    return Math.round(temp);
}

// Algorithm: Snow-Primary logic
// Algorithm: Pro Score 2.0 - Professional Ski Condition Index
function calculateProScore(daily, index, hourlyData = null) {
    const maxT = daily.temperature_2m_max[index];
    const minT = daily.temperature_2m_min[index];
    const snow = daily.snowfall_sum[index] || 0;
    const prevSnow = index > 0 ? (daily.snowfall_sum[index - 1] || 0) : 0;
    const wind = daily.wind_speed_10m_max[index] || 0;
    const humidity = daily.relative_humidity_max ? daily.relative_humidity_max[index] : 50;
    const weatherCode = daily.weather_code ? daily.weather_code[index] : null;
    const avgT = (maxT + minT) / 2;

    // 1. Wind Chill Calculation (Professional Formula)
    const windChill = 13.12 + (0.6215 * avgT) - (11.37 * Math.pow(wind, 0.16)) + (0.3965 * avgT * Math.pow(wind, 0.16));

    // 2. Snow Quality Multiplier (Density Proxy)
    let qualityMultiplier = 1.0;
    if (humidity < 50) qualityMultiplier = 1.2;      // Dry Powder
    else if (humidity > 70) qualityMultiplier = 0.7;      // Heavy/Wet Snow

    // 3. Base Winter Score
    let winterScore = 0;

    // Snow Memory: Base score from yesterday's snow
    if (prevSnow > 10) winterScore += 20;
    else if (prevSnow > 0) winterScore += 10;

    winterScore += Math.min((snow * qualityMultiplier / 30) * 40, 40); // Weighted snow volume

    // Temperature Quality Points
    let tempPoints = 0;
    if (avgT >= -6 && avgT <= -1) tempPoints = 25; // Sweet spot
    else if (avgT < -10) tempPoints = 20;           // Deep freeze (good for powder)
    else if (avgT > -1 && avgT <= 2) tempPoints = 10; // Near melting
    winterScore += tempPoints;

    // 4. Bluebird Bonus (Clear Sky + Recent Snow)
    if (weatherCode === 0 && (snow > 0 || prevSnow > 10)) {
        winterScore += 20;
    }

    // 5. Melt-Freeze Cycle Penalty
    if (maxT > 0 && minT < 0) {
        winterScore -= 20; // Hard crust/ice formation
    }

    // 6. Rain-on-Snow Penalty
    const rainCodes = [61, 63, 65, 80, 81, 82];
    if (rainCodes.includes(weatherCode) && avgT < 3) {
        winterScore -= 30; // Glaze/Ice
    }

    // Wind Penalty (Extreme Cold/Wind)
    if (windChill < -25) winterScore -= 15;

    // Spring Score Logic (Retained and refined)
    let springScore = 0;
    if (maxT > 0 && (weatherCode === 0 || weatherCode === 1)) {
        springScore = 40; // Lowered base to start as 'Fair'
        if (weatherCode === 0) springScore += 15;
        if (maxT >= 2 && maxT <= 10) springScore += 10;
        if (wind < 15) springScore += 10;
    }

    // Prime Window Bonus (Retained)
    let isPrime = false;
    if (hourlyData) {
        let consecutiveHours = 0;
        for (let i = 0; i < hourlyData.temps.length; i++) {
            const temp = hourlyData.temps[i];
            const code = hourlyData.codes[i];
            if (temp >= 2 && temp <= 10 && (code === 0 || code === 1)) {
                consecutiveHours++;
                if (consecutiveHours >= 3) {
                    isPrime = true;
                    springScore += 20; // Additive bonus, no more floor
                }
            } else {
                consecutiveHours = 0;
            }
        }
    }

    const finalScore = Math.max(Math.round(winterScore), Math.round(springScore));

    return {
        score: Math.min(finalScore, 100),
        isPrime,
        windChill: Math.round(windChill),
        quality: qualityMultiplier > 1 ? 'Powder' : (qualityMultiplier < 1 ? 'Heavy' : 'Standard')
    };
}

function autoLocate() {
    if (navigator.geolocation) {
        toggleLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        }, (err) => {
            toggleLoading(false);
            alert("Location access denied. Please search manually.");
        });
    } else {
        alert("Geolocation not supported by your device.");
    }
}

function updateWeatherDisplay() {
    const { latitude, longitude, name, country } = state.cachedLocation;
    fetchWeatherByCoords(latitude, longitude, name, country, true);
}

async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    toggleLoading(true);
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=${state.lang}&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error(t('error_not_found'));
        const { latitude, longitude, name, country } = geoData.results[0];

        localStorage.setItem('lastCity', city);
        fetchWeatherByCoords(latitude, longitude, name, country);
    } catch (e) {
        showError(e.message || t('error_not_found'));
        toggleLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon, name = "Your Location", country = "", isUpdatingUnits = false) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    const forecastList = document.getElementById('forecastList');
    const placeholder = document.getElementById('placeholderText');
    const liveScoreContainer = document.getElementById('liveScoreContainer');

    if (!isUpdatingUnits) {
        toggleLoading(true);
    }

    forecastList.innerHTML = '';

    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,wind_speed_10m_max,relative_humidity_2m_max,weather_code&timezone=auto`);
        const data = await weatherRes.json();

        // Cache the data for unit toggling
        state.cachedWeatherData = data;
        state.cachedLocation = { latitude: lat, longitude: lon, name: name, country: country };

        document.getElementById('locationName').innerText = `${name}, ${country}`;
        const liveIcon = getIcon(data.current.weather_code);
        document.getElementById('liveTemp').innerText = `${liveIcon} ${convertTemp(data.current.temperature_2m)}°C`;

        // Calculate and display Live Pro Score
        const currentMockDaily = {
            temperature_2m_max: [data.current.temperature_2m],
            temperature_2m_min: [data.current.temperature_2m],
            snowfall_sum: [0],
            wind_speed_10m_max: [data.current.wind_speed_10m],
            relative_humidity_max: [50], // Default since current humidity isn't in the request
            weather_code: [data.current.weather_code]
        };
        const liveResult = calculateProScore(currentMockDaily, 0);

        if (liveScoreContainer) {
            liveScoreContainer.style.display = 'flex';
            document.getElementById('liveScoreNum').innerText = liveResult.score;

            const { color, text } = getScoreMetadata(liveResult.score);
            liveScoreContainer.className = `score-num ${color}`;
            document.getElementById('liveScoreText').innerText = text;
        }

        // Extended to 7 days, starting from today
        for (let i = 0; i < 7; i++) {
            const dateObj = new Date(data.daily.time[i]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dateObj < today) continue;

            // Slice hourly data for this specific day (24 hours)
            const hourlyData = {
                temps: data.hourly.temperature_2m.slice(i * 24, (i + 1) * 24),
                codes: data.hourly.weather_code.slice(i * 24, (i + 1) * 24),
                wind: data.hourly.wind_speed_10m.slice(i * 24, (i + 1) * 24)
            };

            const result = calculateProScore(data.daily, i, hourlyData);
            renderCard(data.daily, i, result, data.daily.weather_code ? data.daily.weather_code[i] : null);
        }

        weatherDisplay.style.display = 'block';
        placeholder.style.display = 'none';
    } catch (e) {
        showError(e.message || 'Weather data unavailable');
    } finally {
        toggleLoading(false);
    }
}

function renderCard(daily, i, result, weatherCode) {
    const list = document.getElementById('forecastList');
    const dateObj = new Date(daily.time[i]);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = dateObj.toDateString() === today.toDateString();
    const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();

    let label = dateObj.toLocaleDateString(state.lang, { weekday: 'short' });
    let sub = dateObj.toLocaleDateString(state.lang, { month: 'short', day: 'numeric' });

    if (isToday) { label = t('today'); sub = t('live_forecast'); }
    else if (isTomorrow) { label = t('tomorrow'); }

    const tempMax = convertTemp(daily.temperature_2m_max[i]);
    const tempMin = convertTemp(daily.temperature_2m_min[i]);
    const wind = Math.round(daily.wind_speed_10m_max[i]);
    const snow = daily.snowfall_sum[i] || 0;

    const { color, text: status } = getScoreMetadata(result.score);

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
        <div>
            <span class="day-label">${label} ${getIcon(weatherCode)}${result.isPrime ? '<span class="prime-badge">Prime</span>' : ''}</span>
            <span class="day-sub">${sub}</span>
        </div>
        <div class="details-mid">
            ${tempMax}° / ${tempMin}°C
            <br>💨 ${wind}km/h ${snow > 0 ? '❄️ '+snow.toFixed(1)+'cm' : t('no_snow')}
        </div>
        <div class="rating-right">
            <span class="score-num ${color}">${result.score}</span>
            <span class="score-txt ${color}">${status}</span>
        </div>
    `;
    list.appendChild(card);
}

function toggleLoading(isLoading) {
    document.body.classList.toggle('loading', isLoading);
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = isLoading ? 'block' : 'none';
    }
}

function showError(msg = 'Location not found') {
    const errorEl = document.getElementById('errorMsg');
    errorEl.innerText = msg;
    errorEl.style.display = 'block';
    document.getElementById('weatherDisplay').style.display = 'none';
    document.getElementById('placeholderText').style.display = 'block';
}

// Init: Load last city and apply translations
window.onload = () => {
    // Detect user language
    const browserLang = navigator.language.split('-')[0];
    state.lang = translations[browserLang] ? browserLang : 'en';

    applyTranslations();

    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        document.getElementById('cityInput').value = lastCity;
        getWeather();
    }
}