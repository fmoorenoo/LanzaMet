import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { handle } from './api.ts';
import { forgetAll } from './edge-cache.ts';
import { OPEN_METEO_SERVICES, openMeteoUrl } from './open-meteo.ts';

// The forecast query exactly as OpenMeteoClient writes it (8 places, 4 decimals).
const LATITUDES = '28.9210,28.9625,28.8628,29.0005,29.1155,29.1117,29.2228,28.9822';
const LONGITUDES = '-13.6680,-13.5477,-13.8296,-13.4905,-13.5565,-13.6545,-13.4497,-13.8314';
const FORECAST_QUERY = [
  `latitude=${encodeURIComponent(LATITUDES)}`,
  `longitude=${encodeURIComponent(LONGITUDES)}`,
  `current=${encodeURIComponent('temperature_2m,is_day,weather_code')}`,
  `hourly=${encodeURIComponent('temperature_2m,weather_code')}`,
  `daily=${encodeURIComponent('sunrise,sunset')}`,
  'timezone=Atlantic%2FCanary',
  'timeformat=unixtime',
  'forecast_days=7',
].join('&');

const forecast = OPEN_METEO_SERVICES['forecast'];
const accepts = (query: string) => openMeteoUrl(forecast, new URLSearchParams(query));
const get = (path: string) => handle(new Request(`http://localhost/api/open-meteo/${path}`), {});

describe('Open-Meteo queries', () => {
  it("accepts the web's own query and asks Open-Meteo for exactly that URL", () => {
    assert.equal(
      accepts(FORECAST_QUERY),
      `https://api.open-meteo.com/v1/forecast?${FORECAST_QUERY}`,
    );
  });

  it('refuses anything the web does not ask', () => {
    const swap = (from: string, to: string) => accepts(FORECAST_QUERY.replace(from, to));
    // Somewhere else in the world.
    assert.equal(swap('28.9210', '40.4168'), null);
    // A parameter the web never sends, a repeated one, another time zone.
    assert.equal(accepts(`${FORECAST_QUERY}&apikey=x`), null);
    assert.equal(accepts(`${FORECAST_QUERY}&forecast_days=7`), null);
    assert.equal(swap('Atlantic%2FCanary', 'Europe%2FMadrid'), null);
    // More days than the free tier counts as one call, or malformed coordinates.
    assert.equal(swap('forecast_days=7', 'forecast_days=16'), null);
    assert.equal(swap('28.9210', '28.92101'), null);
    // As many latitudes as longitudes.
    assert.equal(swap(`${encodeURIComponent(',28.9822')}&`, '&'), null);
  });
});

describe('Open-Meteo through the API', () => {
  beforeEach(() => forgetAll());
  afterEach(() => mock.restoreAll());

  it('shares one Open-Meteo answer between visitors, unchanged', async () => {
    const answer = JSON.stringify([{ latitude: 28.92 }]);
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(answer));
    const first = await get(`forecast?${FORECAST_QUERY}`);
    assert.equal(first.status, 200);
    assert.equal(await first.text(), answer);
    assert.equal(first.headers.get('x-stale'), 'false');
    assert.ok(first.headers.get('x-upstream-fetched-at'));

    await get(`forecast?${FORECAST_QUERY}`);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(
      String(fetchMock.mock.calls[0].arguments[0]),
      `https://api.open-meteo.com/v1/forecast?${FORECAST_QUERY}`,
    );
  });

  it('keeps serving the last copy, marked stale, while Open-Meteo is down', async () => {
    let down = false;
    mock.method(globalThis, 'fetch', async () =>
      down ? new Response('busy', { status: 429 }) : new Response('[]'),
    );
    await get(`forecast?${FORECAST_QUERY}`);
    down = true;
    const later = Date.now() + 15 * 60_000;
    mock.method(Date, 'now', () => later);
    const response = await get(`forecast?${FORECAST_QUERY}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-stale'), 'true');
  });

  it('answers 502 when Open-Meteo fails and nothing is kept, so the web asks it directly', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('busy', { status: 503 }));
    assert.equal((await get(`forecast?${FORECAST_QUERY}`)).status, 502);
  });

  it('answers 404 to other services and other queries, without asking anyone', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('[]'));
    assert.equal((await get(`archive?${FORECAST_QUERY}`)).status, 404);
    assert.equal((await get('forecast?latitude=40&longitude=-3')).status, 404);
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
