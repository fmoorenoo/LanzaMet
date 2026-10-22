import { Component, computed, inject, signal } from '@angular/core';
import { ClockStore } from '../../core/state/clock.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { ThemePreference, ThemeStore } from '../../core/state/theme.store';
import { islandHour, toDate } from '../../core/utils/time';
import { DemoStore } from '../../mocks/demo.store';
import { SCENARIOS, ScenarioId } from '../../mocks/sim/scenarios';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { UiStore } from '../ui.store';

type TimeOption = 'ahora' | 'amanecer' | 'mediodia' | 'atardecer' | 'noche';

/**
 * Settings, plus the controls that make the simulated data tell different
 * stories: weather scenario, time of day and network behaviour.
 */
@Component({
  selector: 'qth-demo-panel',
  imports: [Sheet],
  templateUrl: './demo-panel.html',
  styleUrl: './demo-panel.scss',
})
export class DemoPanel {
  protected readonly ui = inject(UiStore);
  protected readonly demo = inject(DemoStore);
  protected readonly theme = inject(ThemeStore);
  private readonly clock = inject(ClockStore);
  private readonly forecast = inject(ForecastStore);

  protected readonly scenarios = SCENARIOS;
  protected readonly timeOption = signal<TimeOption>('ahora');

  protected readonly themeOptions: readonly {
    value: ThemePreference;
    label: string;
    hint: string;
  }[] = [
    {
      value: 'auto',
      label: 'Según la hora',
      hint: 'De día claro, de noche oscuro, con el sol de la zona.',
    },
    { value: 'light', label: 'Siempre claro', hint: '' },
    { value: 'dark', label: 'Siempre oscuro', hint: '' },
  ];

  private readonly sunHours = computed(() => {
    const today = this.forecast.weather().data?.daily[0];
    return {
      sunrise: today ? islandHour(toDate(today.sunrise)) : 8,
      sunset: today ? islandHour(toDate(today.sunset)) : 19.3,
    };
  });

  protected readonly timeOptions = computed(() => {
    const { sunrise, sunset } = this.sunHours();
    return [
      { value: 'ahora' as const, label: 'Ahora', hour: null },
      { value: 'amanecer' as const, label: 'Amanecer', hour: sunrise + 0.15 },
      { value: 'mediodia' as const, label: 'Mediodía', hour: 13.5 },
      { value: 'atardecer' as const, label: 'Atardecer', hour: sunset - 0.1 },
      { value: 'noche' as const, label: 'Noche', hour: 22.5 },
    ];
  });

  protected setScenario(id: ScenarioId): void {
    this.demo.setScenario(id);
  }

  protected setTime(option: TimeOption): void {
    this.timeOption.set(option);
    const hour = this.timeOptions().find((o) => o.value === option)?.hour ?? null;
    this.clock.pinHour(hour);
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }

  protected setSlowNetwork(event: Event): void {
    this.demo.setSlowNetwork((event.target as HTMLInputElement).checked);
  }

  protected setFailRequests(event: Event): void {
    this.demo.setFailRequests((event.target as HTMLInputElement).checked);
  }
}
