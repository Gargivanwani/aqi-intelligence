// ===========================
// Map Component – Enhanced
// ===========================

let map;
let markers = [];
let allCities = [];
let activeFilter = 'all';
let refreshTimer = null;

// ── Init ──────────────────────────────────────────────
function initMap() {
  map = L.map('map', {
    scrollWheelZoom: false,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
    center: [22.5, 82.0],
    zoom: 5,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Inject pulse animation CSS once
  injectPulseCSS();
}

function injectPulseCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.8; }
      70%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .marker-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
    .marker-pulse {
      position: absolute;
      border-radius: 50%;
      animation: pulse-ring 2s ease-out infinite;
    }
    .marker-core {
      position: relative;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff;
      border: 2px solid rgba(255,255,255,0.55);
      font-family: 'Segoe UI', system-ui, sans-serif;
      cursor: pointer;
      z-index: 2;
    }
    .ranking-item { 
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .ranking-item:hover { background: rgba(255,255,255,0.06); }
    .ranking-rank { font-size: 0.72rem; color: #8b949e; width: 18px; text-align:right; flex-shrink:0; }
    .ranking-name { flex: 1; font-size: 0.88rem; font-weight: 600; }
    .ranking-aqi  { font-size: 0.85rem; font-weight: 800; }
    .ranking-bar-wrap { width: 60px; height: 4px; background: #30363d; border-radius: 2px; flex-shrink:0; }
    .ranking-bar { height: 4px; border-radius: 2px; transition: width 0.4s; }
    .filter-btn {
      padding: 6px 14px; border-radius: 20px; border: 1px solid #30363d;
      background: transparent; color: #8b949e; font-size: 0.8rem;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .filter-btn.active, .filter-btn:hover { background: #58a6ff22; border-color: #58a6ff; color: #58a6ff; }
    .sparkline-svg line { stroke-linecap: round; }
    .refresh-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.75rem; color: #8b949e; margin-left: auto;
    }
    .refresh-dot { width:7px; height:7px; border-radius:50%; background:#2ea043; flex-shrink:0; }
    .refresh-dot.stale { background: #f0b429; }
  `;
  document.head.appendChild(style);
}

// ── Markers ───────────────────────────────────────────
function createMarkerIcon(aqi) {
  const color = getAQIColor(aqi);
  const size = aqi >= 300 ? 40 : aqi >= 200 ? 34 : aqi >= 100 ? 28 : 24;
  const fontSize = size >= 34 ? '11' : size >= 28 ? '10' : '9';
  const shouldPulse = aqi >= 200;

  const pulseHtml = shouldPulse
    ? `<div class="marker-pulse" style="width:${size}px;height:${size}px;background:${color}44;"></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `<div class="marker-wrap" style="width:${size}px;height:${size}px;">
      ${pulseHtml}
      <div class="marker-core" style="width:${size}px;height:${size}px;background:${color};font-size:${fontSize}px;box-shadow:0 0 14px ${color}66;">
        ${aqi}
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function renderCitiesOnMap(cities) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const filtered = activeFilter === 'all' ? cities : cities.filter(c => {
    if (activeFilter === 'good')      return c.aqi <= 100;
    if (activeFilter === 'moderate')  return c.aqi > 100 && c.aqi <= 200;
    if (activeFilter === 'poor')      return c.aqi > 200 && c.aqi <= 300;
    if (activeFilter === 'critical')  return c.aqi > 300;
    return true;
  });

  filtered.forEach(city => {
    const icon = createMarkerIcon(city.aqi);
    const marker = L.marker([city.lat, city.lng], { icon });

    marker.bindTooltip(`
      <strong>${city.name}</strong><br/>
      AQI ${city.aqi} · ${getAQILabel(city.aqi)}<br/>
      <small>PM2.5: ${city.pm25 ?? '--'} µg/m³</small>
    `, { className: 'leaflet-tooltip-dark', direction: 'top', offset: [0, -10] });

    marker.on('click', () => showCityPanel(city));
    marker.addTo(map);
    markers.push(marker);
  });
}

// ── City Panel ────────────────────────────────────────
function showCityPanel(city) {
  const panel = document.getElementById('city-panel');
  const content = document.getElementById('city-panel-content');
  const level = getAQILevel(city.aqi);
  const trendChange = city.trend ? city.trend[city.trend.length - 1] - city.trend[0] : 0;
  const trendArrow = trendChange > 10 ? '↑ Worsening' : trendChange < -10 ? '↓ Improving' : '→ Stable';
  const trendColor = trendChange > 10 ? '#f85149' : trendChange < -10 ? '#2ea043' : '#f0b429';

  content.innerHTML = `
    <div style="border-left:4px solid ${level.color};padding-left:12px;margin-bottom:16px;">
      <div style="font-size:0.72rem;color:#8b949e;margin-bottom:2px;">${city.state ?? ''}</div>
      <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;">${city.name}</h3>
      ${formatAQIBadge(city.aqi)}
      <div style="margin-top:6px;font-size:0.78rem;color:${trendColor};font-weight:600;">${trendArrow} (7-day)</div>
    </div>

    ${city.trend ? `
    <div style="margin-bottom:16px;">
      <div style="font-size:0.72rem;color:#8b949e;margin-bottom:6px;">7-DAY TREND</div>
      ${buildSparkline(city.trend, level.color)}
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
      ${city.pm25 != null ? pollutantCard('PM2.5', city.pm25, 'µg/m³', city.pm25 > 60 ? '#f85149' : city.pm25 > 30 ? '#f0b429' : '#2ea043') : ''}
      ${city.pm10 != null ? pollutantCard('PM10',  city.pm10, 'µg/m³', city.pm10 > 100 ? '#f85149' : city.pm10 > 60 ? '#f0b429' : '#2ea043') : ''}
      ${city.no2  != null ? pollutantCard('NO₂',   city.no2,  'µg/m³', city.no2 > 80 ? '#f85149' : city.no2 > 40 ? '#f0b429' : '#2ea043') : ''}
      ${city.co   != null ? pollutantCard('CO',    city.co,   'mg/m³', city.co > 1 ? '#f85149' : city.co > 0.5 ? '#f0b429' : '#2ea043') : ''}
    </div>

    <div style="background:${level.bg};border:1px solid ${level.color}44;border-radius:8px;padding:12px;font-size:0.82rem;color:#e6edf3;line-height:1.55;margin-bottom:14px;">
      ⚠️ ${level.advice}
    </div>

    <div style="font-size:0.7rem;color:#8b949e;margin-bottom:12px;">
      ${city.source === 'live' ? '🟢 Live data' : '🟡 Simulated data'} · Updated ${city.updatedAt ?? '--'}
    </div>

    <button onclick="askAboutCity('${city.name}', ${city.aqi})" style="
      width:100%;background:#58a6ff;color:#0d1117;border:none;border-radius:8px;
      padding:10px;font-weight:700;cursor:pointer;font-size:0.88rem;
    ">🤖 Ask AI about ${city.name}</button>
  `;
  panel.classList.remove('hidden');
}

function pollutantCard(label, val, unit, color) {
  return `<div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:10px 12px;">
    <div style="font-size:0.7rem;color:#8b949e;margin-bottom:2px;">${label}</div>
    <div style="font-size:1rem;font-weight:800;color:${color};">${val}</div>
    <div style="font-size:0.68rem;color:#8b949e;">${unit}</div>
  </div>`;
}

function buildSparkline(trend, color) {
  const w = 240, h = 40, pad = 4;
  const min = Math.min(...trend), max = Math.max(...trend);
  const range = max - min || 1;
  const pts = trend.map((v, i) => {
    const x = pad + (i / (trend.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  // Area fill
  const areaPoints = `${pad},${h} ${polyline} ${w - pad},${h}`;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;">
    <defs>
      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${areaPoints}" fill="url(#sparkGrad)"/>
    <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[pts.length-1].split(',')[0]}" cy="${pts[pts.length-1].split(',')[1]}" r="3" fill="${color}"/>
  </svg>`;
}

function closePanel() {
  document.getElementById('city-panel').classList.add('hidden');
}

function askAboutCity(cityName, aqi) {
  closePanel();
  const input = document.getElementById('chat-input');
  input.value = `What precautions should I take in ${cityName} with AQI ${aqi}?`;
  document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => sendMessage(), 400);
}

// ── Rankings Sidebar ───────────────────────────────────
function renderRankings(cities) {
  const container = document.getElementById('rankings-list');
  if (!container) return;

  const sorted = [...cities].sort((a, b) => b.aqi - a.aqi);
  const maxAqi = sorted[0]?.aqi || 500;

  container.innerHTML = sorted.map((city, i) => {
    const color = getAQIColor(city.aqi);
    const barWidth = Math.round((city.aqi / maxAqi) * 100);
    return `<div class="ranking-item" onclick="flyToCity('${city.name}')">
      <span class="ranking-rank">${i + 1}</span>
      <span class="ranking-name">${city.name}</span>
      <div class="ranking-bar-wrap"><div class="ranking-bar" style="width:${barWidth}%;background:${color};"></div></div>
      <span class="ranking-aqi" style="color:${color};">${city.aqi}</span>
    </div>`;
  }).join('');
}

function flyToCity(name) {
  const city = allCities.find(c => c.name === name);
  if (!city) return;
  map.flyTo([city.lat, city.lng], 9, { duration: 1.2 });
  setTimeout(() => showCityPanel(city), 1300);
}

// ── Filter Bar ─────────────────────────────────────────
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderCitiesOnMap(allCities);
}

// ── Auto-refresh ───────────────────────────────────────
function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    const badge = document.getElementById('refresh-badge');
    if (badge) badge.innerHTML = `<span class="refresh-dot stale"></span> Refreshing…`;
    const cities = await loadAllCities();
    allCities = cities;
    cityContext = cities;
    renderCitiesOnMap(cities);
    renderRankings(cities);
    updateHeroStats(cities);
    if (badge) badge.innerHTML = `<span class="refresh-dot"></span> Live · Updated ${new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}`;
  }, 5 * 60 * 1000); // every 5 min
}
