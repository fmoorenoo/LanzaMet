import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { PAGE_PATHS } from './app.routes';
import { LOCATIONS } from './core/data/locations';
import { ZONE_PARAM } from './core/state/zone-navigation';

/** Each place in the catalogue gets its own page: /tiempo/famara, /mar/famara… */
const eachPlace = (view: 'tiempo' | 'mar'): ServerRoute => ({
  path: `${view}/:${ZONE_PARAM}`,
  renderMode: RenderMode.Prerender,
  getPrerenderParams: async () => LOCATIONS.map((l) => ({ [ZONE_PARAM]: l.id })),
  // A name that isn't a place is left to the browser ("page not found").
  fallback: PrerenderFallback.Client,
});

/**
 * Every page is written to HTML at build time, so search engines, AI
 * assistants and link previews read its title, description, canonical
 * address and fixed text without running JavaScript. Any other address is
 * left to the browser, which shows "page not found" (the Worker answers it
 * with the app's shell and a 404: notFoundPage in server/api.ts).
 */
export const serverRoutes: ServerRoute[] = [
  ...PAGE_PATHS.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  eachPlace('tiempo'),
  eachPlace('mar'),
  { path: '**', renderMode: RenderMode.Client },
];
