// ===========================
// OpenAQ API Integration
// ===========================

const OPENAQ_BASE = 'https://api.openaq.io/v3';

const INDIAN_CITIES = [
  { name: 'Delhi',      lat: 28.6139, lng: 77.2090, locationId: 8118, state: 'Delhi' },
  { name: 'Mumbai',     lat: 19.0760, lng: 72.8777, locationId: 8119, state: 'Maharashtra' },
  { name: 'Kolkata',    lat: 22.5726, lng: 88.3639, locationId: 8120, state: 'West Bengal' },
  { name: 'Bengaluru',  lat: 12.9716, lng: 77.5946, locationId: 8121, state: 'Karnataka' },
  { name: 'Chennai',    lat: 13.0827, lng: 80.2707, locationId: 8122, state: 'Tamil Nadu' },
  { name: 'Hyderabad',  lat: 17.3850, lng: 78.4867, locationId: 8123, state: 'Telangana' },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567, locationId: 8124, state: 'Maharashtra' },
  { name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714, locationId: 8125, state: 'Gujarat' },
  { name: 'Lucknow',    lat: 26.8467, lng: 80.9462, locationId: 8126, state: 'Uttar Pradesh' },
  { name: 'Patna',      lat: 25.5941, lng: 85.1376, locationId: 8127, state: 'Bihar' },
  { name: 'Jaipur',     lat: 26.9124, lng: 75.7873, locationId: 8128, state: 'Rajasthan' },
  { name: 'Surat',      lat: 21.1702, lng: 72.8311, locationId: 8129, state: 'Gujarat' },
  { name: 'Nagpur',     lat: 21.1458, lng: 79.0882, locationId: 8130, state: 'Maharashtra' },
  { name: 'Kanpur',     lat: 26.4499, lng: 80.3319, locationId: 8131, state: 'Uttar Pradesh' },
  { name: 'Bhopal',     lat: 23.2599, lng: 77.4126, locationId: 8132, state: 'Madhya Pradesh' },
];

const MOCK_AQI_DATA = {
  'Delhi':     { aqi: 218, pm25: 145, pm10: 210, no2: 88,  co: 1.2 },
  'Mumbai':    { aqi: 142, pm25: 72,  pm10: 118, no2: 54,  co: 0.8 },
  'Kolkata':   { aqi: 168, pm25: 95,  pm10: 155, no2: 62,  co: 1.0 },
  'Bengaluru': { aqi: 98,  pm25: 38,  pm10: 78,  no2: 42,  co: 0.5 },
  'Chennai':   { aqi: 112, pm25: 48,  pm10: 95,  no2: 38,  co: 0.6 },
  'Hyderabad': { aqi: 125, pm25: 55,  pm10: 102, no2: 44,  co: 0.7 },
  'Pune':      { aqi: 108, pm25: 45,  pm10: 88,  no2: 40,  co: 0.6 },
  'Ahmedabad': { aqi: 155, pm25: 82,  pm10: 135, no2: 58,  co: 0.9 },
  'Lucknow':   { aqi: 195, pm25: 118, pm10: 185, no2: 72,  co: 1.1 },
  'Patna':     { aqi: 245, pm25: 162, pm10: 228, no2: 95,  co: 1.4 },
  'Jaipur':    { aqi: 138, pm25: 65,  pm10: 122, no2: 50,  co: 0.75 },
  'Surat':     { aqi: 132, pm25: 60,  pm10: 110, no2: 48,  co: 0.7 },
  'Nagpur':    { aqi: 148, pm25: 78,  pm10: 130, no2: 52,  co: 0.85 },
  'Kanpur':    { aqi: 228, pm25: 152, pm10: 218, no2: 90,  co: 1.3 },
  'Bhopal':    { aqi: 118, pm25: 52,  pm10: 98,  no2: 42,  co: 0.65 },
};

// Generate a 7-day simulated trend (values leading up to today)
function generateTrend(baseAqi) {
  const trend = [];
  let val = baseAqi * (0.85 + Math.random() * 0.3);
  for (let i = 6; i >= 0; i--) {
    val = Math.max(20, Math.min(500, val + (Math.random() - 0.48) * 20));
    trend.push(Math.round(val));
  }
  trend.push(baseAqi); // today
  return trend;
}

function addJitter(val, pct = 0.05) {
  return Math.round(val * (1 + (Math.random() - 0.5) * pct));
}

function getMockData(cityName) {
  const base = MOCK_AQI_DATA[cityName];
  if (!base) return null;
  const aqi = addJitter(base.aqi, 0.06);
  return {
    aqi,
    pm25: addJitter(base.pm25, 0.06),
    pm10: addJitter(base.pm10, 0.06),
    no2:  addJitter(base.no2,  0.06),
    co:   parseFloat((base.co * (1 + (Math.random()-0.5)*0.06)).toFixed(2)),
    trend: generateTrend(aqi),
    source: 'simulated',
    updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

async function fetchCityAQI(city) {
  try {
    const res = await fetch(
      `${OPENAQ_BASE}/locations/${city.locationId}/latest?limit=10`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error('No data');

    let pm25, pm10, no2, co;
    data.results.forEach(r => {
      if (r.parameter === 'pm25') pm25 = r.value;
      if (r.parameter === 'pm10') pm10 = r.value;
      if (r.parameter === 'no2')  no2  = r.value;
      if (r.parameter === 'co')   co   = r.value;
    });

    const aqi = pm25 ? computeAQIFromPM25(pm25) : null;
    if (!aqi) throw new Error('No PM2.5');

    return {
      aqi, pm25: Math.round(pm25),
      pm10: pm10 ? Math.round(pm10) : null,
      no2: no2 ? Math.round(no2) : null,
      co,
      trend: generateTrend(aqi),
      source: 'live',
      updatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return getMockData(city.name);
  }
}

function computeAQIFromPM25(pm25) {
  const breakpoints = [
    [0, 30,   0,   50 ],
    [30, 60,  51,  100],
    [60, 90,  101, 200],
    [90, 120, 201, 300],
    [120, 250, 301, 400],
    [250, 500, 401, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return Math.min(500, Math.round(pm25 * 2));
}

async function loadAllCities() {
  const results = await Promise.all(
    INDIAN_CITIES.map(async city => {
      const data = await fetchCityAQI(city);
      return { ...city, ...data };
    })
  );
  return results.filter(c => c.aqi != null);
}
