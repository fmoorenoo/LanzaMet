import { Component, computed, ElementRef, inject, input, model, viewChildren } from '@angular/core';
import { skyPhrase } from '../../../core/insights/sky.insight';
import { readWind } from '../../../core/insights/wind.insight';
import { WeatherSnapshot } from '../../../core/models';
import { msg } from '../../../core/i18n/i18n.model';
import { I18n } from '../../../core/i18n/i18n.store';
import { hourLabel } from '../../../core/i18n/phrases';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { islandDateKey, toDate } from '../../../core/utils/time';
import { HorizontalScroll } from '../../../shared/ui/horizontal-scroll/horizontal-scroll';
import { ScrollControls } from '../../../shared/ui/horizontal-scroll/scroll-controls';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';

const CELL = 56;
const CURVE_TOP = 22;
const CURVE_RANGE = 26;

/**
 * The next 24 hours as a landscape of temperature, with the wind underneath.
 * Choosing an hour previews it in the scene above; arrow keys walk the hours.
 */
@Component({
  selector: 'qth-hour-timeline',
  imports: [SkyGlyph, HorizontalScroll, ScrollControls, TranslatePipe],
  templateUrl: './hour-timeline.html',
  styleUrl: './hour-timeline.scss',
  host: { class: 'hour-timeline' },
})
export class HourTimeline {
  readonly hours = input.required<readonly WeatherSnapshot[]>();
  /** Index of the previewed hour; null means "now". */
  readonly selected = model<number | null>(null);

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('cell');
  private readonly i18n = inject(I18n);

  private readonly range = computed(() => {
    const temps = this.hours().map((h) => h.temperatureC);
    return { min: Math.min(...temps), max: Math.max(...temps) };
  });

  private y(temperature: number): number {
    const { min, max } = this.range();
    const t = max === min ? 0.5 : (temperature - min) / (max - min);
    return CURVE_TOP + (1 - t) * CURVE_RANGE;
  }

  protected readonly cells = computed(() =>
    this.hours().map((hour, i, all) => {
      const date = toDate(hour.time);
      const newDay = i > 0 && islandDateKey(date) !== islandDateKey(toDate(all[i - 1].time));
      const wind = readWind(hour.wind);
      const temperature = Math.round(hour.temperatureC);
      return {
        index: i,
        time: hour.time,
        label: i === 0 ? msg('common.now') : hourLabel(date),
        dayMark: newDay ? msg('common.value', { value: { weekday: date, style: 'short' } }) : null,
        temperature,
        sky: hour.sky,
        isDaylight: hour.isDaylight,
        windLevel: wind.level,
        windScale: 0.2 + wind.strength * 0.8,
        y: this.y(hour.temperatureC),
        ariaLabel: this.i18n.t('hours.cell', {
          time: i === 0 ? msg('common.now') : { time: date },
          sky: skyPhrase(hour.sky, hour.isDaylight),
          temp: temperature,
          wind: wind.phrase,
        }),
      };
    }),
  );

  protected readonly width = computed(() => this.hours().length * CELL);

  protected readonly curve = computed(() =>
    this.cells()
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.index * CELL + CELL / 2} ${c.y.toFixed(1)}`)
      .join(''),
  );

  protected readonly activeIndex = computed(() => this.selected() ?? 0);

  protected choose(index: number): void {
    this.selected.set(index === 0 ? null : index);
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
    const button = this.buttons()[next]?.nativeElement;
    button?.focus();
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
