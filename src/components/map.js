// ===========================
// Map Component (Leaflet)
// ===========================

let map;
let markers = [];

function initMap() {
  map = L.map('map', {
    center: [22.5, 82.0],
    zoom: 5,
    zoomControl: true,
    attributionControl: false,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);
}

function renderCitiesOnMap(cities) {
  // Clear old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  cities.forEach(city => {
    const icon = createMarkerIcon(city.aqi);
    const marker = L.marker([city.lat, city.lng], { icon });

    marker.bindPopup(`
      <div style="min-width:180px;">
        <strong style="font-size:1rem;">${city.name}</strong><br/>
        ${formatAQIBadge(city.aqi)}<br/>
        <small style="color:#8b949e;">PM2.5: ${city.pm25 ?? '--'} µg/m³</small>
      </div>
    `);

    marker.on('click', () => showCityPanel(city));
    marker.addTo(map);
    markers.push(marker);
  });
}

function showCityPanel(city) {
  const panel = document.getElementById('city-panel');
  const content = document.getElementById('city-panel-content');
  content.innerHTML = buildCityPanel(city);
  panel.classList.remove('hidden');
}

function closePanel() {
  document.getElementById('city-panel').classList.add('hidden');
}

// Called from city panel button
function askAboutCity(cityName, aqi) {
  closePanel();
  const input = document.getElementById('chat-input');
  input.value = `What precautions should I take in ${cityName} with AQI ${aqi}?`;
  document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => sendMessage(), 400);
}
