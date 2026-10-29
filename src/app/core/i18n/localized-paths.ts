import { LOCATIONS } from '../data/locations';
import { LocationId } from '../models';
import { Lang } from './i18n.model';

/*
 * Every address on the site, in both languages: Spanish at the root, English
 * under /en with its own words (/zonas → /en/places). Place names stay as
 * they are (/tiempo/famara → /en/weather/famara). This is the only place
 * addresses are written; routes, links, tags and the sitemap read them here.
 */

/** The site's pages, by a stable English name. */
export type PageId =
  'today' | 'zones' | 'sea' | 'plans' | 'wind' | 'about' | 'legal' | 'feedback' | 'widget';

/** Each place has two pages: its weather (as Hoy) and its sea (as Mar). */
export type ZoneView = 'weather' | 'sea';

/** Each page's word in each language; the home page has none. */
export const PAGE_SLUGS: Readonly<Record<PageId, Readonly<Record<Lang, string>>>> = {
  today: { es: '', en: '' },
  zones: { es: 'zonas', en: 'places' },
  sea: { es: 'mar', en: 'sea' },
  plans: { es: 'donde-ir', en: 'where-to-go' },
  wind: { es: 'viento', en: 'wind' },
  about: { es: 'sobre', en: 'about' },
  legal: { es: 'legal', en: 'legal' },
  feedback: { es: 'mejorar', en: 'feedback' },
  // Where the widget is chosen and its code copied. The card itself is
  // /widget/{zona}, served by the Worker (server/worker.ts), in every language.
  widget: { es: 'para-tu-web', en: 'for-your-website' },
};

/** The word before a place's name: /tiempo/famara, /en/weather/famara. */
export const ZONE_VIEW_SLUGS: Readonly<Record<ZoneView, Readonly<Record<Lang, string>>>> = {
  weather: { es: 'tiempo', en: 'weather' },
  sea: { es: 'mar', en: 'sea' },
};

/** The first segment of every English address. Spanish, the default, has none. */
export const EN_PREFIX = 'en';

export const PAGE_IDS = Object.keys(PAGE_SLUGS) as readonly PageId[];
export const ZONE_VIEWS = Object.keys(ZONE_VIEW_SLUGS) as readonly ZoneView[];

/** What an address shows: a page, or one of a place's two pages, in a language. */
export type SiteAddress =
  | { readonly lang: Lang; readonly page: PageId }
  | { readonly lang: Lang; readonly view: ZoneView; readonly zone: LocationId };

const join = (lang: Lang, ...segments: string[]): string =>
  `/${[lang === 'en' ? EN_PREFIX : '', ...segments].filter(Boolean).join('/')}`;

/** "/zonas", "/en/places"; "/" and "/en" for the home page. */
export const pagePath = (page: PageId, lang: Lang): string => join(lang, PAGE_SLUGS[page][lang]);

/** "/tiempo/famara", "/en/sea/famara". */
export const zonePath = (view: ZoneView, id: LocationId, lang: Lang): string =>
  join(lang, ZONE_VIEW_SLUGS[view][lang], id);

export function addressPath(address: SiteAddress): string {
  return 'page' in address
    ? pagePath(address.page, address.lang)
    : zonePath(address.view, address.zone, address.lang);
}

const splitUrl = (url: string): { path: string; rest: string } => {
  const at = url.search(/[?#]/);
  return at === -1 ? { path: url, rest: '' } : { path: url.slice(0, at), rest: url.slice(at) };
};

/** The language an address is in: English under /en, Spanish everywhere else. */
export function langOfPath(url: string): Lang {
  const first = splitUrl(url).path.split('/').filter(Boolean)[0];
  return first === EN_PREFIX ? 'en' : 'es';
}

/** What an address shows, or null when the site has no such page. */
export function readPath(url: string): SiteAddress | null {
  const segments = splitUrl(url).path.split('/').filter(Boolean);
  const lang = langOfPath(url);
  if (lang === 'en') segments.shift();
  if (segments.length === 0) return { lang, page: 'today' };
  if (segments.length === 1) {
    const page = PAGE_IDS.find((p) => p !== 'today' && PAGE_SLUGS[p][lang] === segments[0]);
    return page ? { lang, page } : null;
  }
  if (segments.length === 2) {
    const view = ZONE_VIEWS.find((v) => ZONE_VIEW_SLUGS[v][lang] === segments[0]);
    const zone = LOCATIONS.find((l) => l.id === segments[1]);
    return view && zone ? { lang, view, zone: zone.id } : null;
  }
  return null;
}

/**
 * The same page in another language, keeping the query and the fragment
 * (/mar/famara?dia=2026-10-30 → /en/sea/famara?dia=2026-10-30); null for an
 * address the site doesn't have.
 */
export function alternatePath(url: string, lang: Lang): string | null {
  const address = readPath(url);
  return address ? addressPath({ ...address, lang }) + splitUrl(url).rest : null;
}
