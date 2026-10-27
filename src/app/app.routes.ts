import { Routes } from '@angular/router';
import { MessageKey } from './core/i18n/i18n.model';
import { SeoRouteData } from './core/seo/seo-tags';
import { TodayPage } from './features/today/today.page';

/** Titles are message keys; I18nTitleStrategy writes them in the visitor's language. */
const title = (key: MessageKey) => key;

export const routes: Routes = [
  // Eager: it is the page nearly every visit opens on, and loading it lazily
  // left a chain of downloads between the first byte and the first paint.
  {
    path: '',
    title: title('route.today'),
    component: TodayPage,
  },
  {
    path: 'zonas',
    title: title('route.zones'),
    loadComponent: () => import('./features/zones/zones.page').then((m) => m.ZonesPage),
  },
  {
    path: 'mar',
    title: title('route.sea'),
    loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
  },
  {
    path: 'donde-ir',
    title: title('route.plans'),
    loadComponent: () => import('./features/plans/plans.page').then((m) => m.PlansPage),
  },
  {
    path: 'mejorar',
    title: title('route.feedback'),
    loadComponent: () => import('./features/feedback/feedback.page').then((m) => m.FeedbackPage),
  },
  {
    path: 'legal',
    title: title('route.legal'),
    loadComponent: () => import('./features/legal/legal.page').then((m) => m.LegalPage),
  },
  // An unknown address says so (and stays out of search results) instead of
  // showing the home page under a wrong address.
  {
    path: '**',
    title: title('route.notFound'),
    data: { noindex: true } satisfies SeoRouteData,
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
