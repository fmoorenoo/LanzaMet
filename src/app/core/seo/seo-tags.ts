import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SHARE_CONFIG } from '../share/share-config';

/** The site's one public address, when the build doesn't name it (`PUBLIC_URL`). */
export const SITE_ORIGIN = 'https://lanzamet.com';

/** Route data that keeps a page out of search results (the "page not found" view). */
export interface SeoRouteData {
  readonly noindex?: boolean;
}

/** The page's own address: always the public domain, without query, fragment or trailing slash. */
export function canonicalUrl(origin: string, url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return origin + (path || '/');
}

/**
 * Tags that tell search engines how to treat each page: its canonical
 * address, and `noindex` where the page must not be listed. They follow every
 * navigation, so they always describe the page on screen.
 */
@Service()
export class SeoTags {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly origin = inject(SHARE_CONFIG).publicUrl ?? SITE_ORIGIN;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.update(event.urlAfterRedirects));
  }

  private update(url: string): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const noindex = (route.data as SeoRouteData).noindex === true;

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
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
