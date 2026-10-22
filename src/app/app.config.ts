import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { RouteTransitions } from './layout/route-transitions';
import { provideMockDataSources } from './mocks/mock-data-sources';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => inject(RouteTransitions).track(transition),
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Phase 1: simulated data. Replace with HTTP-backed sources in phase 2.
    provideMockDataSources(),
  ],
};
