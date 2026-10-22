import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  Service,
  untracked,
} from '@angular/core';
import { defer, delay, Observable, of, switchMap, throwError, timer } from 'rxjs';
import {
  DataSourceError,
  LocationSource,
  MarineSource,
  ObservationSource,
  WarningSource,
  WeatherSource,
} from '../core/data/data-sources';
import { DATA_MODE, DataMode } from '../core/data/http/data-config';
import {
  Location,
  LocationId,
  SeaForecast,
  StationObservation,
  TideForecast,
  WarningBulletin,
  WeatherForecast,
} from '../core/models';
import { ClockStore } from '../core/state/clock.store';
import { DEMO_CONTROLS } from '../layout/settings-panel/demo-controls.token';
import { DemoControls } from './demo-controls';
import { DemoStore } from './demo.store';
import { LOCATIONS_SEED } from './seed/locations.seed';
import { simulateObservation, simulateWarnings } from './sim/official';
import { SimulationInput, simulateSea, simulateTides, simulateWeather } from './sim/simulator';

/*
 * DEMO DATA — in-memory implementations of the data ports. They add a small
 * latency (or a failure, on request) so the interface's loading and error
 * states behave as they will with real providers. No network requests.
 */

@Service({ autoProvided: false })
class MockRequests {
  private readonly demo = inject(DemoStore);
  private readonly clock = inject(ClockStore);

  respond<T>(
    serviceName: string,
    produce: (input: Omit<SimulationInput, 'location'>) => T,
  ): Observable<T> {
    return defer(() => {
      const latency = untracked(this.demo.latencyMs);
      if (untracked(this.demo.failRequests)) {
        return timer(latency).pipe(
          switchMap(() =>
            throwError(() => new DataSourceError(`No hemos podido conectar con ${serviceName}.`)),
          ),
        );
      }
      const input = { scenario: untracked(this.demo.scenario), now: untracked(this.clock.now) };
      return of(produce(input)).pipe(delay(latency));
    });
  }
}

function findLocation(id: LocationId): Location {
  const location = LOCATIONS_SEED.find((l) => l.id === id);
  if (!location) throw new DataSourceError('No tenemos datos de esa zona.', false);
  return location;
}

@Service({ autoProvided: false })
class MockLocationSource extends LocationSource {
  private readonly requests = inject(MockRequests);

  list(): Observable<readonly Location[]> {
    return this.requests.respond('el listado de zonas', () => LOCATIONS_SEED);
  }
}

@Service({ autoProvided: false })
class MockWeatherSource extends WeatherSource {
  private readonly requests = inject(MockRequests);

  forecast(locationId: LocationId): Observable<WeatherForecast> {
    return this.requests.respond('el servicio del tiempo', (input) =>
      simulateWeather({ ...input, location: findLocation(locationId) }),
    );
  }
}

@Service({ autoProvided: false })
class MockMarineSource extends MarineSource {
  private readonly requests = inject(MockRequests);

  sea(locationId: LocationId): Observable<SeaForecast | null> {
    return this.requests.respond('el servicio marítimo', (input) =>
      simulateSea({ ...input, location: findLocation(locationId) }),
    );
  }

  tides(locationId: LocationId): Observable<TideForecast | null> {
    return this.requests.respond('el servicio de mareas', (input) =>
      simulateTides({ ...input, location: findLocation(locationId) }),
    );
  }
}

@Service({ autoProvided: false })
class MockWarningSource extends WarningSource {
  private readonly requests = inject(MockRequests);

  active(): Observable<WarningBulletin | null> {
    return this.requests.respond('el servicio de avisos', (input) => ({
      warnings: simulateWarnings(input),
      publishedAt: input.now.toISOString(),
      retrievedAt: input.now.toISOString(),
    }));
  }
}

@Service({ autoProvided: false })
class MockObservationSource extends ObservationSource {
  private readonly requests = inject(MockRequests);

  latest(): Observable<readonly StationObservation[] | null> {
    return this.requests.respond('el servicio de observación', (input) => [
      simulateObservation({ ...input, location: findLocation('arrecife') }),
    ]);
  }
}

/** Binds every data port to simulated data, for development and reviews only. */
export function provideMockDataSources(): EnvironmentProviders {
  return makeEnvironmentProviders([
    MockRequests,
    { provide: DATA_MODE, useValue: 'demo' satisfies DataMode },
    { provide: DEMO_CONTROLS, useValue: DemoControls },
    { provide: LocationSource, useClass: MockLocationSource },
    { provide: WeatherSource, useClass: MockWeatherSource },
    { provide: MarineSource, useClass: MockMarineSource },
    { provide: WarningSource, useClass: MockWarningSource },
    { provide: ObservationSource, useClass: MockObservationSource },
  ]);
}
