/**
 * Premium Weather Dashboard Logic
 * Powered by Open-Meteo API
 */

const API_CONFIG = {
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
    GEO_URL: 'https://geocoding-api.open-meteo.com/v1/search',
};

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loader');
const weatherDataContainer = document.getElementById('weather-data');
const cityNameEl = document.getElementById('city-name');
const currentTempEl = document.getElementById('current-temp');
const weatherIconMainEl = document.getElementById('weather-icon-main');
const weatherDescEl = document.getElementById('weather-desc');
const currentDateEl = document.getElementById('current-date');

const uvIndexEl = document.getElementById('uv-index');
const uvStatusEl = document.getElementById('uv-status');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const forecastContainer = document.getElementById('forecast-container');
const appContainer = document.getElementById('app');

// WMO Weather Code Mapping (Simplified for UI)
const weatherMap = {
    0: { desc: '맑음', icon: 'sun', bg: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)' },
    1: { desc: '대체로 맑음', icon: 'sun', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    2: { desc: '구름 조금', icon: 'cloud-sun', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
    3: { desc: '흐림', icon: 'cloud', bg: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' },
    45: { desc: '안개', icon: 'cloud-fog', bg: 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)' },
    48: { desc: '안개', icon: 'cloud-fog', bg: 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)' },
    51: { desc: '이슬비', icon: 'cloud-drizzle', bg: 'linear-gradient(135deg, #4ca1af 0%, #c4e0e5 100%)' },
    61: { desc: '비', icon: 'cloud-rain', bg: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
    71: { desc: '눈', icon: 'cloud-snow', bg: 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)' },
    95: { desc: '뇌우', icon: 'cloud-lightning', bg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%, #24243e 100%)' },
};

function getWeatherDescription(code) {
    return weatherMap[code] || { desc: '정보 없음', icon: 'cloud', bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' };
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Default: Seoul or User Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, '내 위치'),
            () => fetchWeatherByCity('Seoul')
        );
    } else {
        fetchWeatherByCity('Seoul');
    }
});

// Search Event
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

async function fetchWeatherByCity(cityName) {
    showLoading(true);
    try {
        const geoRes = await fetch(`${API_CONFIG.GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ko`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert('도시를 찾을 수 없습니다.');
            showLoading(false);
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        await fetchWeatherByCoords(latitude, longitude, name);
    } catch (error) {
        console.error('Error fetching city:', error);
        alert('데이터를 가져오는 중 오류가 발생했습니다.');
        showLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon, label) {
    showLoading(true);
    try {
        const url = `${API_CONFIG.WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        updateUI(data, label);
    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('날씨 데이터를 가져오는데 실패했습니다.');
    } finally {
        showLoading(false);
    }
}

function updateUI(data, cityName) {
    const current = data.current;
    const weather = getWeatherDescription(current.weather_code);

    // Main Info
    cityNameEl.textContent = cityName;
    currentTempEl.textContent = `${Math.round(current.temperature_2m)}°`;
    weatherDescEl.textContent = weather.desc;
    weatherIconMainEl.innerHTML = `<i data-lucide="${weather.icon}"></i>`;
    
    // Date
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', locale: 'ko-KR' };
    currentDateEl.textContent = now.toLocaleDateString('ko-KR', options);

    // Details
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°`;
    
    // UV Index (From hourly, nearest current hour)
    const currentHour = now.getHours();
    const uvValue = data.hourly.uv_index[currentHour] || 0;
    uvIndexEl.textContent = uvValue.toFixed(1);
    updateUVStatus(uvValue);

    // Forecast
    updateForecast(data.daily);

    // Dynamic Background
    appContainer.style.background = weather.bg;

    // Refresh Icons
    lucide.createIcons();
    
    weatherDataContainer.classList.remove('hidden');
}

function updateUVStatus(val) {
    let status = '낮음';
    let color = 'var(--success)';
    if (val >= 3 && val < 6) { status = '보통'; color = 'var(--warning)'; }
    else if (val >= 6 && val < 8) { status = '높음'; color = '#f97316'; }
    else if (val >= 8 && val < 11) { status = '매우 높음'; color = 'var(--danger)'; }
    else if (val >= 11) { status = '위험'; color = '#7e22ce'; }
    
    uvStatusEl.textContent = status;
    uvStatusEl.style.color = 'white';
    uvStatusEl.style.backgroundColor = color;
}

function updateForecast(daily) {
    forecastContainer.innerHTML = '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? '오늘' : days[date.getDay()];
        const weather = getWeatherDescription(daily.weather_code[i]);
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-day">${dayName}요일</div>
            <div class="forecast-icon"><i data-lucide="${weather.icon}"></i></div>
            <div class="forecast-temp">${maxTemp}° <span>${minTemp}°</span></div>
        `;
        forecastContainer.appendChild(item);
    }
}

function showLoading(show) {
    if (show) {
        loader.classList.remove('hidden');
        weatherDataContainer.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        weatherDataContainer.classList.remove('hidden');
    }
}
