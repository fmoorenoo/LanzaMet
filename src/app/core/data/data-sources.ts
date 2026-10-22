import { Observable } from 'rxjs';
import { Msg } from '../i18n/i18n.model';
import {
  Location,
  LocationId,
  SeaForecast,
  StationObservation,
  TideForecast,
  WarningBulletin,
  WeatherForecast,
} from '../models';

/*
 * Data ports. The UI and the stores only ever depend on these abstract
 * classes; `provideDataSources()` binds them to real providers (see
 * `core/data/http`) or, in the demo build, to simulated data. Implementations
 * map provider DTOs into these domain contracts.
 */

export abstract class LocationSource {
  abstract list(): Observable<readonly Location[]>;
}

export abstract class WeatherSource {
  abstract forecast(locationId: LocationId): Observable<WeatherForecast>;
}

export abstract class MarineSource {
  /** Emits `null` when the place has no marine coverage. */
  abstract sea(locationId: LocationId): Observable<SeaForecast | null>;
  /** Emits `null` when there is no tide prediction for the place. */
  abstract tides(locationId: LocationId): Observable<TideForecast | null>;
}

export abstract class WarningSource {
  /** Active official warnings for the island; `null` when the service is not available here. */
  abstract active(): Observable<WarningBulletin | null>;
}

export abstract class ObservationSource {
  /** Latest reading of each station on the island; `null` when the service is not available here. */
  abstract latest(): Observable<readonly StationObservation[] | null>;
}

/**
 * Raised by sources when a provider fails. `detail` is safe to show and is
 * written in whichever language the visitor reads (see core/i18n).
 */
export class DataSourceError extends Error {
  constructor(
    readonly detail: Msg,
    readonly retryable = true,
  ) {
    super(detail.key);
    this.name = 'DataSourceError';
  }
}
