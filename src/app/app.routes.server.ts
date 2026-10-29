import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { Lang, LANGS } from './core/i18n/i18n.model';
import {
  EN_PREFIX,
  PAGE_IDS,
  pagePath,
  ZONE_VIEW_SLUGS,
  ZONE_VIEWS,
  ZoneView,
} from './core/i18n/localized-paths';
import { LOCATIONS } from './core/data/locations';
import { ZONE_PARAM } from './core/state/zone-navigation';

/** Each place in the catalogue gets its own page: /tiempo/famara, /en/sea/famara… */
const eachPlace = (path: string): ServerRoute => ({
  path,
  renderMode: RenderMode.Prerender,
  getPrerenderParams: async () => LOCATIONS.map((l) => ({ [ZONE_PARAM]: l.id })),
  // A name that isn't a place is left to the browser ("page not found").
  fallback: PrerenderFallback.Client,
});

/** "tiempo/:zona", "en/sea/:zona": the same words as app.routes.ts. */
const zoneRoute = (view: ZoneView, lang: Lang) =>
  [lang === 'en' ? EN_PREFIX : '', ZONE_VIEW_SLUGS[view][lang], `:${ZONE_PARAM}`]
    .filter(Boolean)
    .join('/');

/**
 * Every page is written to HTML at build time, in each language, so search
 * engines, AI assistants and link previews read its title, description,
 * canonical address, language versions and fixed text without running
 * JavaScript. Any other address is left to the browser, which shows "page
 * not found" (the Worker answers it with the app's shell and a 404:
 * notFoundPage in server/api.ts).
 */
export const serverRoutes: ServerRoute[] = [
  ...LANGS.flatMap((lang) => [
    // A route path is the address without its leading slash ("" for /, "en/places").
    ...PAGE_IDS.map((page): ServerRoute => ({
      path: pagePath(page, lang).slice(1),
      renderMode: RenderMode.Prerender,
    })),
    ...ZONE_VIEWS.map((view) => eachPlace(zoneRoute(view, lang))),
  ]),
  { path: '**', renderMode: RenderMode.Client },
];
