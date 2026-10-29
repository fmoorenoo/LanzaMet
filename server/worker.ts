/*
 * The Worker's entry on Cloudflare (wrangler.jsonc → main): the API
 * (api.ts) and the card other websites embed, /widget/{zona}.
 *
 * The card reuses the web's own code (src/app/widget/widget-card.ts and the
 * rules it calls), which Wrangler bundles with esbuild. That code imports
 * without file extensions, which Node can't run directly, so it lives here
 * and not in api.ts: `npm run api` and `npm run test:api` keep running api.ts
 * under Node, and the widget is tried with `npm run preview`.
 */
import { LOCATIONS } from '../src/app/core/data/locations';
import { asList, isProviderError } from '../src/app/core/data/http/open-meteo.dto';
import type {
  AirQualityDto,
  ForecastDto,
  MarineDto,
} from '../src/app/core/data/http/open-meteo.dto';
import { islandQueries, samePoint } from '../src/app/core/data/http/open-meteo.queries';
import type { Lang } from '../src/app/core/i18n/i18n.model';
import {
  WIDGET_THEMES,
  widgetHtml,
  widgetUnavailableHtml,
  widgetView,
  type WidgetTheme,
} from '../src/app/widget/widget-card';
import api, { type Env, sharedOpenMeteo } from './api.ts';
import { remember } from './edge-cache.ts';
import { OPEN_METEO_SERVICES } from './open-meteo.ts';

const MINUTE = 60_000;
/** A card is drawn again at most this often, whoever embeds it; the data under it is cached apart. */
const CARD_TTL = 10 * MINUTE;
const SITE_ORIGIN = 'https://lanzamet.com';

/**
 * The card is meant to be framed by any website (frame-ancestors *), and
 * nothing else: no script, no outside resource, no form.
 */
const CARD_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors *",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // The card repeats its place's page; only the page belongs in search results.
  'x-robots-tag': 'noindex',
};

const queries = islandQueries(LOCATIONS);

/** One Open-Meteo answer as a list (one entry per point), or null when it can't be had. */
async function answers<T>(service: string, upstream: string): Promise<readonly T[] | null> {
  try {
    const { text } = await sharedOpenMeteo(OPEN_METEO_SERVICES[service], upstream);
    const body = JSON.parse(text) as T | readonly T[];
    return isProviderError(body) ? null : asList(body);
  } catch {
    return null;
  }
}

async function drawCard(id: string, lang: Lang, theme: WidgetTheme): Promise<string> {
  const index = LOCATIONS.findIndex((l) => l.id === id);
  const location = LOCATIONS[index];
  const [forecasts, dust, marine] = await Promise.all([
    answers<ForecastDto>('forecast', queries.forecast),
    answers<AirQualityDto>('air-quality', queries.dust),
    answers<MarineDto>('marine', queries.marine),
  ]);
  const forecast = forecasts?.[index];
  if (!forecast) throw new Error('No forecast for the card');
  const seaPoint = location.coverage.sea;
  const seaIndex = seaPoint ? queries.seaPoints.findIndex((p) => samePoint(p, seaPoint)) : -1;
  const view = widgetView(
    location,
    { forecast, dust: dust?.[index] ?? null, marine: marine?.[seaIndex] ?? null },
    new Date(),
  );
  return widgetHtml(view, lang, theme, SITE_ORIGIN);
}

export async function widget(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  const url = new URL(request.url);
  const id = url.pathname.replace(/\/+$/, '').split('/')[2] ?? '';
  const location = LOCATIONS.find((l) => l.id === id);
  if (!location) {
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
  const lang: Lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es';
  const asked = url.searchParams.get('theme');
  const theme = WIDGET_THEMES.find((t) => t === asked) ?? 'auto';

  try {
    const { text } = await remember(
      `widget|${id}|${lang}|${theme}`,
      { ttlMs: CARD_TTL, staleMs: 50 * MINUTE },
      () => drawCard(id, lang, theme),
    );
    return new Response(request.method === 'HEAD' ? null : text, {
      headers: { ...CARD_HEADERS, 'cache-control': 'public, max-age=300' },
    });
  } catch (error) {
    console.error('[widget]', id, error);
    return new Response(widgetUnavailableHtml(location, lang, theme, SITE_ORIGIN), {
      status: 503,
      headers: { ...CARD_HEADERS, 'cache-control': 'no-store', 'retry-after': '300' },
    });
  }
}

const isWidget = (pathname: string) => /^\/widget\//.test(pathname);

export default {
  fetch: (request: Request, env: Env) =>
    isWidget(new URL(request.url).pathname) ? widget(request) : api.fetch(request, env),
};
