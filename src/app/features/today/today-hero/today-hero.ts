import { Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { DATA_MODE } from '../../../core/data/http/data-config';
import { Msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { Verdict } from '../../../core/insights/verdict.insight';
import { LocationId } from '../../../core/models';
import { ClockStore } from '../../../core/state/clock.store';
import { LocationsStore } from '../../../core/state/locations.store';
import { formatTime, islandOffsetMinutes } from '../../../core/utils/time';
import { UiStore } from '../../../layout/ui.store';
import { Scene } from '../../../shared/scene/scene';
import { SceneState } from '../../../shared/scene/scene-state';
import { HorizontalScroll } from '../../../shared/ui/horizontal-scroll/horizontal-scroll';
import { ScrollControls } from '../../../shared/ui/horizontal-scroll/scroll-controls';
import { Icon } from '../../../shared/ui/icon/icon';
import { StatusMessage } from '../../../shared/ui/status-message/status-message';
import { Tooltip } from '../../../shared/ui/tooltip/tooltip';

export interface HeroView {
  readonly scene: SceneState;
  readonly temperature: number;
  /** The day's forecast high and low, °C. */
  readonly range: { readonly max: number; readonly min: number };
  readonly verdict: Verdict;
  readonly momentLabel: Msg;
}

/**
 * The answer, before anything else: the day drawn as a scene, then the
 * temperature, the verdict and one sentence. Place switching lives here too,
 * so changing place happens where its effect is seen.
 */
@Component({
  selector: 'qth-today-hero',
  imports: [Scene, Icon, StatusMessage, HorizontalScroll, ScrollControls, Tooltip, TranslatePipe],
  templateUrl: './today-hero.html',
  styleUrl: './today-hero.scss',
  host: {
    id: 'weather-hero',
    class: 'weather-hero',
    role: 'region',
    'aria-labelledby': 'weather-verdict',
    '[class.is-ink-dark]': "view()?.scene?.ink === 'dark'",
  },
})
export class TodayHero {
  readonly view = input<HeroView | null>(null);
  /** A newer request is in flight: the words soften until it lands. */
  readonly pending = input(false);
  /** Set when there is nothing to show because loading failed. */
  readonly error = input<Msg | null>(null);
  readonly isPreview = input(false);

  readonly backToNow = output<void>();
  readonly retry = output<void>();

  protected readonly ui = inject(UiStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly locations = inject(LocationsStore);
  private readonly clock = inject(ClockStore);
  private readonly placeButton = viewChild.required<ElementRef<HTMLButtonElement>>('placeButton');

  protected readonly current = this.locations.selected;
  protected readonly placeName = computed(() => this.current()?.name ?? '');

  /**
   * The island's time, which every time in the app is given in. A visitor
   * whose own clock reads differently is told whose time it is.
   */
  protected readonly time = computed(() => {
    const now = this.clock.now();
    return {
      iso: now.toISOString(),
      text: formatTime(now),
      elsewhere: -now.getTimezoneOffset() !== islandOffsetMinutes(now),
    };
  });

  /** Favourites to hop between without opening the picker. */
  protected readonly others = computed(() =>
    this.locations.favorites().filter((l) => l.id !== this.current()?.id),
  );

  protected readonly isFavorite = computed(() => {
    const id = this.current()?.id;
    return id ? this.locations.isFavorite(id) : false;
  });

  protected toggleFavorite(): void {
    const id = this.current()?.id;
    if (id) this.locations.toggleFavorite(id);
  }

  protected selectPlace(id: LocationId): void {
    this.locations.select(id);
  }

  /** The reset button goes away with the preview; focus moves to the place, not to the page. */
  protected resetToNow(): void {
    this.backToNow.emit();
    this.placeButton().nativeElement.focus();
  }
}
