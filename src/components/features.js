// ===========================
// Features Component
// 24h Forecast, Health Tips, Compare, Pollution Sources
// ===========================

// ── Tab Switching ─────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    const tabs = ['forecast','health','compare','sources'];
    btn.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── Theme Toggle ──────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-btn').textContent = isDark ? '🌙 Dark' : '☀️ Light';
}

// ── Populate City Selects ─────────────────────
function populateCitySelects(cities) {
  const selects = ['forecast-city-select','compare-city-1','compare-city-2','sources-city-select'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const first = el.options[0];
    el.innerHTML = '';
    el.appendChild(first);
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.name} (AQI ${c.aqi})`;
      el.appendChild(opt);
    });
  });
}

// ── 24h Forecast ──────────────────────────────
function updateForecast(cityName) {
  const wrap = document.getElementById('forecast-chart-wrap');
  if (!cityName) { wrap.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;">Select a city to see forecast</div>'; return; }

  const city = allCities.find(c => c.name === cityName);
  if (!city) return;

  // Generate 24-hour forecast from current AQI
  const hours = [];
  let val = city.aqi;
  for (let h = 0; h < 24; h++) {
    // Simulate daily pattern: worse in morning (8-10am) and evening (6-9pm)
    const hour = (new Date().getHours() + h) % 24;
    const pattern = hour >= 7 && hour <= 10 ? 1.15 :
                    hour >= 18 && hour <= 21 ? 1.2  :
                    hour >= 0  && hour <= 5  ? 0.85 : 1.0;
    val = Math.max(20, Math.min(500, city.aqi * pattern * (0.92 + Math.random() * 0.16)));
    hours.push({ hour, aqi: Math.round(val) });
  }

  const maxAqi = Math.max(...hours.map(h => h.aqi));
  const minAqi = Math.min(...hours.map(h => h.aqi));

  wrap.innerHTML = `
    <div style="margin-bottom:10px;display:flex;gap:16px;flex-wrap:wrap;">
      <span style="font-size:0.8rem;color:var(--text-secondary);">Current: <strong style="color:${getAQIColor(city.aqi)}">${city.aqi}</strong></span>
      <span style="font-size:0.8rem;color:var(--text-secondary);">Peak: <strong style="color:${getAQIColor(maxAqi)}">${maxAqi}</strong></span>
      <span style="font-size:0.8rem;color:var(--text-secondary);">Best: <strong style="color:${getAQIColor(minAqi)}">${minAqi}</strong></span>
    </div>
    <div style="overflow-x:auto;">
      <svg width="100%" height="160" viewBox="0 0 600 160" preserveAspectRatio="none" style="min-width:400px;">
        <defs>
          <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${getAQIColor(city.aqi)}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${getAQIColor(city.aqi)}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${buildForecastSVG(hours, 600, 140)}
      </svg>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.7rem;color:var(--text-secondary);">
      ${hours.filter((_,i) => i % 4 === 0).map(h => `<span>${h.hour}:00</span>`).join('')}
    </div>
    <div style="margin-top:16px;padding:12px;background:var(--accent-glow);border-radius:8px;font-size:0.82rem;color:var(--text-primary);">
      ⏰ <strong>Best time to go outside:</strong> ${getBestHour(hours)}
    </div>
  `;
}

function buildForecastSVG(hours, w, h) {
  const pad = 8;
  const aqis = hours.map(x => x.aqi);
  const min = Math.min(...aqis) * 0.9, max = Math.max(...aqis) * 1.1;
  const pts = hours.map((x, i) => {
    const px = pad + (i / (hours.length - 1)) * (w - pad * 2);
    const py = h - pad - ((x.aqi - min) / (max - min)) * (h - pad * 2);
    return `${px},${py}`;
  });
  const line = pts.join(' ');
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  const color = getAQIColor(hours[0].aqi);
  return `
    <polygon points="${area}" fill="url(#fGrad)"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${hours.filter((_,i) => i % 6 === 0).map((x, _, __, i2 = hours.indexOf(x)) => {
      const px = pad + (i2 / (hours.length - 1)) * (w - pad * 2);
      const py = h - pad - ((x.aqi - min) / (max - min)) * (h - pad * 2);
      return `<circle cx="${px}" cy="${py}" r="3" fill="${getAQIColor(x.aqi)}" stroke="var(--bg-card)" stroke-width="1.5"/>`;
    }).join('')}
  `;
}

function getBestHour(hours) {
  const best = hours.reduce((a, b) => b.aqi < a.aqi ? b : a);
  return `${best.hour}:00 – ${best.hour + 1}:00 (AQI ${best.aqi} · ${getAQILabel(best.aqi)})`;
}

// ── Health Advisory by Group ──────────────────
function renderHealthAdvisories(cities) {
  const avgAqi = Math.round(cities.reduce((s, c) => s + c.aqi, 0) / cities.length);
  const worstCity = cities.reduce((a, b) => b.aqi > a.aqi ? b : a);

  const groups = {
    children: {
      icon: '👶', threshold: 100,
      tips: [
        { max: 50,  tip: 'Safe for all outdoor activities including sports.' },
        { max: 100, tip: 'Generally safe. Limit intense exercise to 60 min.' },
        { max: 200, tip: 'Reduce outdoor playtime. Keep windows closed during peak hours.' },
        { max: 300, tip: 'Avoid outdoor activities. Wear N95 masks if going out.' },
        { max: Infinity, tip: '🚨 Keep indoors. Use air purifier. Consult doctor if breathing issues.' },
      ]
    },
    elderly: {
      icon: '👴', threshold: 100,
      tips: [
        { max: 50,  tip: 'Enjoy outdoor activities freely.' },
        { max: 100, tip: 'Safe for light walks. Avoid areas with heavy traffic.' },
        { max: 200, tip: 'Limit outdoor time to 30 min. Carry inhaler if prescribed.' },
        { max: 300, tip: 'Stay indoors. Keep medications accessible.' },
        { max: Infinity, tip: '🚨 Do not go outdoors. Seek medical attention for any symptoms.' },
      ]
    },
    asthma: {
      icon: '🫁', threshold: 50,
      tips: [
        { max: 50,  tip: 'Low risk. Carry rescue inhaler as precaution.' },
        { max: 100, tip: 'Moderate risk. Avoid triggers like dust and smoke.' },
        { max: 200, tip: 'High risk. Use preventive inhaler. Avoid outdoor exertion.' },
        { max: 300, tip: 'Very high risk. Stay indoors with air purifier running.' },
        { max: Infinity, tip: '🚨 Extreme risk. Consult doctor immediately. Do not go outside.' },
      ]
    },
    outdoor: {
      icon: '🏃', threshold: 150,
      tips: [
        { max: 50,  tip: 'Safe to work outdoors all day.' },
        { max: 100, tip: 'Take breaks in shaded/indoor areas every 2 hours.' },
        { max: 200, tip: 'Wear N95 mask. Limit continuous outdoor exposure to 4 hours.' },
        { max: 300, tip: 'Wear N95 + face shield. Take 30-min indoor breaks every hour.' },
        { max: Infinity, tip: '🚨 Demand PPE from employer. Consider indoor work. Health emergency.' },
      ]
    },
  };

  Object.entries(groups).forEach(([key, group]) => {
    const el = document.getElementById(`health-${key}`);
    if (!el) return;
    const tip = group.tips.find(t => avgAqi <= t.max);
    const level = getAQILevel(avgAqi);
    el.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">Based on national avg AQI</div>
        ${formatAQIBadge(avgAqi)}
      </div>
      <div style="background:${level.bg};border:1px solid ${level.color}33;border-radius:8px;padding:12px;font-size:0.83rem;color:var(--text-primary);line-height:1.6;margin-bottom:12px;">
        ${tip.tip}
      </div>
      <div style="font-size:0.75rem;color:var(--text-secondary);">
        ⚠️ Worst city right now: <strong style="color:${getAQIColor(worstCity.aqi)}">${worstCity.name} (${worstCity.aqi})</strong>
      </div>
    `;
  });
}

