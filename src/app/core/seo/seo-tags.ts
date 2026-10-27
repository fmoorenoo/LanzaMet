import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MessageKey } from '../i18n/i18n.model';
import { I18n } from '../i18n/i18n.store';
import { translate } from '../i18n/translate';
import { SHARE_CONFIG } from '../share/share-config';

/** The site's one public address, when the build doesn't name it (`PUBLIC_URL`). */
export const SITE_ORIGIN = 'https://lanzamet.com';

/** What a route tells search engines about itself, in its `data`. */
export interface SeoRouteData {
  /** The page's own summary; the site's general one when absent. */
  readonly description?: MessageKey;
  /** Kept out of search results (the "page not found" view). */
  readonly noindex?: boolean;
}

/** The page's own address: always the public domain, without query, fragment or trailing slash. */
export function canonicalUrl(origin: string, url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return origin + (path || '/');
}

interface Page {
  readonly url: string;
  readonly data: SeoRouteData;
}

/**
 * Tags that tell search engines how to treat each page: its description (in
 * the language on screen), its canonical address, and `noindex` where the
 * page must not be listed. They follow every navigation, so they always
 * describe the page on screen, and they are written into prerendered pages too.
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
      .subscribe((event) => this.page.set({ url: event.urlAfterRedirects, data: this.data() }));

    effect(() => {
      const page = this.page();
      if (page) this.apply(page, this.i18n.lang());
    });
  }

  private data(): SeoRouteData {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return route.data as SeoRouteData;
  }

  private apply({ url, data }: Page, lang: ReturnType<I18n['lang']>): void {
    this.meta.updateTag({
      name: 'description',
      content: translate(data.description ?? 'app.description', lang),
    });

    const noindex = data.noindex === true;
    if (noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag("name='robots'");
    }
    // A page kept out of the index names no canonical address.
    this.setCanonical(noindex ? null : canonicalUrl(this.origin, url));
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
