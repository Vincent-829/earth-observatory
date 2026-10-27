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
succeeded; REST Countries returned HTTP 403. The initial localhost browser preview failed authentication. Follow-up verification
uses the supported managed preview route, as recorded below. Physical-device
acceptance remains pending.

Sources:
- https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- https://eonet.gsfc.nasa.gov/docs/v3
- https://open-meteo.com/en/docs (attribution: Weather data by Open-Meteo.com,
  CC BY 4.0; public API subject to provider non-commercial usage limits)
- https://restcountries.com/
- https://datahelpdesk.worldbank.org/knowledgebase/articles/898590-country-api-queries


## EARTH 7.2 follow-up: satellite cloud product and browser verification

- Added NASA GIBS `MODIS_Terra_Cloud_Fraction_Day`, a dated day-time satellite
  cloud-fraction raster projected onto the existing rotating globe. This is a
  daily composite, **not real-time global imagery or a natural-colour cloud photo**.
  Original false colours and official legend remain unchanged; missing pixels
  remain transparent and must not be interpreted as clear sky.
- Date selection is restricted to UTC yesterday through the previous seven days.
  No automatic nearest-date substitution. HTTP/image/CORS failures clear the
  layer and report failure. Requests time out at 20 seconds; changing dates
  invalidates an in-flight result. Transparency is adjustable from 10–80%.
- Raster projection uses a cached 240-pixel disk (160 on compact screens),
  capped at approximately eight updates per second; it does not intercept input.
- Corrected the observation-panel breakpoint from 729px to the established
  849px and removed stray literal newline text that created page overflow.
- Added an actual final body/html closing boundary. The managed live preview
  server had inserted its reload script into an inline SVG string when no
  closing body existed, corrupting preview execution. The corrected document
  loads all existing and new scripts without that preview-specific error.

Validation: `node --test tests/*.test.mjs`: 28 passing tests. Added UTC date
validation, inverse raster projection, breakpoint/body-boundary and image-error
regressions. Live browser verification confirmed desktop search for Japan,
World Bank country fallback (Tokyo), SGP4 loading of 19 selected satellites,
ISS selection leaving auto-follow off, and NASA 2026-10-26 image load. USGS
returned 30 events and EONET 6 events during that session; these are observations,
not permanent expected counts.

Viewport QA uses same-origin iframes in desktop Chrome: tablet 820×1180 and
phone 393×873, with working layer-menu entry and bounded observation panels.
Phone document measured 393×873 with no overflow; its observation panel was
369px wide and internally scrollable. These checks are **not iPad Safari,
Android touch emulation, Windows OS testing or physical-device acceptance**.

NASA product metadata:
https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_Cloud_Fraction_Day.json
WMS documentation: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