// ── City Compare ──────────────────────────────
function updateCompare() {
  const n1 = document.getElementById('compare-city-1').value;
  const n2 = document.getElementById('compare-city-2').value;
  const result = document.getElementById('compare-result');
  if (!n1 || !n2) return;
  if (n1 === n2) { result.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:20px;">Please select two different cities.</div>'; return; }

  const c1 = allCities.find(c => c.name === n1);
  const c2 = allCities.find(c => c.name === n2);
  if (!c1 || !c2) return;

  result.innerHTML = [c1, c2].map(c => {
    const level = getAQILevel(c.aqi);
    return `<div class="compare-city-card fade-in">
      <div style="font-weight:800;font-size:1rem;margin-bottom:8px;">${c.name}</div>
      ${formatAQIBadge(c.aqi)}
      <div style="margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${c.pm25 != null ? `<div style="font-size:0.78rem;"><span style="color:var(--text-secondary)">PM2.5</span><br/><strong>${c.pm25}</strong> µg/m³</div>` : ''}
        ${c.pm10 != null ? `<div style="font-size:0.78rem;"><span style="color:var(--text-secondary)">PM10</span><br/><strong>${c.pm10}</strong> µg/m³</div>` : ''}
        ${c.no2  != null ? `<div style="font-size:0.78rem;"><span style="color:var(--text-secondary)">NO₂</span><br/><strong>${c.no2}</strong> µg/m³</div>` : ''}
        ${c.co   != null ? `<div style="font-size:0.78rem;"><span style="color:var(--text-secondary)">CO</span><br/><strong>${c.co}</strong> mg/m³</div>` : ''}
      </div>
      <div style="font-size:0.78rem;background:${level.bg};border-radius:6px;padding:8px;color:var(--text-primary);line-height:1.5;">${level.advice}</div>
    </div>`;
  }).join('') + `
    <div style="grid-column:1/-1;padding:12px;background:var(--accent-glow);border-radius:8px;font-size:0.83rem;text-align:center;">
      ${c1.aqi < c2.aqi
        ? `✅ <strong>${c1.name}</strong> has <strong>${c2.aqi - c1.aqi} better AQI</strong> than ${c2.name}`
        : c2.aqi < c1.aqi
        ? `✅ <strong>${c2.name}</strong> has <strong>${c1.aqi - c2.aqi} better AQI</strong> than ${c1.name}`
        : `Both cities have the same AQI today.`}
    </div>`;
}

// ── Pollution Sources ─────────────────────────
const SOURCE_DATA = {
  'Delhi':     { vehicle: 40, industry: 20, construction: 18, burning: 14, other: 8 },
  'Mumbai':    { vehicle: 45, industry: 22, construction: 15, burning: 10, other: 8 },
  'Kolkata':   { vehicle: 35, industry: 28, construction: 14, burning: 15, other: 8 },
  'Bengaluru': { vehicle: 50, industry: 18, construction: 16, burning:  8, other: 8 },
  'Chennai':   { vehicle: 42, industry: 25, construction: 14, burning: 11, other: 8 },
  'Hyderabad': { vehicle: 38, industry: 26, construction: 16, burning: 12, other: 8 },
  'Pune':      { vehicle: 44, industry: 22, construction: 15, burning: 11, other: 8 },
  'Ahmedabad': { vehicle: 36, industry: 30, construction: 14, burning: 12, other: 8 },
  'Lucknow':   { vehicle: 33, industry: 22, construction: 16, burning: 22, other: 7 },
  'Patna':     { vehicle: 30, industry: 20, construction: 14, burning: 28, other: 8 },
  'Jaipur':    { vehicle: 38, industry: 24, construction: 18, burning: 12, other: 8 },
  'Surat':     { vehicle: 35, industry: 32, construction: 14, burning: 11, other: 8 },
  'Nagpur':    { vehicle: 37, industry: 28, construction: 15, burning: 12, other: 8 },
  'Kanpur':    { vehicle: 32, industry: 24, construction: 14, burning: 22, other: 8 },
  'Bhopal':    { vehicle: 40, industry: 22, construction: 18, burning: 12, other: 8 },
};

const SOURCE_COLORS = {
  vehicle: '#f85149', industry: '#f0b429',
  construction: '#8957e5', burning: '#ff7b00', other: '#58a6ff'
};
const SOURCE_LABELS = {
  vehicle: '🚗 Vehicles', industry: '🏭 Industry',
  construction: '🏗️ Construction', burning: '🔥 Open Burning', other: '💨 Other'
};

function updateSources(cityName) {
  const el = document.getElementById('sources-chart');
  if (!cityName) { el.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:30px;">Select a city</div>'; return; }
  const data = SOURCE_DATA[cityName] || SOURCE_DATA['Delhi'];
  el.innerHTML = buildSourceBars(data);
}

function buildSourceBars(data) {
  return Object.entries(data).map(([key, pct]) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px;">
        <span>${SOURCE_LABELS[key]}</span>
        <span style="font-weight:700;color:${SOURCE_COLORS[key]}">${pct}%</span>
      </div>
      <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${SOURCE_COLORS[key]};border-radius:4px;transition:width 0.6s;"></div>
      </div>
    </div>`).join('');
}

function renderNationalSources() {
  const natl = { vehicle: 39, industry: 24, construction: 15, burning: 14, other: 8 };
  document.getElementById('national-sources').innerHTML = `
    <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px;">Average across all 15 monitored cities</p>
    ${buildSourceBars(natl)}
  `;
}
