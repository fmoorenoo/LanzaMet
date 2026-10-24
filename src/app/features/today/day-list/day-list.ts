import { Component, computed, input } from '@angular/core';
import { dayChange, dayPhrase } from '../../../core/insights/week.insight';
import { DailyForecast, IsoDate } from '../../../core/models';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';

/** Seven days, each in a few words — and what changes from the day before. */
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

  protected readonly rows = computed(() => {
    const days = this.days();
    const min = Math.min(...days.map((d) => d.minC));
    const max = Math.max(...days.map((d) => d.maxC));
    const span = Math.max(1, max - min);
    return days.map((day, i) => ({
      date: day.date,
      name: msg('common.value', { value: { day: day.date, today: this.today() } }),
      sky: day.sky,
      phrase: dayPhrase(day),
      change: dayChange(days[i - 1], day),
      min: day.minC,
      max: day.maxC,
      start: ((day.minC - min) / span) * 100,
      size: Math.max(8, ((day.maxC - day.minC) / span) * 100),
    }));
  });
}
