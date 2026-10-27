import { RenderMode, ServerRoute } from '@angular/ssr';
import { PAGE_PATHS } from './app.routes';

/**
 * Every page is written to HTML at build time, so search engines, AI
 * assistants and link previews read its title, description, canonical
 * address and fixed text without running JavaScript. Any other address is
 * left to the browser, which shows "page not found" (the Worker serves it
 * from 404.html with a 404 status; see wrangler.jsonc).
 */
export const serverRoutes: ServerRoute[] = [
  ...PAGE_PATHS.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  { path: '**', renderMode: RenderMode.Client },
];
