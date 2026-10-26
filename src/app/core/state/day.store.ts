import { computed, inject, Service, signal } from '@angular/core';
import { msg } from '../i18n/i18n.model';
import { dayKind, dayMoment, dayStart } from '../insights/moment.insight';
import { DailyForecast, IsoDate } from '../models';
import { islandDateKey } from '../utils/time';
import { ClockStore } from './clock.store';
import { ForecastStore } from './forecast.store';

/**
 * The day the app is looking at: today, or one of the six after it. Chosen
 * from the hero, the week's list, Zonas or Mar, and the same on every page;
 * kept in memory only, so the app always opens on today. A chosen day that
 * has passed (the app left open overnight) gives way to today.
 */
@Service()
export class DayStore {
  private readonly clock = inject(ClockStore);
  private readonly forecast = inject(ForecastStore);

  private readonly chosen = signal<IsoDate | null>(null);

  readonly today = computed(() => islandDateKey(this.clock.now()));

  /** The days that can be chosen: the week of the place being looked at. */
  readonly days = computed<readonly DailyForecast[]>(
    () => this.forecast.weather().data?.daily ?? [],
  );

  /** The day on screen. */
  readonly day = computed<IsoDate>(() => {
    const chosen = this.chosen();
    const today = this.today();
    if (chosen === null || chosen <= today) return today;
    const days = this.days();
    // While the week is loading the choice stands; once it is known, it must be in it.
    return days.length === 0 || days.some((d) => d.date === chosen) ? chosen : today;
  });

  readonly isToday = computed(() => this.day() === this.today());
  readonly kind = computed(() => dayKind(this.day(), this.today()));

  /** The moment the day is shown at: now for today, midday for a later day. */
  readonly moment = computed(() => dayMoment(this.day(), this.clock.now()));

  /** Where the day's hours begin: now for today, its midnight for a later day. */
  readonly from = computed(() => (this.isToday() ? this.clock.now() : dayStart(this.day())));

  /** The day in a word: "Hoy", "Mañana", "Miércoles". */
  readonly label = computed(() =>
    msg('common.value', { value: { day: this.day(), today: this.today() } }),
  );

  select(day: IsoDate): void {
    this.chosen.set(day <= this.today() ? null : day);
  }

  reset(): void {
    this.chosen.set(null);
  }
}
