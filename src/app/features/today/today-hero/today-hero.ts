import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
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
import { ShareWeather } from '../share/share-weather';
import { WeatherCard } from '../share/weather-card';

export interface HeroView {
  readonly scene: SceneState;
  readonly temperature: number;
  /** The day's forecast high and low, °C. */
  readonly range: { readonly max: number; readonly min: number };
  readonly verdict: Verdict;
  readonly momentLabel: Msg;
  /** The moment drawn: now, or the hour chosen in the forecast, with its day ("Hoy"). */
  readonly moment: { readonly at: Date; readonly day: Msg };
}

/**
 * The answer, before anything else: the day drawn as a scene, then the
 * temperature, the verdict and one sentence. Place switching lives here too,
 * so changing place happens where its effect is seen.
 */
@Component({
  selector: 'qth-today-hero',
  imports: [
    Scene,
    Icon,
    StatusMessage,
    HorizontalScroll,
    ScrollControls,
    Tooltip,
    ShareWeather,
    TranslatePipe,
  ],
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
  /** What the share button sends: the card for the place and moment on screen. */
  readonly share = input<WeatherCard | null>(null);

  readonly backToNow = output<void>();
  readonly retry = output<void>();

  protected readonly ui = inject(UiStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly locations = inject(LocationsStore);
  private readonly clock = inject(ClockStore);
  private readonly placeButton = viewChild.required<ElementRef<HTMLButtonElement>>('placeButton');
  private readonly clockTime = viewChild.required<ElementRef<HTMLElement>>('clockTime');

  protected readonly current = this.locations.selected;
  protected readonly placeName = computed(() => this.current()?.name ?? '');

  /**
   * The time of what the scene is drawing, in the island's time, which every
   * time in the app is given in: now, or the hour being previewed, labelled
   * with its day. A visitor whose own clock reads differently is told whose
   * time it is.
   */
  protected readonly time = computed(() => {
    const now = this.clock.now();
    const preview = this.isPreview() ? this.view()?.moment : undefined;
    const at = preview?.at ?? now;
    return {
      iso: at.toISOString(),
      text: formatTime(at),
      day: preview?.day ?? null,
      elsewhere: -now.getTimezoneOffset() !== islandOffsetMinutes(now),
    };
  });

  constructor() {
    // A new time (another hour chosen, the minute turning) settles in from a
    // soft blur instead of flicking over; the first one is simply there.
    let shown: string | null = null;
    afterRenderEffect(() => {
      const text = this.time().text;
      if (shown !== null && text !== shown) {
        this.clockTime().nativeElement.animate(
          [
            { opacity: 0.3, filter: 'blur(2px)' },
            { opacity: 1, filter: 'blur(0)' },
          ],
          { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
      }
      shown = text;
    });
  }

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
