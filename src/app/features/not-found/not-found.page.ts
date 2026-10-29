import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageKey } from '../../core/i18n/i18n.model';
import { PageId } from '../../core/i18n/localized-paths';
import { PathPipe } from '../../core/i18n/path.pipe';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';

interface Way {
  readonly page: PageId;
  readonly label: MessageKey;
  readonly icon: IconName;
}

/** The four tabs, the same words and icons as the navigation. */
const WAYS: readonly Way[] = [
  { page: 'today', label: 'nav.today', icon: 'today' },
  { page: 'zones', label: 'nav.zones', icon: 'zones' },
  { page: 'sea', label: 'nav.sea', icon: 'sea' },
  { page: 'plans', label: 'nav.plans', icon: 'plans' },
];

/**
 * An address the site doesn't have. It says so, instead of showing the home
 * page under a wrong address, and stays out of search results (`noindex` in
 * the route's data, applied by SeoTags).
 */
@Component({
  selector: 'lm-not-found-page',
  host: { id: 'not-found-page', class: 'page not-found-page' },
  imports: [RouterLink, Icon, TranslatePipe, PathPipe],
  template: `
    <header id="not-found-header" class="page-head page-header">
      <h1 class="t-display">{{ 'route.notFound' | t }}</h1>
      <p class="t-lead t-muted lead">{{ 'notFound.lead' | t }}</p>
    </header>

    <nav class="content" aria-labelledby="not-found-next">
      <p id="not-found-next" class="t-muted">{{ 'notFound.next' | t }}</p>
      <ul class="ways" role="list">
        @for (way of ways; track way.page) {
          <li>
            <a
              class="btn btn--quiet way"
              [routerLink]="way.page | path"
              [attr.data-route]="way.page"
            >
              <lm-icon [name]="way.icon" />
              {{ way.label | t }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: var(--s-12);
    }
    .page-head {
      display: grid;
      gap: var(--s-3);
      padding: calc(var(--safe-top) + var(--s-8)) var(--gutter) var(--s-8);
    }
    .lead {
      max-width: 38ch;
    }
    .content {
      display: grid;
      gap: var(--s-3);
      padding: 0 var(--gutter);
    }
    .ways {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 48rem) {
      .page-head,
      .content {
        max-width: 40rem;
        margin-inline: auto;
      }
      .page-head {
        padding-top: var(--s-12);
      }
    }
  `,
})
export class NotFoundPage {
  protected readonly ways = WAYS;
}
