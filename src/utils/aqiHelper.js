// ===========================
// AQI Helper Utilities
// ===========================

const AQI_LEVELS = [
  { max: 50,  label: 'Good',         color: '#2ea043', bg: 'rgba(46,160,67,0.15)',   advice: 'Air quality is great. No restrictions on outdoor activity.' },
  { max: 100, label: 'Satisfactory', color: '#a8d700', bg: 'rgba(168,215,0,0.15)',  advice: 'Air is acceptable. Unusually sensitive individuals should consider reducing prolonged outdoor exertion.' },
  { max: 200, label: 'Moderate',     color: '#f0b429', bg: 'rgba(240,180,41,0.15)', advice: 'Sensitive groups (children, elderly, asthma patients) may experience health effects. Limit long outdoor exertion.' },
  { max: 300, label: 'Poor',         color: '#f85149', bg: 'rgba(248,81,73,0.15)',  advice: 'Health effects possible for everyone. Avoid prolonged outdoor exertion. Wear N95 mask outdoors.' },
  { max: 400, label: 'Very Poor',    color: '#8957e5', bg: 'rgba(137,87,229,0.15)', advice: 'Health alert! Everyone may experience serious health effects. Stay indoors. Use air purifiers if available.' },
  { max: Infinity, label: 'Severe',  color: '#6e040d', bg: 'rgba(110,4,13,0.15)',   advice: 'Emergency conditions. Avoid all outdoor activity. Keep windows and doors closed. Seek medical attention if symptomatic.' },
];

function getAQILevel(aqi) {
  return AQI_LEVELS.find(level => aqi <= level.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

function getAQIColor(aqi) {
  return getAQILevel(aqi).color;
}

function getAQILabel(aqi) {
  return getAQILevel(aqi).label;
}

function getAQIAdvice(aqi) {
  return getAQILevel(aqi).advice;
}

function formatAQIBadge(aqi) {
  const level = getAQILevel(aqi);
  return `<span class="aqi-badge" style="background:${level.color}">${aqi} – ${level.label}</span>`;
}

// Creates a colored circle marker for Leaflet
function createMarkerIcon(aqi) {
  const color = getAQIColor(aqi);
  const size = aqi > 300 ? 36 : aqi > 200 ? 30 : 24;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${color};
      border-radius:50%;
      border:2px solid rgba(255,255,255,0.6);
      display:flex; align-items:center; justify-content:center;
      font-size:${size > 30 ? '11' : '9'}px;
      font-weight:700; color:#fff;
      box-shadow:0 0 12px ${color}88;
    ">${aqi}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// City panel HTML
function buildCityPanel(city) {
  const level = getAQILevel(city.aqi);
  return `
    <div style="border-left:4px solid ${level.color}; padding-left:12px; margin-bottom:16px;">
      <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:4px;">${city.name}</h3>
      <div>${formatAQIBadge(city.aqi)}</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
      ${city.pm25 ? `<div class="mini-stat"><div class="mini-label">PM2.5</div><div class="mini-val">${city.pm25} µg/m³</div></div>` : ''}
      ${city.pm10 ? `<div class="mini-stat"><div class="mini-label">PM10</div><div class="mini-val">${city.pm10} µg/m³</div></div>` : ''}
      ${city.no2  ? `<div class="mini-stat"><div class="mini-label">NO₂</div><div class="mini-val">${city.no2} µg/m³</div></div>` : ''}
      ${city.co   ? `<div class="mini-stat"><div class="mini-label">CO</div><div class="mini-val">${city.co} µg/m³</div></div>` : ''}
    </div>
    <div style="background:${level.bg}; border:1px solid ${level.color}44; border-radius:8px; padding:12px; font-size:0.83rem; color:#e6edf3; line-height:1.5;">
      ⚠️ ${level.advice}
    </div>
    <button onclick="askAboutCity('${city.name}', ${city.aqi})" style="
      margin-top:14px; width:100%; background:#58a6ff; color:#0d1117;
      border:none; border-radius:8px; padding:10px; font-weight:700;
      cursor:pointer; font-size:0.88rem;
    ">Ask AI about ${city.name}</button>
  `;
}

// Extra mini-stat CSS injected once
const miniStatCSS = `
  .mini-stat { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:10px 12px; }
  .mini-label { font-size:0.72rem; color:#8b949e; margin-bottom:2px; }
  .mini-val { font-size:0.95rem; font-weight:700; color:#e6edf3; }
`;
const styleEl = document.createElement('style');
styleEl.textContent = miniStatCSS;
document.head.appendChild(styleEl);
