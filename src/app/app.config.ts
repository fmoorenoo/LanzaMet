import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  RouteReuseStrategy,
  TitleStrategy,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withViewTransitions,
} from '@angular/router';
import { provideFeedback } from './core/feedback/provide-feedback';
import { provideAppServiceWorker } from './core/pwa/provide-service-worker';
import { reloadForNewVersion } from './core/pwa/stale-version';
import { I18nTitleStrategy } from './core/i18n/i18n-title.strategy';
import { pageOf, SamePageReuseStrategy } from './core/state/same-page';
import { routes } from './app.routes';
import { RouteTransitions } from './layout/route-transitions';
import { provideDataSources } from './data-providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          // Another place on the same page (/ → /tiempo/famara): no page transition,
          // as when choosing a place didn't change the address.
          const page = pageOf(to);
          if (page !== undefined && page === pageOf(from)) {
            transition.skipTransition();
            return;
          }
          inject(RouteTransitions).track(transition);
        },
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // A screen built before the latest deploy: reload once to get the new version.
      withNavigationErrorHandler((event) => void reloadForNewVersion(event.error)),
    ),
    { provide: TitleStrategy, useClass: I18nTitleStrategy },
    { provide: RouteReuseStrategy, useClass: SamePageReuseStrategy },
    // Real providers; the demo build swaps them for simulated data.
    provideDataSources(),
    // Feedback is always real: the demo build has no pretend "sent".
    provideFeedback(),
    // Installable as an app: keeps the app itself, never the weather.
    provideAppServiceWorker(),
  ],
};
