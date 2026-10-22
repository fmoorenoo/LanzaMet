import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
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
        onViewTransitionCreated: ({ transition }) => inject(RouteTransitions).track(transition),
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Real providers; the demo build swaps them for simulated data.
    provideDataSources(),
  ],
};
