import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { skyPhrase } from '../../../core/insights/sky.insight';
import { readWind, windHue, windTint } from '../../../core/insights/wind.insight';
import { WeatherSnapshot } from '../../../core/models';
import { msg } from '../../../core/i18n/i18n.model';
import { hourLabel } from '../../../core/i18n/phrases';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { islandDateKey, toDate } from '../../../core/utils/time';
import { HorizontalScroll } from '../../../shared/ui/horizontal-scroll/horizontal-scroll';
import { ScrollControls } from '../../../shared/ui/horizontal-scroll/scroll-controls';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';

/**
 * The next 24 hours, or the 24 hours of a later day: the time, the sky and the temperature, and the wind
 * underneath as its direction and speed, tinted by strength (green when
 * light, through orange, to red when strong), so a glance along the strip
 * shows how the wind will change. Choosing an hour previews it in the scene
 * above; arrow keys walk the hours. Today the strip starts at "Ahora"; a
 * later day rests on its midday, which the scene shows until another hour is chosen.
 */
@Component({
  selector: 'lm-hour-timeline',
  imports: [SkyGlyph, HorizontalScroll, ScrollControls, TranslatePipe],
  templateUrl: './hour-timeline.html',
  styleUrl: './hour-timeline.scss',
  host: { class: 'hour-timeline' },
})
export class HourTimeline {
  readonly hours = input.required<readonly WeatherSnapshot[]>();
  /** The first hour is now (today), rather than one hour of a later day. */
  readonly live = input(true);
  /** The hour the strip rests on when none is chosen: now, or a later day's midday. */
  readonly restIndex = input(0);
  /** Index of the previewed hour; null means the resting one. */
  readonly selected = model<number | null>(null);

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('cell');
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scrollEl');

  protected readonly cells = computed(() =>
    this.hours().map((hour, i, all) => {
      const date = toDate(hour.time);
      const newDay = i > 0 && islandDateKey(date) !== islandDateKey(toDate(all[i - 1].time));
      const wind = readWind(hour.wind);
      return {
        index: i,
        time: hour.time,
        label: i === 0 && this.live() ? msg('common.now') : hourLabel(date),
        dayMark: newDay ? msg('common.value', { value: { weekday: date, style: 'short' } }) : null,
        temperature: Math.round(hour.temperatureC),
        sky: hour.sky,
        isDaylight: hour.isDaylight,
        windLevel: wind.level,
        windSpeed: Math.round(hour.wind.speedKmh),
        windHue: windHue(hour.wind.speedKmh),
        windTint: windTint(hour.wind.speedKmh),
        // The arrow points where the wind goes.
        windTo: `${(hour.wind.fromDegrees + 180) % 360}deg`,
        detail: msg('hours.cellDetail', {
          sky: skyPhrase(hour.sky, hour.isDaylight),
          wind: wind.labelFrom,
        }),
      };
    }),
  );

  protected readonly activeIndex = computed(() => this.selected() ?? this.restIndex());
  protected readonly isPreview = computed(() => this.selected() !== null);

  /** Today it goes back to now; a later day, to the hour it rests on. */
  protected readonly backLabel = computed(() => {
    const rest = this.hours()[this.restIndex()];
    return this.live() || !rest
      ? msg('common.backToNow')
      : msg('hours.backTo', { time: { time: rest.time } });
  });

  protected readonly groupLabel = computed(() =>
    msg(this.live() ? 'hours.label' : 'hours.labelDay'),
  );

  constructor() {
    // Another day's hours: the strip moves to the hour it rests on, without
    // taking focus or scrolling the page.
    let shownDay: string | null = null;
    afterRenderEffect(() => {
      const index = this.restIndex();
      const rest = this.hours()[index];
      const day = rest ? `${this.live()}|${islandDateKey(toDate(rest.time))}` : null;
      if (day === shownDay) return;
      shownDay = day;
      const button = this.buttons()[index]?.nativeElement;
      const scroller = this.scroller().nativeElement;
      if (!button) return;
      scroller.scrollLeft = button.offsetLeft - (scroller.clientWidth - button.offsetWidth) / 2;
    });
  }

  protected choose(index: number): void {
    this.selected.set(index === this.restIndex() ? null : index);
  }

  /** Back to the resting hour: chosen, shown and focused, as the button fades out. */
  protected backToNow(): void {
    const rest = this.restIndex();
    this.choose(rest);
    this.reveal(rest, true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = this.hours().length - 1;
    const current = this.activeIndex();
    const next =
      event.key === 'ArrowRight'
        ? Math.min(last, current + 1)
        : event.key === 'ArrowLeft'
          ? Math.max(0, current - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    this.choose(next);
    this.reveal(next);
  }

  /**
   * Focuses an hour and brings it into view. Keys step through the hours
   * many times in a row, so they move instantly; only a one-off jump glides.
   */
  private reveal(index: number, glide = false): void {
    const button = this.buttons()[index]?.nativeElement;
    if (!button) return;
    button.focus({ preventScroll: true });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    button.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: glide && !reduce ? 'smooth' : 'auto',
    });
  }
}
