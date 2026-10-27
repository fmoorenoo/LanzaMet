import { Lang } from '../i18n/i18n.model';

/**
 * Schema.org data for search engines (JSON-LD). It names what Google and
 * other systems can't guess from the page: that LanzaMet is a site about
 * Lanzarote, who makes it, and where each page sits. Only facts the site
 * itself states (see /sobre); nothing about ratings or reviews.
 *
 * Google gives no rich result for weather pages: this is for understanding
 * (the site's name and logo, the entity behind it, breadcrumbs), not looks.
 */

export interface PageFacts {
  /** The site's public origin, e.g. https://lanzamet.com */
  readonly origin: string;
  /** The page's canonical address. */
  readonly url: string;
  /** The page's own title, without the brand. */
  readonly name: string;
  readonly description: string;
  readonly lang: Lang;
  /** The way from the home page to this one, the page last; empty on the home page. */
  readonly crumbs: readonly { readonly name: string; readonly url: string }[];
  /** The place a place's page is about (/tiempo/famara); the island otherwise. */
  readonly place: ZonePlace | null;
  /** The home page's short name ("Inicio"). */
  readonly home: string;
  /** Schema.org type of the page: the About page describes the site itself. */
  readonly type: 'WebPage' | 'AboutPage';
}

export interface ZonePlace {
  readonly name: string;
  readonly municipality: string;
  readonly latitude: number;
  readonly longitude: number;
}

const LANZAROTE = {
  '@type': 'Place',
  name: 'Lanzarote',
  sameAs: ['https://es.wikipedia.org/wiki/Lanzarote', 'https://en.wikipedia.org/wiki/Lanzarote'],
} as const;

export function structuredData(page: PageFacts): object {
  const id = (fragment: string) => `${page.origin}/#${fragment}`;
  const inLanguage = page.lang === 'es' ? 'es-ES' : 'en-GB';

  const webPage: Record<string, unknown> = {
    '@type': page.type,
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: page.name,
    description: page.description,
    inLanguage,
    isPartOf: { '@id': id('website') },
    about:
      page.type === 'AboutPage'
        ? { '@id': id('organization') }
        : page.place
          ? zonePlace(page.place)
          : LANZAROTE,
  };
  if (page.crumbs.length > 0) {
    const way = [{ name: page.home, url: `${page.origin}/` }, ...page.crumbs];
    webPage['breadcrumb'] = {
      '@type': 'BreadcrumbList',
      itemListElement: way.map((step, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: step.name,
        item: step.url,
      })),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id('website'),
        url: `${page.origin}/`,
        name: 'LanzaMet',
        inLanguage,
        publisher: { '@id': id('organization') },
      },
      {
        '@type': 'Organization',
        '@id': id('organization'),
        name: 'LanzaMet',
        url: `${page.origin}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${page.origin}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        founder: { '@id': id('founder') },
        areaServed: LANZAROTE,
      },
      {
        '@type': 'Person',
        '@id': id('founder'),
        name: 'Fernando Montelongo',
        sameAs: ['https://www.linkedin.com/in/fernando-montelongo/'],
        memberOf: {
          '@type': 'Organization',
          name: 'Kora Digital Solutions',
          url: 'https://koradigitalsolutions.com',
        },
      },
      webPage,
    ],
  };
}

/** A place on the island: where it is, in which municipality, on Lanzarote. */
function zonePlace(place: ZonePlace): object {
  return {
    '@type': 'Place',
    name: place.name,
    geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: place.municipality,
      containedInPlace: LANZAROTE,
    },
  };
}

/** JSON-LD text safe inside a <script> element ("<" can't close it). */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
