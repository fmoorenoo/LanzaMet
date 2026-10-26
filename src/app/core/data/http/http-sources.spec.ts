import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { DataRefreshStore } from '../../state/data-refresh.store';
import {
  DataSourceError,
  MarineSource,
  ObservationSource,
  WarningSource,
  WeatherSource,
} from '../data-sources';
import { LOCATIONS } from '../locations';
import dustFixture from './fixtures/dust-arrecife.json';
import forecastFixture from './fixtures/forecast-arrecife.json';
import marineFixture from './fixtures/marine-arrecife.json';
import { provideHttpDataSources } from './provide-http-data-sources';

const NOW = new Date(forecastFixture.current.time * 1000);

function setUp(proxyUrl: string | null = '/api') {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideHttpDataSources({ proxyUrl }), provideHttpClientTesting()],
  });
  return TestBed.inject(HttpTestingController);
}

/** The same real response repeated for every place of the island. */
const forEveryPlace = <T>(item: T) => LOCATIONS.map(() => item);

describe('Open-Meteo sources', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    // The app's clock reads the time once it is created: fix it first.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    // Straight to Open-Meteo, as on a host without the app's API (the shared copy is below).
    http = setUp(null);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('serves the whole island with one forecast request', async () => {
    const weather = TestBed.inject(WeatherSource);
    const all = firstValueFrom(forkJoin(LOCATIONS.map((l) => weather.forecast(l.id))));

    const forecast = http.expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'));
    const dust = http.expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'));
    expect(forecast.request.url).toContain('timezone=Atlantic%2FCanary');
    expect(forecast.request.url).toContain('timeformat=unixtime');
    expect(forecast.request.url.split('latitude=')[1].split('&')[0].split('%2C').length).toBe(
      LOCATIONS.length,
    );
    forecast.flush(forEveryPlace(forecastFixture));
    dust.flush(forEveryPlace(dustFixture));

    const forecasts = await all;
    expect(forecasts.map((f) => f.locationId)).toEqual(LOCATIONS.map((l) => l.id));
  });

  it('reuses a fresh response instead of asking again', async () => {
    const weather = TestBed.inject(WeatherSource);
    const first = firstValueFrom(weather.forecast('famara'));
    http
      .expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'))
      .flush(forEveryPlace(forecastFixture));
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'))
      .flush(forEveryPlace(dustFixture));
    await first;

    vi.setSystemTime(new Date(NOW.getTime() + 10 * 60_000));
    await firstValueFrom(weather.forecast('arrecife'));
    http.expectNone((r) => r.url.startsWith('https://api.open-meteo.com/'));
  });

  it('asks again on "Actualizar" once the copy is over a minute old', async () => {
    const weather = TestBed.inject(WeatherSource);
    const first = firstValueFrom(weather.forecast('famara'));
    http
      .expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'))
      .flush(forEveryPlace(forecastFixture));
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'))
      .flush(forEveryPlace(dustFixture));
    await first;

    vi.setSystemTime(new Date(NOW.getTime() + 5 * 60_000));
    TestBed.inject(DataRefreshStore).refresh();
    const again = firstValueFrom(weather.forecast('famara'));
    http
      .expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'))
      .flush(forEveryPlace(forecastFixture));
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'))
      .flush(forEveryPlace(dustFixture));
    await again;
  });

  it('keeps the forecast when only the dust service fails', async () => {
    const weather = TestBed.inject(WeatherSource);
    const result = firstValueFrom(weather.forecast('arrecife'));
    http
      .expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'))
      .flush(forEveryPlace(forecastFixture));
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'))
      .flush({ error: true, reason: 'down' }, { status: 400, statusText: 'Bad Request' });
    expect((await result).hourly.length).toBeGreaterThan(24 * 6);
  });

  it('turns a provider failure into a message a visitor can read', async () => {
    const weather = TestBed.inject(WeatherSource);
    const result = firstValueFrom(weather.forecast('arrecife'));
    http
      .expectOne((r) => r.url.startsWith('https://api.open-meteo.com/'))
      .flush({ error: true, reason: 'Parameter invalid' }, { status: 400, statusText: 'Bad' });
    http
      .expectOne((r) => r.url.startsWith('https://air-quality-api.open-meteo.com/'))
      .flush(forEveryPlace(dustFixture));
    await expect(result).rejects.toBeInstanceOf(DataSourceError);
  });

  it('asks the sea once per distinct sea point and shares it with the tide', async () => {
    const marine = TestBed.inject(MarineSource);
    const both = firstValueFrom(
      forkJoin([marine.sea('famara'), marine.sea('el-golfo'), marine.tides('arrecife')]),
    );
    const request = http.expectOne((r) => r.url.startsWith('https://marine-api.open-meteo.com/'));
    const points = request.request.url.split('latitude=')[1].split('&')[0].split('%2C');
    const distinct = new Set(LOCATIONS.map((l) => JSON.stringify(l.coverage.sea))).size;
    expect(points.length).toBe(distinct);
    expect(request.request.url).toContain('past_days=1');
    request.flush(points.map(() => marineFixture));

    const [famara, golfo, tide] = await both;
    // Every place reads its own open-water cell, from that single response.
    expect(famara?.point).toBeDefined();
    expect(golfo?.point).toBeDefined();
    expect(tide?.source.official).toBe(false);
  });
});

