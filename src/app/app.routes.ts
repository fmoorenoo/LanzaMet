import { Routes } from '@angular/router';
import { MessageKey } from './core/i18n/i18n.model';
import { SeoRouteData } from './core/seo/seo-tags';
import { TodayPage } from './features/today/today.page';

/**
 * Titles are message keys; I18nTitleStrategy writes them in the visitor's
 * language. The four tabs carry a title written for search results ("seo.*"),
 * which only shows in the browser tab: the words on screen stay the same.
 */
const title = (key: MessageKey) => key;

/** What each page tells search engines about itself (see SeoTags). */
const seo = (data: SeoRouteData) => data;

/** The addresses prerendered at build time (app.routes.server.ts) and listed in the sitemap. */
export const PAGE_PATHS = ['', 'zonas', 'mar', 'donde-ir', 'sobre', 'legal', 'mejorar'] as const;

export const routes: Routes = [
  // Eager: it is the page nearly every visit opens on, and loading it lazily
  // left a chain of downloads between the first byte and the first paint.
  {
    path: '',
    title: title('seo.title.today'),
    data: seo({ description: 'seo.description.today' }),
    component: TodayPage,
  },
  {
    path: 'zonas',
    title: title('seo.title.zones'),
    data: seo({ description: 'seo.description.zones' }),
    loadComponent: () => import('./features/zones/zones.page').then((m) => m.ZonesPage),
  },
  {
    path: 'mar',
    title: title('seo.title.sea'),
    data: seo({ description: 'seo.description.sea' }),
    loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
  },
  {
    path: 'donde-ir',
    title: title('seo.title.plans'),
    data: seo({ description: 'seo.description.plans' }),
    loadComponent: () => import('./features/plans/plans.page').then((m) => m.PlansPage),
  },
  {
    path: 'sobre',
    title: title('route.about'),
    data: seo({ description: 'seo.description.about' }),
    loadComponent: () => import('./features/about/about.page').then((m) => m.AboutPage),
  },
  {
    path: 'mejorar',
    title: title('route.feedback'),
    // A form, not content: out of search results.
    data: seo({ description: 'seo.description.feedback', noindex: true }),
    loadComponent: () => import('./features/feedback/feedback.page').then((m) => m.FeedbackPage),
  },
  {
    path: 'legal',
    title: title('route.legal'),
    data: seo({ description: 'seo.description.legal' }),
    loadComponent: () => import('./features/legal/legal.page').then((m) => m.LegalPage),
  },
  // An unknown address says so (and stays out of search results) instead of
  // showing the home page under a wrong address.
  {
    path: '**',
    title: title('route.notFound'),
    data: seo({ noindex: true }),
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
