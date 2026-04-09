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

let currentUnit = 'C';
let cachedWeatherData = null;
let cachedLocation = null;
let currentLang = 'en';

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
    return translations[currentLang]?.[key] || translations['en'][key] || key;
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
    currentUnit = document.getElementById('unitToggle').checked ? 'F' : 'C';
    document.getElementById('unitLabel').innerText = currentUnit === 'F' ? '°F' : '°C';

    // If we have cached data, refresh the display without a new API call
    if (cachedWeatherData && cachedLocation) {
        updateWeatherDisplay();
    } else {
        const locationName = document.getElementById('locationName').innerText;
        if (locationName !== '---') {
            getWeather();
        }
    }
}

function convertTemp(temp) {
    if (currentUnit === 'F') {
        return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
}

// Algorithm: Snow-Primary logic
function calculateProScore(daily, index, hourlyData = null) {
    const maxT = daily.temperature_2m_max[index];
    const minT = daily.temperature_2m_min[index];
    const snow = daily.snowfall_sum[index] || 0;
    const wind = daily.wind_speed_10m_max[index] || 0;
    const humidity = daily.relative_humidity_max ? daily.relative_humidity_max[index] : 50;
    const weatherCode = daily.weather_code ? daily.weather_code[index] : null;
    const avgT = (maxT + minT) / 2;

    // Winter Score Logic
    let winterScore = 0;
    winterScore += Math.min((snow / 30) * 40, 40); // Snow volume

    let qualityScore = 0;
    if (snow > 0) {
        if (avgT >= -18 && avgT <= -10) qualityScore += 25;
        else if (avgT > -10 && avgT <= -2) qualityScore += 15;
        if (humidity < 45) qualityScore += 20;
        else if (humidity < 70) qualityScore += 10;
    }
    winterScore += qualityScore;

    let expScore = 15;
    if (wind > 30) expScore = 0;
    else if (wind > 15) expScore = 7;
    winterScore += expScore;

    if (snow === 0) winterScore = Math.min(winterScore, 40);
    winterScore = Math.min(Math.round(winterScore), 100);

    // Spring Score Logic
    let springScore = 0;
    if (maxT > 0 && (weatherCode === 0 || weatherCode === 1)) {
        springScore = 60; // Base for sunny spring day
        if (weatherCode === 0) springScore += 15; // Bonus for perfectly clear
        if (maxT >= 2 && maxT <= 10) springScore += 10; // Ideal spring temp
        if (wind < 15) springScore += 10; // Calm wind
    }

    // Prime Window Bonus
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
                    // If it's a prime window, it's at least a "Good" day
                    if (springScore < 60) springScore = 60;
                    springScore += 20;
                }
            } else {
                consecutiveHours = 0;
            }
        }
    }

    springScore = Math.min(Math.round(springScore), 100);

    return { score: Math.max(winterScore, springScore), isPrime };
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
    const { latitude, longitude, name, country } = cachedLocation;
    fetchWeatherByCoords(latitude, longitude, name, country, true);
}

async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return;

    toggleLoading(true);
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=${currentLang}&format=json`);
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

    if (!isUpdatingUnits) {
        toggleLoading(true);
    }

    forecastList.innerHTML = '';

    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,wind_speed_10m_max,relative_humidity_2m_max,weather_code&timezone=auto`);
        const data = await weatherRes.json();

        // Cache the data for unit toggling
        cachedWeatherData = data;
        cachedLocation = { latitude: lat, longitude: lon, name: name, country: country };

        document.getElementById('locationName').innerText = `${name}, ${country}`;
        document.getElementById('liveTemp').innerText = `${convertTemp(data.current.temperature_2m)}°${currentUnit}`;

        // Extended to 7 days
        for (let i = 0; i < 7; i++) {
            // Slice hourly data for this specific day (24 hours)
            const hourlyData = {
                temps: data.hourly.temperature_2m.slice(i * 24, (i + 1) * 24),
                codes: data.hourly.weather_code.slice(i * 24, (i + 1) * 24),
                wind: data.hourly.wind_speed_10m.slice(i * 24, (i + 1) * 24)
            };

            const result = calculateProScore(data.daily, i, hourlyData);
            renderCard(data.daily, i, result.score, result.isPrime, data.daily.weather_code ? data.daily.weather_code[i] : null);
        }

        weatherDisplay.style.display = 'block';
        placeholder.style.display = 'none';
    } catch (e) {
        showError(e.message || 'Weather data unavailable');
    } finally {
        toggleLoading(false);
    }
}

function renderCard(daily, i, score, isPrime, weatherCode) {
    const list = document.getElementById('forecastList');
    const dateObj = new Date(daily.time[i]);
    let label = dateObj.toLocaleDateString(currentLang, { weekday: 'short' });
    let sub = dateObj.toLocaleDateString(currentLang, { month: 'short', day: 'numeric' });

    if (i === 0) { label = t('today'); sub = t('live_forecast'); }
    else if (i === 1) { label = t('tomorrow'); }

    const tempMax = convertTemp(daily.temperature_2m_max[i]);
    const tempMin = convertTemp(daily.temperature_2m_min[i]);
    const wind = Math.round(daily.wind_speed_10m_max[i]);
    const snow = daily.snowfall_sum[i] || 0;

    let status = t('score_fair'), color = "fair";
    if (score >= 85) { status = t('score_epic'); color = "epic"; }
    else if (score >= 65) { status = t('score_good'); color = "good"; }
    else if (score < 45) { status = t('score_poor'); color = "bad"; }

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
        <div>
            <span class="day-label">${label} ${getIcon(weatherCode)}${isPrime ? '<span class="prime-badge">Prime</span>' : ''}</span>
            <span class="day-sub">${sub}</span>
        </div>
        <div class="details-mid">
            ${tempMax}° / ${tempMin}°${currentUnit}
            <br>💨 ${wind}km/h ${snow > 0 ? '❄️ '+snow.toFixed(1)+'cm' : t('no_snow')}
        </div>
        <div class="rating-right">
            <span class="score-num ${color}">${score}</span>
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
    currentLang = translations[browserLang] ? browserLang : 'en';

    applyTranslations();

    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        document.getElementById('cityInput').value = lastCity;
        getWeather();
    }
}