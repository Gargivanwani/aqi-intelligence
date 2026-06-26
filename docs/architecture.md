# AirSense India – Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Live AQI    │    │  AI Health   │    │  City Detail │  │
│  │  Map         │    │  Chatbot     │    │  Panel       │  │
│  │  (Leaflet)   │    │  (Claude AI) │    │  (Popup)     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘  │
│         │                   │                               │
│  ┌──────▼───────────────────▼───────────────────────────┐  │
│  │                    app.js (Orchestrator)              │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   ┌──────────────────┐             ┌──────────────────┐
   │   OpenAQ v3 API  │             │  Anthropic API   │
   │  (Air Quality    │             │  claude-sonnet   │
   │   Data, Free)    │             │  (Health AI)     │
   └──────────────────┘             └──────────────────┘
```

## Data Flow

1. On page load, `app.js` calls `loadAllCities()` from `openaq.js`
2. `openaq.js` makes parallel API calls to OpenAQ for 12 Indian cities
3. If API fails or returns no data, realistic mock data is used (with jitter)
4. AQI is computed from PM2.5 using CPCB formula in `aqiHelper.js`
5. Cities are rendered as colored circular markers on the Leaflet map
6. When user clicks a city, a detail panel shows pollutants + health advice
7. "Ask AI" button pre-fills the chat with a city-specific question
8. Chat sends user message + current city AQI snapshot to Claude API
9. Claude responds with context-aware health advisory

## Key Design Decisions

- **No backend required** — pure client-side for hackathon simplicity
- **Mock fallback** — ensures demo always works regardless of API status
- **Context injection** — all 12 city AQI readings are injected into Claude's system prompt so it gives accurate, live-aware answers
- **CPCB AQI formula** — uses India's official PM2.5 breakpoints, not US EPA
