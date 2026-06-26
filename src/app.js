// ===========================
// AirSense India – App Entry
// ===========================

async function init() {
  // 1. Initialise map
  initMap();

  // 2. Load city data
  const cities = await loadAllCities();

  // 3. Render markers
  renderCitiesOnMap(cities);

  // 4. Share city data with chat module
  cityContext = cities;

  // 5. Update hero stats
  const avgAQI = Math.round(cities.reduce((s, c) => s + c.aqi, 0) / cities.length);
  const worstCity = cities.reduce((a, b) => b.aqi > a.aqi ? b : a);
  const level = getAQILevel(avgAQI);

  document.getElementById('stat-cities').textContent = `${cities.length} Cities`;
  document.getElementById('stat-avg').innerHTML = `Avg AQI ${avgAQI}`;
  document.getElementById('stat-status').textContent = `${worstCity.name} most polluted`;
  document.getElementById('stat-status').style.color = getAQIColor(worstCity.aqi);
}

document.addEventListener('DOMContentLoaded', init);