describe("Open-Meteo through the app's shared copy", () => {
  let http: HttpTestingController;
  const shared = (service: string) => (r: { url: string }) =>
    r.url.startsWith(`/api/open-meteo/${service}?`);
  const direct = (host: string) => (r: { url: string }) => r.url.startsWith(`https://${host}/`);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    http = setUp('/api');
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it("asks the app's API with the very query Open-Meteo would get, and nothing else", async () => {
    const result = firstValueFrom(TestBed.inject(WeatherSource).forecast('famara'));
    const forecast = http.expectOne(shared('forecast'));
    http.expectOne(shared('air-quality')).flush(forEveryPlace(dustFixture));
    forecast.flush(forEveryPlace(forecastFixture));
    expect((await result).locationId).toBe('famara');
    expect(forecast.request.url.split('?')[1]).toContain('timezone=Atlantic%2FCanary');
    http.expectNone(direct('api.open-meteo.com'));
  });

  it('goes straight to Open-Meteo when the shared copy fails', async () => {
    const result = firstValueFrom(TestBed.inject(MarineSource).sea('famara'));
    http.expectOne(shared('marine')).flush('busy', { status: 502, statusText: 'Bad Gateway' });
    const request = http.expectOne(direct('marine-api.open-meteo.com'));
    const points = request.request.url.split('latitude=')[1].split('&')[0].split('%2C');
    request.flush(points.map(() => marineFixture));
    expect((await result)?.point).toBeDefined();
  });

  it('goes straight to Open-Meteo when this host has no API (its page instead of JSON)', async () => {
    const result = firstValueFrom(TestBed.inject(WeatherSource).forecast('arrecife'));
    http.expectOne(shared('forecast')).flush('<!doctype html>', { status: 404, statusText: 'NF' });
    http.expectOne(shared('air-quality')).flush(forEveryPlace(dustFixture));
    http.expectOne(direct('api.open-meteo.com')).flush(forEveryPlace(forecastFixture));
    expect((await result).hourly.length).toBeGreaterThan(24 * 6);
  });

  it('goes straight to Open-Meteo when the shared copy has the wrong number of places', async () => {
    const result = firstValueFrom(TestBed.inject(WeatherSource).forecast('arrecife'));
    http.expectOne(shared('forecast')).flush([forecastFixture]);
    http.expectOne(shared('air-quality')).flush(forEveryPlace(dustFixture));
    http.expectOne(direct('api.open-meteo.com')).flush(forEveryPlace(forecastFixture));
    expect((await result).hourly.length).toBeGreaterThan(24 * 6);
  });
});

describe('Official AEMET sources', () => {
  afterEach(() => vi.useRealTimers());

  async function ask<T>(
    source: () => Observable<T>,
    respond?: (http: HttpTestingController) => void,
  ) {
    const http = TestBed.inject(HttpTestingController);
    const result = firstValueFrom(source());
    respond?.(http);
    return result;
  }

  it('says "unavailable" without a request when the app has no API', async () => {
    const http = setUp(null);
    expect(await firstValueFrom(TestBed.inject(WarningSource).active())).toBeNull();
    http.verify();
  });

  it('says "unavailable" when the API is not deployed on this host', async () => {
    setUp();
    const result = await ask(
      () => TestBed.inject(WarningSource).active(),
      (http) => http.expectOne('/api/avisos').flush('Not found', { status: 404, statusText: 'NF' }),
    );
    expect(result).toBeNull();
  });

  it('says "unavailable" when observations have no AEMET key yet', async () => {
    setUp();
    const result = await ask(
      () => TestBed.inject(ObservationSource).latest(),
      (http) =>
        http
          .expectOne('/api/observaciones')
          .flush(
            { service: 'lanzamet-api', error: 'not_configured' },
            { status: 503, statusText: 'Unavailable' },
          ),
    );
    expect(result).toBeNull();
  });

  it('reads warnings and ignores malformed entries', async () => {
    setUp();
    const warning = {
      id: 'x',
      level: 'amarillo',
      phenomenon: 'Costeros',
      coastal: true,
      area: 'Costa - Lanzarote',
      onset: '2026-10-22T12:00:00Z',
      expires: '2026-10-22T22:59:59Z',
      description: 'Mar combinada del norte de 3 a 4 metros.',
      url: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
    };
    const result = await ask(
      () => TestBed.inject(WarningSource).active(),
      (http) =>
        http.expectOne('/api/avisos').flush({
          service: 'lanzamet-api',
          warnings: [warning, { id: 'broken' }],
          publishedAt: '2026-10-22T10:00:00Z',
          retrievedAt: '2026-10-22T14:00:00Z',
        }),
    );
    expect(result?.warnings).toEqual([warning]);
  });

  it('reports a real failure of the API as an error, not as "no warnings"', async () => {
    setUp();
    const result = ask(
      () => TestBed.inject(WarningSource).active(),
      (http) =>
        http
          .expectOne('/api/avisos')
          .flush({ service: 'lanzamet-api' }, { status: 500, statusText: 'Error' }),
    );
    await expect(result).rejects.toBeInstanceOf(DataSourceError);
  });
});
