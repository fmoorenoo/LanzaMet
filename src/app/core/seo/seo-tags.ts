import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Lang, MessageKey, msg } from '../i18n/i18n.model';
import { Location } from '../models';
import { zoneArea, zoneOfState } from '../state/zone-navigation';
import { I18n } from '../i18n/i18n.store';
import { translate } from '../i18n/translate';
import { SHARE_CONFIG } from '../share/share-config';
import { jsonLd, structuredData } from './structured-data';

/** The site's one public address, when the build doesn't name it (`PUBLIC_URL`). */
export const SITE_ORIGIN = 'https://lanzamet.com';

/** Preview images for links (public/og/*.jpg), 1200 × 630, one per section. */
export type OgImage = 'home' | 'zones' | 'sea' | 'plans' | 'wind' | 'about';

/** What a route tells search engines about itself, in its `data`. */
export interface SeoRouteData {
  /** The page's own summary; the site's general one when absent. */
  readonly description?: MessageKey;
  /** Kept out of search results (the "page not found" view). */
  readonly noindex?: boolean;
  /** The page's short name in breadcrumbs (none for the home page); a place's page uses the place's name. */
  readonly crumb?: MessageKey;
  /** The page a place's page hangs from in breadcrumbs: Zonas for its weather, Mar for its sea. */
  readonly parent?: { readonly label: MessageKey; readonly path: string };
  /** The picture shown when the page is shared; the home page's by default. */
  readonly image?: OgImage;
  /** The About page describes the site itself (schema.org AboutPage). */
  readonly about?: boolean;
}

/** The page's own address: always the public domain, without query, fragment or trailing slash. */
export function canonicalUrl(origin: string, url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return origin + (path || '/');
}

const OG_LOCALE: Readonly<Record<Lang, string>> = { es: 'es_ES', en: 'en_GB' };
const LD_ID = 'structured-data';

interface Page {
  readonly url: string;
  readonly data: SeoRouteData;
  /** The route's title, a message key (see app.routes.ts). */
  readonly title: MessageKey | null;
  /** The place the address names (/tiempo/famara), if any. */
  readonly zone: Location | null;
}

/**
 * Tags that tell search engines and link previews about each page: its
 * description, canonical address and `noindex` where it must not be listed;
 * Open Graph and Twitter tags for previews in WhatsApp and social networks;
 * and schema.org data (JSON-LD). All of it in the language on screen,
 * following every navigation, and written into prerendered pages too.
 */
@Service()
export class SeoTags {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);
  private readonly origin = inject(SHARE_CONFIG).publicUrl ?? SITE_ORIGIN;

  private readonly page = signal<Page | null>(null);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.page.set({ url: event.urlAfterRedirects, ...this.route() }));

    effect(() => {
      const page = this.page();
      if (page) this.apply(page, this.i18n.lang());
    });
  }

  private route(): Omit<Page, 'url'> {
    const state = this.router.routerState.snapshot;
    let route = state.root;
    while (route.firstChild) route = route.firstChild;
    const title = route.routeConfig?.title;
    return {
      data: route.data as SeoRouteData,
      title: typeof title === 'string' ? (title as MessageKey) : null,
      zone: zoneOfState(state),
    };
  }

  private apply({ url, data, title, zone }: Page, lang: Lang): void {
    // A place's page says its name (and municipality) in its title and description.
    const params = zone ? { place: zone.name, area: zoneArea(zone) } : undefined;
    const description = translate(msg(data.description ?? 'app.description', params), lang);
    this.meta.updateTag({ name: 'description', content: description });

    const noindex = data.noindex === true;
    if (noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag("name='robots'");
    }
    // A page kept out of the index names no canonical address and no structured data.
    const canonical = noindex ? null : canonicalUrl(this.origin, url);
    this.setCanonical(canonical);

    const name = translate(msg(title ?? 'app.brand', params), lang);
    const last = zone?.name ?? (data.crumb ? translate(data.crumb, lang) : null);
    const crumbs = [
      ...(data.parent
        ? [{ name: translate(data.parent.label, lang), url: this.origin + data.parent.path }]
        : []),
      ...(last && canonical ? [{ name: last, url: canonical }] : []),
    ];
    this.setPreview(name, description, canonical, data.image ?? 'home', lang);
    this.setStructuredData(
      canonical === null
        ? null
        : structuredData({
            origin: this.origin,
            url: canonical,
            name,
            description,
            lang,
            crumbs,
            place: zone && {
              name: zone.name,
              municipality: zone.municipality,
              latitude: zone.position.latitude,
              longitude: zone.position.longitude,
            },
            home: translate('seo.crumb.home', lang),
            type: data.about ? 'AboutPage' : 'WebPage',
          }),
    );
  }

  /** Open Graph (WhatsApp, Facebook, LinkedIn, Telegram…) and Twitter / X cards. */
  private setPreview(
    title: string,
    description: string,
    url: string | null,
    image: OgImage,
    lang: Lang,
  ): void {
    const other: Lang = lang === 'es' ? 'en' : 'es';
    const imageUrl = `${this.origin}/og/${image}.jpg`;
    const tags: Record<string, string> = {
      'og:type': 'website',
      'og:site_name': 'LanzaMet',
      'og:title': title,
      'og:description': description,
      'og:url': url ?? `${this.origin}/`,
      'og:locale': OG_LOCALE[lang],
      'og:locale:alternate': OG_LOCALE[other],
      'og:image': imageUrl,
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': title,
    };
    for (const [property, content] of Object.entries(tags)) {
      this.meta.updateTag({ property, content });
    }
    const card: Record<string, string> = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': imageUrl,
      'twitter:image:alt': title,
    };
    for (const [name, content] of Object.entries(card)) {
      this.meta.updateTag({ name, content });
    }
  }

  private setStructuredData(data: object | null): void {
    let script = this.document.getElementById(LD_ID);
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('id', LD_ID);
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = jsonLd(data);
  }

  private setCanonical(href: string | null): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    // Attributes rather than properties: the same code writes prerendered pages.
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
