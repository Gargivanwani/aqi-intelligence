# 🌫️ AirSense India – Urban Air Quality Intelligence Platform

> **ET AI Hackathon 2.0 | Problem Statement 5 – AI-Powered Urban Air Quality Intelligence for Smart City Intervention**

---

## 🎯 What It Does

AirSense India is an AI-powered urban air quality intelligence platform that:

- **Live AQI Map** — Shows real-time or simulated AQI for 12 major Indian cities on an interactive map, with color-coded risk markers
- **AI Health Advisory Chatbot** — Powered by Claude AI, answers health questions like *"Is it safe to jog in Delhi today?"* with context-aware, city-specific advice
- **Pollutant Breakdown** — Displays PM2.5, PM10, NO₂, CO readings per city
- **Smart Recommendations** — Clicking any city marker gives instant health guidance and a one-tap "Ask AI" button

---

## 🏗️ Architecture

```
OpenAQ API (free, no key)
        ↓
  openaq.js  →  City AQI data (with mock fallback)
        ↓
  map.js     →  Leaflet.js map + markers
        ↓
  chat.js    →  Claude API (claude-sonnet-4-6)
        ↓
  index.html →  Single-page app
```

---

## 🚀 Getting Started

### Option 1 – Just open in browser (no server needed)
```bash
git clone https://github.com/YOUR_USERNAME/airsense-india
cd airsense-india
# Open index.html in your browser
```
> ⚠️ Note: The Claude API requires a backend proxy in production to hide the API key. For the hackathon demo, it works directly in the browser via the Anthropic API.

### Option 2 – Run with a simple server
```bash
npx serve .
# or
python -m http.server 8000
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS |
| Maps | Leaflet.js + CartoDB dark tiles |
| Air Quality Data | OpenAQ v3 API (free, no key needed) |
| AI Advisory | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | GitHub Pages / Vercel |

---

## 📁 Project Structure

```
airsense-india/
├── index.html              # Main entry point
├── src/
│   ├── style.css           # All styles
│   ├── app.js              # App initialisation
│   ├── api/
│   │   └── openaq.js       # OpenAQ API + mock data
│   ├── utils/
│   │   └── aqiHelper.js    # AQI calculation helpers
│   └── components/
│       ├── map.js          # Leaflet map logic
│       └── chat.js         # Claude AI chat
├── docs/
│   └── architecture.md     # Architecture details
└── README.md
```

---

## 📊 AQI Scale (CPCB Standard)

| AQI Range | Category | Color |
|---|---|---|
| 0–50 | Good | 🟢 Green |
| 51–100 | Satisfactory | 🟡 Yellow-Green |
| 101–200 | Moderate | 🟡 Yellow |
| 201–300 | Poor | 🔴 Red |
| 301–400 | Very Poor | 🟣 Purple |
| 401+ | Severe | ⚫ Dark Red |

---

## 🏆 Hackathon Submission

- **Event:** ET AI Hackathon 2.0 (Economic Times)
- **Problem:** #5 – AI-Powered Urban Air Quality Intelligence
- **Submitted by:** Gargi Vanwani
- **Deadline:** 22 July 2026

---

## 🔮 Future Scope

- 24–72 hour AQI forecasting with atmospheric dispersion models
- Ward-level hyperlocal data via satellite (Sentinel-5P)
- Multi-language advisories (Hindi, Kannada, Tamil, Bengali)
- Push notifications for AQI threshold breaches
- Enforcement heatmap for pollution control authorities
