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
import { LocationId, Wind } from '../../../core/models';
import { ClockStore } from '../../../core/state/clock.store';
import { LocationsStore } from '../../../core/state/locations.store';
import { formatTime, islandOffsetMinutes } from '../../../core/utils/time';
import { UiStore } from '../../../layout/ui.store';
import { Scene } from '../../../shared/scene/scene';
import { SceneState } from '../../../shared/scene/scene-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { StatusMessage } from '../../../shared/ui/status-message/status-message';
import { Tooltip } from '../../../shared/ui/tooltip/tooltip';
import { WindGauge } from '../../../shared/ui/wind-gauge/wind-gauge';
import { ShareWeather } from '../share/share-weather';
import { WeatherCard } from '../share/weather-card';

export interface HeroView {
  readonly scene: SceneState;
  readonly temperature: number;
  /** The sky in a few words: "Sol entre nubes". */
  readonly condition: Msg;
  readonly wind: Wind;
  /** The day's forecast high and low, °C. */
  readonly range: { readonly max: number; readonly min: number };
  readonly verdict: Verdict;
  readonly momentLabel: Msg;
  /** The moment drawn: now, or the hour chosen in the forecast, with its day ("Hoy"). */
  readonly moment: { readonly at: Date; readonly day: Msg };
  /**
   * The sun's next move from that moment ("Atardece a las 18:15, en 3 h 30 min"):
   * stands in for the verdict's sentence when it would only repeat the sky and the wind.
   */
  readonly sunLine: Msg | null;
}

/** A swipe: far enough, or quick enough, and more across than down. */
const SWIPE_MIN_PX = 56;
const SWIPE_FLICK_PX_PER_MS = 0.35;
const SWIPE_SLOPE = 1.4;

/**
 * The answer, before anything else, in the order it is read: where (the
 * place, large), how warm, what the sky is doing, how the wind blows, and
 * then the verdict in words, all over the day drawn as a scene. Changing
 * place happens here too, where its effect is seen: the name opens the
 * picker (favourites first), and a swipe across the scene moves to the next
 * or previous favourite.
 */
@Component({
  selector: 'lm-today-hero',
  imports: [Scene, Icon, StatusMessage, Tooltip, ShareWeather, WindGauge, TranslatePipe],
  templateUrl: './today-hero.html',
  styleUrl: './today-hero.scss',
  host: {
    id: 'weather-hero',
    class: 'weather-hero',
    role: 'region',
    'aria-labelledby': 'weather-verdict',
    '[class.is-ink-dark]': "view()?.scene?.ink === 'dark'",
    // Nothing to draw and a reason why: the scene gives up its height to the page.
    '[class.is-failed]': '!view() && !!error()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'swipe = null',
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
  private readonly copyWrap = viewChild.required<ElementRef<HTMLElement>>('copyWrap');

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

  /**
   * The verdict's sentence, unless it only repeats what the hero already
   * shows above it (the sky and the wind in the place); then the sun's next
   * move takes its line, so the space under the verdict always says something.
   */
  protected readonly sentence = computed(() => {
    const view = this.view();
    const sentence = view?.verdict.sentence;
    return sentence && sentence.key !== 'verdict.plain' ? sentence : (view?.sunLine ?? null);
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

  /**
   * The places a swipe moves through: the favourites in their order, and the
   * place on screen at the end when it is not one of them.
   */
  private readonly pages = computed(() => {
    const current = this.current();
    const list = this.locations.favorites().map((l) => ({ id: l.id, name: l.name, saved: true }));
    if (current && !list.some((p) => p.id === current.id)) {
      list.push({ id: current.id, name: current.name, saved: false });
    }
    return list.map((p, index) => ({ ...p, index, current: p.id === current?.id }));
  });

  protected readonly isFavorite = computed(() => {
    const id = this.current()?.id;
    return id ? this.locations.isFavorite(id) : false;
  });

  protected toggleFavorite(): void {
    const id = this.current()?.id;
    if (id) this.locations.toggleFavorite(id);
  }

  /** Another place; the words slide in from the side it lies on among the favourites. */
  private selectPlace(id: LocationId, index: number): void {
    const from = this.pages().findIndex((p) => p.current);
    if (id === this.current()?.id) return;
    this.locations.select(id);
    this.arrive(index > from ? 1 : -1);
  }

  /** The reset button goes away with the preview; focus moves to the place, not to the page. */
  protected resetToNow(): void {
    this.backToNow.emit();
    this.placeButton().nativeElement.focus();
  }

  // ── Swiping between favourites ───────────────────────────────
  // Touch and pen only (a mouse has the picker), never from a control,
  // and only across: `touch-action: pan-y` leaves vertical scrolling to the page.
  protected swipe: { x: number; y: number; t: number; id: number } | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || this.pages().length < 2) return;
    if ((event.target as Element | null)?.closest('button, a, input, dialog')) return;
    this.swipe = { x: event.clientX, y: event.clientY, t: event.timeStamp, id: event.pointerId };
  }

  protected onPointerUp(event: PointerEvent): void {
    const start = this.swipe;
    this.swipe = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const quick = Math.abs(dx) / Math.max(1, event.timeStamp - start.t) > SWIPE_FLICK_PX_PER_MS;
    if (Math.abs(dx) < SWIPE_SLOPE * Math.abs(dy)) return;
    if (Math.abs(dx) < SWIPE_MIN_PX && !(quick && Math.abs(dx) > 24)) return;
    const pages = this.pages();
    const from = pages.findIndex((p) => p.current);
    const next = pages[from + (dx < 0 ? 1 : -1)];
    if (next) this.selectPlace(next.id, next.index);
  }

  /** The new place's words come in from `direction` (1: from the right), quickly. */
  private arrive(direction: 1 | -1): void {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.copyWrap().nativeElement.animate(
      reduce
        ? [{ opacity: 0.4 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: `translate3d(${direction * 1.75}rem, 0, 0)` },
            { opacity: 1, transform: 'none' },
          ],
      { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  }
}
