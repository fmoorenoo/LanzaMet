import { DOCUMENT } from '@angular/common';
import {
  EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideServiceWorker, SwUpdate } from '@angular/service-worker';

/**
 * Angular's service worker, in production builds only. It keeps the app
 * itself (HTML, JS, CSS, fonts, icons) so an installed copy opens without a
 * connection — and nothing else: forecasts, warnings and feedback always go
 * to the network (no `dataGroups` in ngsw-config.json), so their freshness
 * stays with ResponseCache and the stores.
 */
export function provideAppServiceWorker(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // After the first screen has settled, so the worker never competes with it.
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => {
      const updates = inject(SwUpdate);
      const location = inject(DOCUMENT).defaultView?.location;
      if (!updates.isEnabled) return;
      // The kept copy can no longer be served whole (e.g. evicted by the browser): start afresh.
      updates.unrecoverable.subscribe(() => location?.reload());
    }),
  ]);
}
