import { Routes } from '@angular/router';
import { Lang, MessageKey } from './core/i18n/i18n.model';
import { speak } from './core/i18n/lang-route';
import {
  EN_PREFIX,
  PAGE_SLUGS,
  PageId,
  ZONE_VIEW_SLUGS,
  ZoneView,
} from './core/i18n/localized-paths';
import { SeoRouteData } from './core/seo/seo-tags';
import { RETIRED_LOCATIONS } from './core/data/locations';
import { knownZone, selectZone, ZONE_PARAM } from './core/state/zone-navigation';
import { TodayPage } from './features/today/today.page';

/**
 * Titles are message keys; I18nTitleStrategy writes them in the page's
 * language. The four tabs carry a title written for search results ("seo.*"),
 * which only shows in the browser tab: the words on screen stay the same.
 */
const title = (key: MessageKey) => key;

/** What each page tells search engines about itself (see SeoTags). */
const seo = (data: SeoRouteData) => data;

/** A retired place's old address leads to the one that replaced it (Papagayo → Playa Blanca). */
const retired = (view: 'tiempo' | 'mar'): Routes =>
  Object.entries(RETIRED_LOCATIONS).map(([old, now]) => ({
    path: `${view}/${old}`,
    redirectTo: `/${view}/${now}`,
  }));

/**
 * One language's pages, at that language's addresses (localized-paths.ts):
 * the same pages, titles and data in both.
 */
function pagesIn(lang: Lang): Routes {
  const path = (page: PageId) => PAGE_SLUGS[page][lang];
  const zone = (view: ZoneView) => `${ZONE_VIEW_SLUGS[view][lang]}/:${ZONE_PARAM}`;
  return [
    // Eager: it is the page nearly every visit opens on, and loading it lazily
    // left a chain of downloads between the first byte and the first paint.
    {
      path: path('today'),
      title: title('seo.title.today'),
      data: { ...seo({ description: 'seo.description.today', image: 'home' }), page: 'today' },
      component: TodayPage,
    },
    // Each place's weather: Hoy for that place (the same page, kept on screen when
    // only the place changes: see SamePageReuseStrategy). Papagayo only ever had
    // Spanish addresses.
    ...(lang === 'es' ? retired('tiempo') : []),
    {
      path: zone('weather'),
      canMatch: [knownZone],
      canActivate: [selectZone],
      title: title('seo.title.weatherZone'),
      data: {
        ...seo({
          description: 'seo.description.weatherZone',
          parent: { label: 'nav.zones', page: 'zones' },
          image: 'home',
        }),
        page: 'today',
      },
      component: TodayPage,
    },
    {
      path: path('zones'),
      title: title('seo.title.zones'),
      data: seo({ description: 'seo.description.zones', crumb: 'nav.zones', image: 'zones' }),
      loadComponent: () => import('./features/zones/zones.page').then((m) => m.ZonesPage),
    },
    {
      path: path('sea'),
      title: title('seo.title.sea'),
      data: {
        ...seo({ description: 'seo.description.sea', crumb: 'nav.sea', image: 'sea' }),
        page: 'sea',
      },
      loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
    },
    // Each place's sea: Mar for that place.
    ...(lang === 'es' ? retired('mar') : []),
    {
      path: zone('sea'),
      canMatch: [knownZone],
      canActivate: [selectZone],
      title: title('seo.title.seaZone'),
      data: {
        ...seo({
          description: 'seo.description.seaZone',
          parent: { label: 'nav.sea', page: 'sea' },
          image: 'sea',
        }),
        page: 'sea',
      },
      loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
    },
    {
      path: path('plans'),
      title: title('seo.title.plans'),
      data: seo({ description: 'seo.description.plans', crumb: 'nav.plans', image: 'plans' }),
      loadComponent: () => import('./features/plans/plans.page').then((m) => m.PlansPage),
    },
    // Outside the tab bar: Hoy leads here from its hours.
    {
      path: path('wind'),
      title: title('seo.title.wind'),
      data: seo({ description: 'seo.description.wind', crumb: 'wind.title', image: 'wind' }),
      loadComponent: () => import('./features/wind/wind.page').then((m) => m.WindPage),
    },
    {
      path: path('about'),
      title: title('route.about'),
      data: seo({
        description: 'seo.description.about',
        crumb: 'route.about',
        image: 'about',
        about: true,
      }),
      loadComponent: () => import('./features/about/about.page').then((m) => m.AboutPage),
    },
    {
      path: path('feedback'),
      title: title('route.feedback'),
      // A form, not content: out of search results.
      data: seo({ description: 'seo.description.feedback', noindex: true }),
      loadComponent: () => import('./features/feedback/feedback.page').then((m) => m.FeedbackPage),
    },
    {
      path: path('legal'),
      title: title('route.legal'),
      data: seo({ description: 'seo.description.legal', crumb: 'route.legal' }),
      loadComponent: () => import('./features/legal/legal.page').then((m) => m.LegalPage),
    },
    // An unknown address says so (and stays out of search results) instead of
    // showing the home page under a wrong address, in the language of its prefix.
    {
      path: '**',
      title: title('route.notFound'),
      data: seo({ noindex: true }),
      loadComponent: () =>
        import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
    },
  ];
}

/** English under /en, first; Spanish, the default, at the root (with every other address). */
export const routes: Routes = [
  { path: EN_PREFIX, canActivateChild: [speak('en')], children: pagesIn('en') },
  { path: '', canActivateChild: [speak('es')], children: pagesIn('es') },
];
