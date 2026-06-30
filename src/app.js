// ===========================
// AirSense India – App Entry
// ===========================

async function init() {
  initMap();

  // Show loading state
  document.getElementById('rankings-list').innerHTML =
    '<div style="text-align:center;color:#8b949e;padding:20px;font-size:0.85rem;">Loading city data…</div>';

  const cities = await loadAllCities();
  allCities = cities;
  cityContext = cities;

  renderCitiesOnMap(cities);
  renderRankings(cities);
  updateHeroStats(cities);
  startAutoRefresh();

  // Set initial refresh badge
  const badge = document.getElementById('refresh-badge');
  if (badge) badge.innerHTML = `<span class="refresh-dot"></span> Live · ${new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}`;
}

function updateHeroStats(cities) {
  const avgAQI = Math.round(cities.reduce((s, c) => s + c.aqi, 0) / cities.length);
  const worstCity = cities.reduce((a, b) => b.aqi > a.aqi ? b : a);
  const bestCity  = cities.reduce((a, b) => b.aqi < a.aqi ? b : a);

  document.getElementById('stat-cities').textContent = `${cities.length} Cities`;
  document.getElementById('stat-avg').textContent = `Avg AQI ${avgAQI}`;
  document.getElementById('stat-avg').style.color = getAQIColor(avgAQI);
  document.getElementById('stat-worst').innerHTML =
    `<span style="color:${getAQIColor(worstCity.aqi)}">${worstCity.name}</span> most polluted`;
  document.getElementById('stat-best').innerHTML =
    `<span style="color:${getAQIColor(bestCity.aqi)}">${bestCity.name}</span> cleanest air`;
}

document.addEventListener('DOMContentLoaded', init);
