import { inject, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Lang } from './i18n.model';
import { I18n } from './i18n.store';
import { alternatePath, pagePath } from './localized-paths';

/**
 * The way to the other language: the page on screen at its address in that
 * language (/mar/famara?dia=… ↔ /en/sea/famara?dia=…), or that language's
 * home page where it has no equivalent ("page not found").
 */
@Service()
export class LanguageLinks {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Where the page on screen is in `lang` (reactive). */
  linkTo(lang: Lang): string {
    return alternatePath(this.url(), lang) ?? pagePath('today', lang);
  }

  /** The visitor chose `lang`: remembered, and the page moves to its address in it. */
  switchTo(lang: Lang): void {
    this.i18n.remember(lang);
    if (lang !== this.i18n.lang()) void this.router.navigateByUrl(this.linkTo(lang));
  }
}
