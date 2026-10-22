import { InjectionToken } from '@angular/core';

/** Whether the app shows real provider data or the simulated demo. */
export type DataMode = 'live' | 'demo';

export const DATA_MODE = new InjectionToken<DataMode>('DATA_MODE', {
  factory: () => 'live',
});

export interface DataConfig {
  /**
   * Base URL of the app's own small API (see `server/`), which holds the
   * AEMET credentials and caches official data for everyone. Null when the
   * deployment has none: official warnings and observations are then shown
   * as unavailable, never replaced by anything else.
   */
  readonly proxyUrl: string | null;
}

export const DATA_CONFIG = new InjectionToken<DataConfig>('DATA_CONFIG', {
  factory: () => ({ proxyUrl: '/api' }),
});
