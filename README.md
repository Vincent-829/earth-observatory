# earth-observatory
earth-observatory

## EARTH 7.2

Preserves the accepted 7.1 desktop layout and existing satellite, country,
search, travel and day/night features. Open **資料與分享 → 全球觀測圖層**
(desktop), or **圖層 → 全球觀測圖層** (compact screens).

### Inventory and changes

- Existing: 177 embedded geographic features and flag assets; country culture,
  attractions, journal, visits, photos, backup, search and travel statistics;
  CelesTrak OMM/TLE, SGP4 orbit rendering, satellite selection/follow,
  future orbit prediction, pass forecasts, illustrative models and day/night.
- Added: USGS M2.5+ past-day earthquakes; NASA EONET open storm/volcano
  events, latest dated positions and recent storm tracks. EONET storms are
  not all typhoons, and its volcano catalogue is not an authoritative alert list.
- Added: selected satellite surface track ±45 minutes, and spherical Earth
  geometric visibility boundary at 10° minimum elevation. This is **not** a
  sensor footprint/swath. Reuses existing satellite.js and selection events.
- Added: 72 Open-Meteo current model samples, at 30° spacing, latitude
  -75° to +75° and longitude -180° to +150°. Temperature and cloud-cover
  point layers are sparse global overviews, **not satellite cloud imagery**.
- Added: on-demand country capital, region, language, currency and timezone
  references from REST Countries. World Bank Country API provides capital,
  region and income-classification fallback. Country reference years are
  unknown; retrieval time is never presented as the statistical reference year.
  Missing country/territory mappings remain explicitly unavailable.

### Data timing and failure behavior

- USGS event: within 24 hours; feed generation: within 30 minutes.
- EONET event/position: within 48 hours; request retrieves open events in the
  last 30 days. Older events remain marked stale in the list, not on the globe.
- Weather: valid model time within two hours. Stale samples are hidden.
- Invalid/missing/future timestamps beyond five minutes are not labelled recent.
- Event refresh every five minutes and weather every 30 minutes while a relevant
  layer is enabled and the page is visible. Each request times out after 15 s.
- Failures clear affected layer data and show a source-specific error. No invented
  fallback events or weather. Sources and retrieval/event/model times are shown.
- Orbit parameters older than seven days are marked stale; geometry remains an
  explicitly identified model estimate, not live telemetry.

### Validation

Run `node --test tests/*.test.mjs` (no dependencies).
Existing 12 structural regression checks are retained; new tests cover timestamps,
source parsing, invalid/zero/null values, projection, polar/dateline geometry,
script syntax and mocked DOM/request integration, including country fallback.
The mocked DOM tests do not replace real browser or physical-device testing.

During implementation USGS, EONET, Open-Meteo and World Bank HTTP requests
succeeded; REST Countries returned HTTP 403. Browser preview returned
`Missing or invalid bearer token`, so Windows/iPad Air 5/OPPO Reno8 visual and
physical-device acceptance remains pending. Responsive CSS and touch targets
are provided, but device compatibility is not claimed as fully verified.

Sources:
- https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- https://eonet.gsfc.nasa.gov/docs/v3
- https://open-meteo.com/en/docs (attribution: Weather data by Open-Meteo.com,
  CC BY 4.0; public API subject to provider non-commercial usage limits)
- https://restcountries.com/
- https://datahelpdesk.worldbank.org/knowledgebase/articles/898590-country-api-queries
