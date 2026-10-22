import { Observable } from 'rxjs';
import { Location, LocationId, SeaForecast, TideForecast, WeatherForecast } from '../models';

/*
 * Data ports. The UI and the stores only ever depend on these abstract
 * classes; `provideMockDataSources()` binds them to simulated data today, and a
 * future `provideHttpDataSources()` can bind them to real providers (a weather
 * API, a tide service, a marine model or an own backend) without touching any
 * component. Implementations map provider DTOs into these domain contracts.
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

/** Raised by sources when a provider fails; the message is safe to show. */
export class DataSourceError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = 'DataSourceError';
  }
}
