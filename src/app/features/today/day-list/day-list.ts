import { Component, computed, input, output } from '@angular/core';
import { dayChange, dayPhrase } from '../../../core/insights/week.insight';
import { windHue, windTint } from '../../../core/insights/wind.insight';
import { DailyForecast, IsoDate } from '../../../core/models';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';

/**
 * Seven days, each in a few words — and what changes from the day before —
 * with the day's average wind in the colours of the hours, then its high and low.
 * Each day opens itself at the top of the page; the one on screen is marked.
 */
@Component({
  selector: 'lm-day-list',
  imports: [SkyGlyph, TranslatePipe],
  templateUrl: './day-list.html',
  styleUrl: './day-list.scss',
  host: { class: 'daily-forecast-list' },
})
export class DayList {
  readonly days = input.required<readonly DailyForecast[]>();
  readonly today = input.required<IsoDate>();
  /** The day on screen. */
  readonly selected = input<IsoDate | null>(null);
  readonly choose = output<IsoDate>();

  protected readonly rows = computed(() => {
    const days = this.days();
    return days.map((day, i) => ({
      date: day.date,
      name: msg('common.value', { value: { day: day.date, today: this.today() } }),
      sky: day.sky,
      phrase: dayPhrase(day),
      change: dayChange(days[i - 1], day),
      wind: day.meanWindKmh,
      windHue: windHue(day.meanWindKmh),
      windTint: windTint(day.meanWindKmh),
      // The arrow points where the day's wind mostly goes.
      windTo: `${(day.windFromDegrees + 180) % 360}deg`,
      min: day.minC,
      max: day.maxC,
      isSelected: day.date === this.selected(),
    }));
  });
}
