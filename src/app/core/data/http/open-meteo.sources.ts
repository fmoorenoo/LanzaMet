import { inject, Service, untracked } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Location, LocationId, SeaForecast, TideForecast, WeatherForecast } from '../../models';
import { ClockStore } from '../../state/clock.store';
import { msg } from '../../i18n/i18n.model';
import { DataSourceError, LocationSource, MarineSource, WeatherSource } from '../data-sources';
import { IslandSea, OpenMeteoClient, samePoint } from './open-meteo.client';
import { toSeaForecast, toTideForecast, toWeatherForecast } from './open-meteo.mappers';

/*
 * The data ports backed by Open-Meteo. Each call picks its place out of the
 * island-wide response, so asking for every place costs one request.
 */

@Service({ autoProvided: false })
export class CatalogueLocationSource extends LocationSource {
  private readonly client = inject(OpenMeteoClient);

  list(): Observable<readonly Location[]> {
    return of(this.client.locations);
  }
}

function placeIndex(locations: readonly Location[], id: LocationId): number {
  const index = locations.findIndex((l) => l.id === id);
  if (index === -1) throw new DataSourceError(msg('error.unknownPlace'), false);
  return index;
}

@Service({ autoProvided: false })
export class OpenMeteoWeatherSource extends WeatherSource {
  private readonly client = inject(OpenMeteoClient);
  private readonly clock = inject(ClockStore);

  forecast(locationId: LocationId): Observable<WeatherForecast> {
    return this.client.weather().pipe(
      map(({ value, fetchedAt }) => {
        const index = placeIndex(this.client.locations, locationId);
        return toWeatherForecast(
          locationId,
          value.forecasts[index],
          value.dust?.[index] ?? null,
          untracked(this.clock.now),
          fetchedAt,
        );
      }),
    );
  }
}

@Service({ autoProvided: false })
export class OpenMeteoMarineSource extends MarineSource {
  private readonly client = inject(OpenMeteoClient);
  private readonly clock = inject(ClockStore);

  sea(locationId: LocationId): Observable<SeaForecast | null> {
    return this.client.sea().pipe(
      map(({ value, fetchedAt }) => {
        const response = this.responseFor(value, locationId);
        return response
          ? toSeaForecast(locationId, response, untracked(this.clock.now), fetchedAt)
          : null;
      }),
    );
  }

  tides(locationId: LocationId): Observable<TideForecast | null> {
    return this.client.sea().pipe(
      map(({ value }) => {
        const location = this.client.locations[placeIndex(this.client.locations, locationId)];
        if (location.coverage.tide.kind === 'none') return null;
        const response = this.responseFor(value, locationId);
        return response ? toTideForecast(locationId, response) : null;
      }),
    );
  }

  private responseFor(sea: IslandSea, locationId: LocationId) {
    const point = this.client.locations[placeIndex(this.client.locations, locationId)].coverage.sea;
    if (!point) return null;
    const index = sea.points.findIndex((p) => samePoint(p, point));
    return index === -1 ? null : sea.responses[index];
  }
}
