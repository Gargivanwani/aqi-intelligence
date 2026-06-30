// ===========================
// AirSense India – App Entry
// ===========================

async function init() {
  initMap();

  const cities = await loadAllCities();
  allCities = cities;
  cityContext = cities;

  renderCitiesOnMap(cities);
  renderRankings(cities);
  updateHeroStats(cities);
  animateCounters(cities);
  populateCitySelects(cities);
  renderHealthAdvisories(cities);
  renderNationalSources();
  startAutoRefresh();

  const badge = document.getElementById('refresh-badge');
  if (badge) badge.innerHTML = `<span class="refresh-dot"></span> Live · ${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;
}

function updateHeroStats(cities) {
  const avgAQI = Math.round(cities.reduce((s, c) => s + c.aqi, 0) / cities.length);
  const worstCity = cities.reduce((a, b) => b.aqi > a.aqi ? b : a);
  const bestCity  = cities.reduce((a, b) => b.aqi < a.aqi ? b : a);

  document.getElementById('stat-cities').textContent = `${cities.length} Cities`;
  document.getElementById('stat-avg').textContent = `Avg AQI ${avgAQI}`;
  document.getElementById('stat-avg').style.color = getAQIColor(avgAQI);
  document.getElementById('stat-worst').innerHTML = `<span style="color:${getAQIColor(worstCity.aqi)}">${worstCity.name}</span> most polluted`;
  document.getElementById('stat-best').innerHTML  = `<span style="color:${getAQIColor(bestCity.aqi)}">${bestCity.name}</span> cleanest`;
}

function animateCounters(cities) {
  const critical = cities.filter(c => c.aqi > 200).length;
  animateCount('counter-monitoring', 0, 900, 1200, '');
  animateCount('counter-cities', 0, cities.length, 800, '');
  animateCount('counter-critical', 0, critical, 600, '');
}

function animateCount(id, from, to, duration, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t)) + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

document.addEventListener('DOMContentLoaded', init);

// Navbar shadow on scroll
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
});

// Hide zoom hint after map is clicked
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('map')?.addEventListener('click', () => {
    const hint = document.getElementById('map-zoom-hint');
    if (hint) hint.style.opacity = '0.4';
  });
});
