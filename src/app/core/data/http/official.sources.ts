import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { StationObservation, WarningBulletin, WeatherWarning } from '../../models';
import { TIME } from '../../utils/time';
import { ObservationSource, WarningSource } from '../data-sources';
import { MessageKey } from '../../i18n/i18n.model';
import { DATA_CONFIG } from './data-config';
import { resilient } from './http-errors';
import { ResponseCache } from './response-cache';

/*
 * Official AEMET information through the app's own API (`server/`). That API
 * exists because AEMET's warning files don't allow browser requests and
 * AEMET OpenData needs a private key. When it isn't deployed, or has no key,
 * the sources emit null and the interface says the data is unavailable.
 */

/** Every response of the app's API carries this marker. */
const SERVICE = 'lanzamet-api';
const WARNINGS_TTL = 10 * TIME.MINUTE;
const OBSERVATIONS_TTL = 20 * TIME.MINUTE;

const UNAVAILABLE = Symbol('unavailable');

interface ApiBody {
  readonly service?: unknown;
  readonly error?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || typeof value === 'number';
/** Fields added later by the API: absent on older deployments, so optional. */
const isOptionalText = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === 'string';

function isWarning(value: unknown): value is WeatherWarning {
  return (
    isRecord(value) &&
    isString(value['id']) &&
    (value['level'] === 'amarillo' || value['level'] === 'naranja' || value['level'] === 'rojo') &&
    isString(value['phenomenon']) &&
    typeof value['coastal'] === 'boolean' &&
    isString(value['area']) &&
    isString(value['onset']) &&
    isString(value['expires']) &&
    isString(value['description']) &&
    isOptionalText(value['descriptionEn']) &&
    isOptionalText(value['phenomenonCode']) &&
    isString(value['url'])
  );
}

function isObservation(value: unknown): value is StationObservation {
  return (
    isRecord(value) &&
    isString(value['stationId']) &&
    isString(value['stationName']) &&
    isRecord(value['position']) &&
    isNumberOrNull(value['altitudeM']) &&
    isString(value['time']) &&
    isNumberOrNull(value['temperatureC']) &&
    isNumberOrNull(value['windKmh']) &&
    isNumberOrNull(value['gustKmh']) &&
    isNumberOrNull(value['windFromDegrees']) &&
    isNumberOrNull(value['humidity']) &&
    isNumberOrNull(value['precipitationMm'])
  );
}

@Service({ autoProvided: false })
class OfficialApi {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(ResponseCache);
  private readonly config = inject(DATA_CONFIG);

  /**
   * GET `path` on the app's API. Resolves to `UNAVAILABLE` when there is no
   * such API here (not configured, not deployed, or without credentials).
   */
  get(path: string, ttlMs: number, service: MessageKey): Observable<unknown> {
    const base = this.config.proxyUrl;
    if (base === null) return of(UNAVAILABLE);
    const url = `${base.replace(/\/$/, '')}/${path}`;
    return this.cache
      .get(
        `api-${path}`,
        url,
        () =>
          this.http.get<unknown>(url).pipe(
            map((body) => (isRecord(body) && body['service'] === SERVICE ? body : UNAVAILABLE)),
            catchError((error: unknown) =>
              isMissingApi(error) ? of(UNAVAILABLE) : throwError(() => error),
            ),
            resilient(service),
          ),
        { ttlMs, persist: false },
      )
      .pipe(map((cached) => cached.value));
  }
}

function isMissingApi(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  // A static host without the API answers 404, or a 200 with its HTML page (unparsable as JSON).
  if (error.status === 404 || error.status === 200) return true;
  const body = error.error as ApiBody | null;
  return error.status === 503 && body?.service === SERVICE && body.error === 'not_configured';
}

@Service({ autoProvided: false })
export class AemetWarningSource extends WarningSource {
  private readonly api = inject(OfficialApi);

  active(): Observable<WarningBulletin | null> {
    return this.api.get('avisos', WARNINGS_TTL, 'service.warnings').pipe(
      map((body: unknown) => {
        if (body === UNAVAILABLE || !isRecord(body)) return null;
        const warnings = Array.isArray(body['warnings']) ? body['warnings'].filter(isWarning) : [];
        return {
          warnings,
          publishedAt: isString(body['publishedAt']) ? body['publishedAt'] : null,
          retrievedAt: isString(body['retrievedAt'])
            ? body['retrievedAt']
            : new Date().toISOString(),
        };
      }),
    );
  }
}

@Service({ autoProvided: false })
export class AemetObservationSource extends ObservationSource {
  private readonly api = inject(OfficialApi);

  latest(): Observable<readonly StationObservation[] | null> {
    return this.api.get('observaciones', OBSERVATIONS_TTL, 'service.observations').pipe(
      map((body: unknown) => {
        if (body === UNAVAILABLE || !isRecord(body)) return null;
        return Array.isArray(body['observations'])
          ? body['observations'].filter(isObservation)
          : [];
      }),
    );
  }
}

export const OFFICIAL_PROVIDERS = [OfficialApi];
