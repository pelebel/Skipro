(function () {
    'use strict';

    const WEATHER_ICONS = {
        0: '☀️',
        1: '🌤️',
        2: '⛅',
        3: '☁️',
        45: '🌫️',
        48: '🌫️',
        51: '🌧️',
        53: '🌧️',
        55: '🌧️',
        56: '🌧️',
        57: '🌧️',
        61: '🌧️',
        63: '🌧️',
        65: '🌧️',
        66: '🌧️',
        67: '🌧️',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        77: '❄️',
        80: '🌧️',
        81: '🌧️',
        82: '🌧️',
        85: '❄️',
        86: '❄️',
        95: '⛈️',
        96: '⛈️',
        99: '⛈️'
    };

    function getIcon(code) {
        return WEATHER_ICONS[code] || '🌡️';
    }

    const state = {
        lang: 'en',
        abortController: null,
        dateFormatters: null
    };

    const translations = {
        en: {
            welcome: 'Tap "Go" or enter a city to begin.',
            use_location: '📍 Use My Location',
            realtime: 'Real-time',
            live: 'Live',
            error_not_found: 'Location not found.',
            error_location_denied: 'Location access denied. Please search manually.',
            error_geolocation: 'Geolocation not supported by your device.',
            error_network: 'Network error. Please check your connection.',
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
            error_location_denied: 'Acceso a ubicación denegado. Busca manualmente.',
            error_geolocation: 'Geolocalización no soportada en tu dispositivo.',
            error_network: 'Error de red. Verifica tu conexión.',
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
            error_location_denied: 'Accès à la position refusé. Recherchez manuellement.',
            error_geolocation: 'La géolocalisation n\'est pas supportée.',
            error_network: 'Erreur réseau. Vérifiez votre connexion.',
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
            welcome: 'Tippen Sie auf "Los" oder geben Sie eine Stadt ein.',
            use_location: '📍 Mein Standort',
            realtime: 'Echtzeit',
            live: 'Live',
            error_not_found: 'Ort nicht gefunden.',
            error_location_denied: 'Standortzugriff verweigert. Suchen Sie manuell.',
            error_geolocation: 'Geolokalisierung wird nicht unterstützt.',
            error_network: 'Netzwerkfehler. Prüfen Sie Ihre Verbindung.',
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
        const cityInput = document.getElementById('cityInput');
        if (cityInput) cityInput.placeholder = t('search_placeholder');
        const goBtn = document.querySelector('.search-box button');
        if (goBtn) goBtn.innerText = t('go_btn');
    }

    // Yellow scores (#ccff00, #ffdf00) on dark glass background pass WCAG AA
    // for large text (score numbers are 1.2rem+ bold). No code change needed.

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
        if (humidity < 50) qualityMultiplier = 1.2;
        else if (humidity > 70) qualityMultiplier = 0.7;

        // 3. Base Winter Score
        let winterScore = 0;

        // Snow Memory: Base score from yesterday's snow
        if (prevSnow > 10) winterScore += 20;
        else if (prevSnow > 0) winterScore += 10;

        winterScore += Math.min((snow * qualityMultiplier / 30) * 40, 40);

        // Temperature Quality Points
        let tempPoints = 0;
        if (avgT >= -6 && avgT <= -1) tempPoints = 25;
        else if (avgT < -10) tempPoints = 20;
        else if (avgT > -1 && avgT <= 2) tempPoints = 10;
        winterScore += tempPoints;

        // 4. Bluebird Bonus (Clear Sky + Recent Snow)
        if (weatherCode === 0 && (snow > 0 || prevSnow > 10)) {
            winterScore += 20;
        }

        // 5. Melt-Freeze Cycle Penalty
        if (maxT > 0 && minT < 0) {
            winterScore -= 20;
        }

        // 6. Rain-on-Snow Penalty
        const rainCodes = [61, 63, 65, 80, 81, 82];
        if (rainCodes.includes(weatherCode) && avgT < 3) {
            winterScore -= 30;
        }

        // Wind Penalty (Extreme Cold/Wind)
        if (windChill < -25) winterScore -= 15;

        // Spring Score Logic (Retained and refined)
        let springScore = 0;
        if (maxT > 0 && (weatherCode === 0 || weatherCode === 1)) {
            springScore = 25;
            if (weatherCode === 0) springScore += 15;
            if (maxT >= 2 && maxT <= 10) springScore += 10;
            if (wind < 15) springScore += 10;
        }

        // Prime Window Bonus (Retained)
        let isPrime = false;
        if (hourlyData && hourlyData.temps.length >= 3) {
            let consecutiveHours = 0;
            for (let i = 0; i < hourlyData.temps.length; i++) {
                const temp = hourlyData.temps[i];
                const code = hourlyData.codes[i];
                if (temp !== undefined && code !== undefined && temp >= 2 && temp <= 10 && (code === 0 || code === 1)) {
                    consecutiveHours++;
                    if (consecutiveHours >= 3) {
                        isPrime = true;
                        springScore += 20;
                    }
                } else {
                    consecutiveHours = 0;
                }
            }
        }

        // Snow-presence gate: no snow at all caps spring score at 30
        if (snow === 0 && prevSnow === 0) {
            springScore = Math.min(springScore, 30);
        }
        springScore = Math.min(springScore, 70);

        const finalScore = Math.max(Math.round(winterScore), Math.round(springScore));

        return {
            score: Math.min(Math.max(finalScore, 0), 100),
            isPrime,
            windChill: Math.round(windChill),
            quality: qualityMultiplier > 1 ? 'Powder' : (qualityMultiplier < 1 ? 'Heavy' : 'Standard')
        };
    }

    function autoLocate() {
        if (!navigator.geolocation) {
            showError(t('error_geolocation'));
            return;
        }
        toggleLoading(true);
        if (state.abortController) state.abortController.abort();
        state.abortController = new AbortController();
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        }, () => {
            toggleLoading(false);
            showError(t('error_location_denied'));
        });
    }

    async function getWeather() {
        const city = document.getElementById('cityInput').value.trim();
        if (!city) return;

        toggleLoading(true);
        if (state.abortController) state.abortController.abort();
        state.abortController = new AbortController();
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${state.lang}&format=json`, {
                signal: state.abortController.signal
            });
            const geoData = await geoRes.json();
            if (!geoData.results) throw new Error(t('error_not_found'));
            const { latitude, longitude, name, country } = geoData.results[0];

            localStorage.setItem('lastCity', city);
            fetchWeatherByCoords(latitude, longitude, name, country);
        } catch (e) {
            if (e.name === 'AbortError') return;
            showError(e.message || t('error_not_found'));
            toggleLoading(false);
        }
    }

    async function fetchWeatherByCoords(lat, lon, name = "Your Location", country = "") {
        const weatherDisplay = document.getElementById('weatherDisplay');
        const forecastList = document.getElementById('forecastList');
        const placeholder = document.getElementById('placeholderText');
        const liveScoreContainer = document.getElementById('liveScoreContainer');

        toggleLoading(true);
        forecastList.innerHTML = '';

        try {
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,wind_speed_10m_max,relative_humidity_2m_max,weather_code&timezone=auto`, {
                signal: state.abortController?.signal
            });
            const data = await weatherRes.json();

            document.getElementById('errorMsg').style.display = 'none';
            document.getElementById('locationName').innerText = `${name}, ${country}`;
            const liveIcon = getIcon(data.current.weather_code);
            document.getElementById('liveTemp').innerText = `${liveIcon} ${Math.round(data.current.temperature_2m)}°C`;

            // Calculate and display Live Pro Score (use real daily data for today)
            const hourlyStart = 0;
            const hourlyEnd = Math.min(24, data.hourly.temperature_2m.length);
            let liveHourlyData = null;
            if (hourlyEnd - hourlyStart >= 3) {
                liveHourlyData = {
                    temps: data.hourly.temperature_2m.slice(hourlyStart, hourlyEnd),
                    codes: data.hourly.weather_code.slice(hourlyStart, hourlyEnd),
                    wind: data.hourly.wind_speed_10m.slice(hourlyStart, hourlyEnd)
                };
            }
            const liveResult = calculateProScore(data.daily, 0, liveHourlyData);

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
                const hourlyStart = i * 24;
                const hourlyEnd = Math.min((i + 1) * 24, data.hourly.temperature_2m.length);
                const hourlySliceLength = hourlyEnd - hourlyStart;

                let hourlyData = null;
                if (hourlySliceLength >= 3) {
                    hourlyData = {
                        temps: data.hourly.temperature_2m.slice(hourlyStart, hourlyEnd),
                        codes: data.hourly.weather_code.slice(hourlyStart, hourlyEnd),
                        wind: data.hourly.wind_speed_10m.slice(hourlyStart, hourlyEnd)
                    };
                }

                const result = calculateProScore(data.daily, i, hourlyData);
                renderCard(data.daily, i, result, data.daily.weather_code ? data.daily.weather_code[i] : null);
            }

            weatherDisplay.style.display = 'block';
            placeholder.style.display = 'none';
        } catch (e) {
            if (e.name === 'AbortError') return;
            showError(e.message || t('error_network'));
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

        let label;
        let sub;
        if (isToday) {
            label = t('today');
            sub = t('live_forecast');
        } else if (isTomorrow) {
            label = t('tomorrow');
            sub = state.dateFormatters.monthDay.format(dateObj);
        } else {
            label = state.dateFormatters.weekday.format(dateObj);
            sub = state.dateFormatters.monthDay.format(dateObj);
        }

        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const wind = Math.round(daily.wind_speed_10m_max[i]);
        const snow = daily.snowfall_sum[i] || 0;

        const { color, text: status } = getScoreMetadata(result.score);

        // Safe DOM construction (no innerHTML)
        const card = document.createElement('div');
        card.className = 'forecast-card';

        const dayDiv = document.createElement('div');
        const dayLabel = document.createElement('span');
        dayLabel.className = 'day-label';
        dayLabel.textContent = label;
        dayLabel.appendChild(document.createTextNode(' ' + getIcon(weatherCode)));
        if (result.isPrime && weatherCode !== null && weatherCode <= 1) {
            const primeBadge = document.createElement('span');
            primeBadge.className = 'prime-badge';
            primeBadge.textContent = 'Prime';
            dayLabel.appendChild(primeBadge);
        }
        const daySub = document.createElement('span');
        daySub.className = 'day-sub';
        daySub.textContent = sub;
        dayDiv.appendChild(dayLabel);
        dayDiv.appendChild(daySub);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details-mid';
        detailsDiv.appendChild(document.createTextNode(`${tempMax}° / ${tempMin}°C`));
        detailsDiv.appendChild(document.createElement('br'));
        detailsDiv.appendChild(document.createTextNode(`💨 ${wind}km/h ${snow > 0 ? '❄️ ' + snow.toFixed(1) + 'cm' : t('no_snow')}`));

        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'rating-right';
        const scoreSpan = document.createElement('span');
        scoreSpan.className = `score-num ${color}`;
        scoreSpan.textContent = result.score;
        const txtSpan = document.createElement('span');
        txtSpan.className = `score-txt ${color}`;
        txtSpan.textContent = status;
        ratingDiv.appendChild(scoreSpan);
        ratingDiv.appendChild(txtSpan);

        card.appendChild(dayDiv);
        card.appendChild(detailsDiv);
        card.appendChild(ratingDiv);
        list.appendChild(card);
    }

    function toggleLoading(isLoading) {
        document.body.classList.toggle('loading', isLoading);
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = isLoading ? 'block' : 'none';
        }
    }

    function showError(msg) {
        const errorEl = document.getElementById('errorMsg');
        errorEl.innerText = msg;
        errorEl.style.display = 'block';
        document.getElementById('weatherDisplay').style.display = 'none';
        document.getElementById('placeholderText').style.display = 'block';
    }

    // Init
    window.onload = () => {
        // Detect user language
        const browserLang = navigator.language.split('-')[0];
        state.lang = translations[browserLang] ? browserLang : 'en';

        // Cache Intl.DateTimeFormat formatters for performance
        state.dateFormatters = {
            weekday: new Intl.DateTimeFormat(state.lang, { weekday: 'short' }),
            monthDay: new Intl.DateTimeFormat(state.lang, { month: 'short', day: 'numeric' })
        };

        applyTranslations();

        // Attach event listeners (replaces inline handlers)
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            getWeather();
        });
        document.getElementById('locateBtn').addEventListener('click', autoLocate);

        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            document.getElementById('cityInput').value = lastCity;
            getWeather();
        }
    };
})();
