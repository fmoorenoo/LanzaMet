import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, timeout } from 'rxjs';
import { GeoPoint, Location } from '../../models';
import { ISLAND_TIME_ZONE, TIME } from '../../utils/time';
import { MessageKey, msg } from '../../i18n/i18n.model';
import { DataSourceError } from '../data-sources';
import { LOCATIONS } from '../locations';
import { DATA_CONFIG } from './data-config';
import { resilient } from './http-errors';
import { AirQualityDto, asList, ForecastDto, isProviderError, MarineDto } from './open-meteo.dto';
import { Cached, ResponseCache } from './response-cache';

/*
 * Open-Meteo, asked once for the whole island: one request carries every
 * place (the API takes lists of coordinates), so the eight places cost three
 * requests in total — forecast, sea and dust — however many screens show them.
 *
 * Freshness follows how often each model is updated upstream:
 *  · forecast (DWD ICON): new runs several times a day, `current` every 15 min → 30 min
 *  · sea (Météo-France MFWAM/SMOC): updated every 12–24 h → 60 min
 *  · dust (CAMS global): updated every 12 h → 3 h
 *
 * Each request goes first to the app's API (`/api/open-meteo/…`), which keeps
 * one copy of Open-Meteo's answer for every visitor (server/open-meteo.ts).
 * If that copy can't be had — no API on this host, an error, a slow answer —
 * the same query goes straight to Open-Meteo, as it always did.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const FORECAST_TTL = 30 * TIME.MINUTE;
const MARINE_TTL = 60 * TIME.MINUTE;
const DUST_TTL = 3 * TIME.HOUR;

/** Long enough for the API to ask Open-Meteo itself; short enough to leave time to go direct. */
const SHARED_TIMEOUT_MS = 8_000;

/** Where the app's API keeps each Open-Meteo service. */
const SHARED_PATH: Readonly<Record<string, string>> = {
  [FORECAST_URL]: 'forecast',
  [MARINE_URL]: 'marine',
  [AIR_QUALITY_URL]: 'air-quality',
};

const FORECAST_VARIABLES = {
  current: [
    'temperature_2m',
    'apparent_temperature',
    'is_day',
    'weather_code',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'uv_index',
  ],
  hourly: [
    'temperature_2m',
    'apparent_temperature',
    'weather_code',
    'cloud_cover',
    'precipitation_probability',
    'uv_index',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'is_day',
  ],
  daily: [
    'temperature_2m_max',
    'temperature_2m_min',
    'sunrise',
    'sunset',
    'uv_index_max',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_direction_10m_dominant',
  ],
};

const MARINE_VARIABLES = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
  'sea_surface_temperature',
  'sea_level_height_msl',
];

/** Coordinates as the API wants them, rounded to what the grids can tell apart. */
function coordinates(points: readonly GeoPoint[]): Record<string, string> {
  return {
    latitude: points.map((p) => p.latitude.toFixed(4)).join(','),
    longitude: points.map((p) => p.longitude.toFixed(4)).join(','),
  };
}

