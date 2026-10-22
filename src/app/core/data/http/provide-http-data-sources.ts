import { provideHttpClient, withFetch } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { LocationSource, MarineSource, WeatherSource } from '../data-sources';
import { DATA_CONFIG, DATA_MODE, DataConfig, DataMode } from './data-config';
import { OpenMeteoClient } from './open-meteo.client';
import {
  CatalogueLocationSource,
  OpenMeteoMarineSource,
  OpenMeteoWeatherSource,
} from './open-meteo.sources';

/** Binds every data port to the real providers (Open-Meteo). */
export function provideHttpDataSources(config?: DataConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: DATA_MODE, useValue: 'live' satisfies DataMode },
    ...(config ? [{ provide: DATA_CONFIG, useValue: config }] : []),
    OpenMeteoClient,
    { provide: LocationSource, useClass: CatalogueLocationSource },
    { provide: WeatherSource, useClass: OpenMeteoWeatherSource },
    { provide: MarineSource, useClass: OpenMeteoMarineSource },
  ]);
}
