import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, timeout } from 'rxjs';
import { GeoPoint } from '../../models';
import { TIME } from '../../utils/time';
import { MessageKey, msg } from '../../i18n/i18n.model';
import { DataSourceError } from '../data-sources';
import { LOCATIONS } from '../locations';
import { DATA_CONFIG } from './data-config';
import { resilient } from './http-errors';
import { AirQualityDto, asList, ForecastDto, isProviderError, MarineDto } from './open-meteo.dto';
import { AIR_QUALITY_URL, FORECAST_URL, islandQueries, MARINE_URL } from './open-meteo.queries';
import { Cached, ResponseCache } from './response-cache';

export { samePoint } from './open-meteo.queries';

/*
 * Open-Meteo, asked once for the whole island: one request carries every
 * place (the API takes lists of coordinates), so the places cost three
 * requests in total — forecast, sea and dust — however many screens show them.
 * The queries themselves are built in open-meteo.queries.ts.
 *
 * Freshness follows how often each model is updated upstream:
 *  · forecast (DWD ICON): new runs several times a day, `current` every 15 min → 30 min
 *  · sea (Météo-France MFWAM/SMOC): updated every 12–24 h → 60 min
 *  · dust (CAMS global): updated every 12 h → 3 h
 *
 * Weather and sea cover the seven days the app lets you choose from; dust
 * only as far as CAMS forecasts it (about four and a half days), so calima
 * can't be told on the last days of the week.
 *
 * Each request goes first to the app's API (`/api/open-meteo/…`), which keeps
 * one copy of Open-Meteo's answer for every visitor (server/open-meteo.ts).
 * If that copy can't be had — no API on this host, an error, a slow answer —
 * the same query goes straight to Open-Meteo, as it always did.
 */

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

@Service({ autoProvided: false })
export class OpenMeteoClient {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(ResponseCache);
  private readonly proxyUrl = inject(DATA_CONFIG).proxyUrl;

  readonly locations = LOCATIONS;
  private readonly queries = islandQueries(LOCATIONS);
  private readonly seaPoints = this.queries.seaPoints;
  private readonly forecastUrl = this.queries.forecast;
  private readonly dustUrl = this.queries.dust;
  private readonly marineUrl = this.queries.marine;

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
