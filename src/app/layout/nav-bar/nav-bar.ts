import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { delay, filter, map, take } from 'rxjs';
import { DATA_MODE } from '../../core/data/http/data-config';
import { MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { BrandMark } from '../brand-mark/brand-mark';
import { RouteTransitions } from '../route-transitions';
import { UiStore } from '../ui.store';

interface NavItem {
  /** Stable English name for the route, exposed as `data-route`. */
  readonly id: string;
  readonly path: string;
  readonly label: MessageKey;
  readonly icon: IconName;
}

/**
 * Bottom tab bar on phones; a vertical rail with the brand on wide screens.
 * One capsule of light marks the current tab and glides to the next one.
 */
@Component({
  selector: 'qth-nav-bar',
  imports: [RouterLink, RouterLinkActive, Icon, BrandMark, TranslatePipe],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly ui = inject(UiStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly router = inject(Router);

  protected readonly items: readonly NavItem[] = [
    { id: 'today', path: '/', label: 'nav.today', icon: 'today' },
    { id: 'zones', path: '/zonas', label: 'nav.zones', icon: 'zones' },
    { id: 'sea', path: '/mar', label: 'nav.sea', icon: 'sea' },
    { id: 'plans', path: '/donde-ir', label: 'nav.plans', icon: 'plans' },
    { id: 'feedback', path: '/mejorar', label: 'nav.feedback', icon: 'feedback' },
  ];

  private readonly navigations = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
  );

  private readonly url = toSignal(this.navigations.pipe(map((e) => e.urlAfterRedirects)), {
    initialValue: this.router.url,
  });

  protected readonly activeIndex = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    return this.items.findIndex((item) =>
      item.path === '/' ? path === '/' : path.startsWith(item.path),
    );
  });

  /**
   * Where the capsule sits. It follows the active tab once the page change
   * is on screen, so the glide is seen instead of happening behind a frozen frame.
   */
  protected readonly capsuleIndex = signal(-1);

  /** The capsule only glides once the first page is in place — never on arrival. */
  protected readonly canGlide = signal(false);

  constructor() {
    const transitions = inject(RouteTransitions);
    effect(() => {
      const index = this.activeIndex();
      untracked(() => transitions.whenVisible(() => this.capsuleIndex.set(index)));
    });

    this.navigations
      .pipe(take(1), delay(120), takeUntilDestroyed())
      .subscribe(() => this.canGlide.set(true));
  }
}