function buildUrl(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}?${query}`;
}

const COMMON = { timezone: ISLAND_TIME_ZONE, timeformat: 'unixtime' };

export interface IslandWeather {
  readonly forecasts: readonly ForecastDto[];
  /** Null when the dust service failed: calima then simply can't be detected. */
  readonly dust: readonly AirQualityDto[] | null;
}

export interface IslandSea {
  /** One entry per distinct sea point, in `seaPoints` order. */
  readonly points: readonly GeoPoint[];
  readonly responses: readonly MarineDto[];
}

/** Same coordinates, same model cell: ask for each sea point only once. */
function distinctSeaPoints(locations: readonly Location[]): GeoPoint[] {
  const points: GeoPoint[] = [];
  for (const location of locations) {
    const point = location.coverage.sea;
    if (point && !points.some((p) => samePoint(p, point))) points.push(point);
  }
  return points;
}

export function samePoint(a: GeoPoint, b: GeoPoint): boolean {
  return Math.abs(a.latitude - b.latitude) < 1e-4 && Math.abs(a.longitude - b.longitude) < 1e-4;
}

@Service({ autoProvided: false })
export class OpenMeteoClient {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(ResponseCache);
  private readonly proxyUrl = inject(DATA_CONFIG).proxyUrl;

  readonly locations = LOCATIONS;
  private readonly seaPoints = distinctSeaPoints(LOCATIONS);

  private readonly forecastUrl = buildUrl(FORECAST_URL, {
    ...coordinates(this.locations.map((l) => l.position)),
    current: FORECAST_VARIABLES.current.join(','),
    hourly: FORECAST_VARIABLES.hourly.join(','),
    daily: FORECAST_VARIABLES.daily.join(','),
    ...COMMON,
    forecast_days: '7',
  });

  private readonly dustUrl = buildUrl(AIR_QUALITY_URL, {
    ...coordinates(this.locations.map((l) => l.position)),
    hourly: 'dust',
    domains: 'cams_global',
    ...COMMON,
    forecast_days: '5',
  });

  private readonly marineUrl = buildUrl(MARINE_URL, {
    ...coordinates(this.seaPoints),
    hourly: MARINE_VARIABLES.join(','),
    ...COMMON,
    // Yesterday is needed to know the tide that came before this morning's.
    past_days: '1',
    forecast_days: '3',
  });

  weather(): Observable<Cached<IslandWeather>> {
    const forecast = this.cache.get(
      'om-forecast',
      this.forecastUrl,
      () => this.fetchList<ForecastDto>(this.forecastUrl, this.locations.length, 'service.weather'),
      { ttlMs: FORECAST_TTL, persist: true },
    );
    // Both requests run side by side; dust only adds calima on top of the forecast.
    return forkJoin({ forecast, dust: this.dust() }).pipe(
      map(({ forecast, dust }) => ({
        value: { forecasts: forecast.value, dust },
        fetchedAt: forecast.fetchedAt,
      })),
    );
  }

  sea(): Observable<Cached<IslandSea>> {
    return this.cache
      .get(
        'om-marine',
        this.marineUrl,
        () => this.fetchList<MarineDto>(this.marineUrl, this.seaPoints.length, 'service.sea'),
        { ttlMs: MARINE_TTL, persist: true },
      )
      .pipe(
        map((cached) => ({
          value: { points: this.seaPoints, responses: cached.value },
          fetchedAt: cached.fetchedAt,
        })),
      );
  }

  private dust(): Observable<readonly AirQualityDto[] | null> {
    return this.cache
      .get(
        'om-dust',
        this.dustUrl,
        () => this.fetchList<AirQualityDto>(this.dustUrl, this.locations.length, 'service.air'),
        { ttlMs: DUST_TTL, persist: true },
      )
      .pipe(
        map((cached) => cached.value),
        catchError(() => of(null)),
      );
  }

  private fetchList<T>(
    url: string,
    expected: number,
    service: MessageKey,
  ): Observable<readonly T[]> {
    const read = (body: T | readonly T[]): readonly T[] => {
      if (isProviderError(body)) {
        throw new DataSourceError(
          msg('error.provider', { service: msg(service), reason: body.reason }),
          false,
        );
      }
      const list = asList(body);
      if (list.length !== expected) {
        throw new DataSourceError(msg('error.mismatch', { service: msg(service) }));
      }
      return list;
    };
    const direct = this.http.get<T | readonly T[]>(url).pipe(map(read));
    const shared = this.sharedUrl(url);
    const answer = shared
      ? this.http.get<T | readonly T[]>(shared).pipe(
          timeout({ first: SHARED_TIMEOUT_MS }),
          map(read),
          // Anything wrong with the shared copy: ask Open-Meteo as before.
          catchError(() => direct),
        )
      : direct;
    return answer.pipe(resilient(service));
  }

  /** The same query on the app's API, or null when this deployment has none. */
  private sharedUrl(url: string): string | null {
    const [base, query] = url.split('?');
    const path = SHARED_PATH[base];
    if (this.proxyUrl === null || !path) return null;
    return `${this.proxyUrl.replace(/\/$/, '')}/open-meteo/${path}?${query}`;
  }
}
