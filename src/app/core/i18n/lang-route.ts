import { inject } from '@angular/core';
import { CanActivateChildFn, RedirectCommand, Router } from '@angular/router';
import { Lang } from './i18n.model';
import { I18n } from './i18n.store';
import { alternatePath } from './localized-paths';

/**
 * The guard on each language's group of routes (app.routes.ts): the page
 * about to be built speaks that language, from its first frame.
 *
 * On arrival only (the visit's first navigation), a visitor who chose the
 * other language in Settings is taken to the same page in it, replacing the
 * address they opened: their choice keeps working on every link and in the
 * installed app, which opens on /. Nobody else is ever moved: not a new
 * visitor, whatever their browser prefers, nor a crawler, which keeps no
 * choice (I18n.remembered).
 */
export const speak =
  (lang: Lang): CanActivateChildFn =>
  (_child, state) => {
    const i18n = inject(I18n);
    const router = inject(Router);
    const chosen = i18n.remembered();
    if (!router.navigated && chosen !== null && chosen !== lang) {
      const there = alternatePath(state.url, chosen);
      if (there) return new RedirectCommand(router.parseUrl(there), { replaceUrl: true });
    }
    i18n.follow(lang);
    return true;
  };
