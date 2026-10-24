import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideFeedback } from './core/feedback/provide-feedback';
import { provideAppServiceWorker } from './core/pwa/provide-service-worker';
import { I18nTitleStrategy } from './core/i18n/i18n-title.strategy';
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
    { provide: TitleStrategy, useClass: I18nTitleStrategy },
    // Real providers; the demo build swaps them for simulated data.
    provideDataSources(),
    // Feedback is always real: the demo build has no pretend "sent".
    provideFeedback(),
    // Installable as an app: keeps the app itself, never the weather.
    provideAppServiceWorker(),
  ],
};
