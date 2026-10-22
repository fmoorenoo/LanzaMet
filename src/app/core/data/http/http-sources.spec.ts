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
    http = setUp();
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
    expect(forecast.request.url.split('latitude=')[1].split('&')[0].split('%2C').length).toBe(9);
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
    expect((await result).hourly.length).toBe(48);
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
      forkJoin([marine.sea('famara'), marine.sea('la-santa'), marine.tides('arrecife')]),
    );
    const request = http.expectOne((r) => r.url.startsWith('https://marine-api.open-meteo.com/'));
    const points = request.request.url.split('latitude=')[1].split('&')[0].split('%2C');
    const distinct = new Set(LOCATIONS.map((l) => JSON.stringify(l.coverage.sea))).size;
    expect(points.length).toBe(distinct);
    expect(request.request.url).toContain('past_days=1');
    request.flush(points.map(() => marineFixture));

    const [famara, laSanta, tide] = await both;
    // Famara and La Santa read the same model cell, so they get the same sea.
    expect(famara?.current).toEqual(laSanta?.current);
    expect(tide?.source.official).toBe(false);
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
            { service: 'que-tal-hoy-api', error: 'not_configured' },
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
          service: 'que-tal-hoy-api',
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
          .flush({ service: 'que-tal-hoy-api' }, { status: 500, statusText: 'Error' }),
    );
    await expect(result).rejects.toBeInstanceOf(DataSourceError);
  });
});
