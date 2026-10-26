import { Component, computed, inject } from '@angular/core';
import { msg } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { dayPhrase } from '../../core/insights/week.insight';
import { IsoDate } from '../../core/models';
import { DayStore } from '../../core/state/day.store';
import { Icon } from '../../shared/ui/icon/icon';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { SkyGlyph } from '../../shared/ui/sky-glyph/sky-glyph';
import { UiStore } from '../ui.store';

/**
 * The week to choose from: today and the six days after it, each with its
 * date, its sky in a few words and its high and low, the day on screen
 * marked. Opened from the day button in the hero, Zonas and Mar; the choice
 * holds across them all.
 */
@Component({
  selector: 'lm-day-picker',
  imports: [Sheet, Icon, SkyGlyph, TranslatePipe],
  templateUrl: './day-picker.html',
  styleUrl: './day-picker.scss',
})
export class DayPicker {
  protected readonly ui = inject(UiStore);
  private readonly store = inject(DayStore);

  protected readonly rows = computed(() => {
    const today = this.store.today();
    const selected = this.store.day();
    return this.store.days().map((day) => ({
      date: day.date,
      name: msg('common.value', { value: { day: day.date, today } }),
      dayMonth: msg('common.value', { value: { date: day.date } }),
      phrase: dayPhrase(day),
      sky: day.sky,
      max: day.maxC,
      min: day.minC,
      isCurrent: day.date === selected,
    }));
  });

  protected choose(day: IsoDate): void {
    this.store.select(day);
    this.ui.dayPickerOpen.set(false);
  }
}
