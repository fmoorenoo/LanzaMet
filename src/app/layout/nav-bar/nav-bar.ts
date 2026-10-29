import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { delay, filter, map, take } from 'rxjs';
import { DATA_MODE } from '../../core/data/http/data-config';
import { MessageKey } from '../../core/i18n/i18n.model';
import { PageId, readPath } from '../../core/i18n/localized-paths';
import { PathPipe } from '../../core/i18n/path.pipe';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { BrandMark } from '../brand-mark/brand-mark';
import { RouteTransitions } from '../route-transitions';
import { UiStore } from '../ui.store';

interface NavItem {
  /** The page, by its stable English name, also exposed as `data-route`. */
  readonly id: PageId;
  readonly label: MessageKey;
  readonly icon: IconName;
}

/**
 * Bottom tab bar on phones; a vertical rail with the brand on wide screens.
 * One capsule of light marks the current tab and glides to the next one.
 */
@Component({
  selector: 'lm-nav-bar',
  imports: [RouterLink, Icon, BrandMark, TranslatePipe, PathPipe],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly ui = inject(UiStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly router = inject(Router);

  protected readonly items: readonly NavItem[] = [
    { id: 'today', label: 'nav.today', icon: 'today' },
    { id: 'zones', label: 'nav.zones', icon: 'zones' },
    { id: 'sea', label: 'nav.sea', icon: 'sea' },
    { id: 'plans', label: 'nav.plans', icon: 'plans' },
    // "Ayúdanos" (/mejorar) is reached from Settings: a rare action, not a tab.
  ];

  private readonly navigations = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
  );

  private readonly url = toSignal(this.navigations.pipe(map((e) => e.urlAfterRedirects)), {
    initialValue: this.router.url,
  });

  /** Hoy is also each place's weather (/tiempo/:zona); Mar, each place's sea (/mar/:zona). */
  protected readonly activeIndex = computed(() => {
    const address = readPath(this.url());
    const page: PageId | null = !address
      ? null
      : 'view' in address
        ? address.view === 'weather'
          ? 'today'
          : 'sea'
        : address.page;
    return this.items.findIndex((item) => item.id === page);
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
