import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '../core/i18n/t.pipe';
import { ClockStore } from '../core/state/clock.store';
import { ForecastStore } from '../core/state/forecast.store';
import { islandHour, toDate } from '../core/utils/time';
import { DemoStore } from './demo.store';
import { SCENARIOS, ScenarioId } from './sim/scenarios';

type TimeOption = 'ahora' | 'amanecer' | 'mediodia' | 'atardecer' | 'noche';

/**
 * DEMO DATA — the controls that make the simulated data tell different
 * stories: weather scenario, time of day and network behaviour. Only the
 * demo build shows them, inside the settings sheet.
 */
@Component({
  selector: 'qth-demo-controls',
  imports: [TranslatePipe],
  template: `
    <p class="intro t-small t-muted">{{ 'demo.intro' | t }}</p>

    <fieldset class="group">
      <legend class="legend">{{ 'demo.scenario' | t }}</legend>
      @for (scenario of scenarios; track scenario.id) {
        <label class="choice">
          <input
            type="radio"
            name="scenario"
            [value]="scenario.id"
            [checked]="demo.scenario() === scenario.id"
            (change)="setScenario(scenario.id)"
          />
          <span class="choice-text">
            <span class="choice-label">{{ scenario.name | t }}</span>
            <span class="choice-hint">{{ scenario.text | t }}</span>
          </span>
        </label>
      }
    </fieldset>

    <fieldset class="group">
      <legend class="legend">{{ 'demo.time' | t }}</legend>
      <div class="segmented" role="presentation">
        @for (option of timeOptions(); track option.value) {
          <label class="segment">
            <input
              type="radio"
              name="time"
              [value]="option.value"
              [checked]="timeOption() === option.value"
              (change)="setTime(option.value)"
            />
            <span>{{ option.label | t }}</span>
          </label>
        }
      </div>
    </fieldset>

    <fieldset class="group">
      <legend class="legend">{{ 'demo.network' | t }}</legend>
      <label class="choice">
        <input type="checkbox" [checked]="demo.slowNetwork()" (change)="setSlowNetwork($event)" />
        <span class="choice-text">
          <span class="choice-label">{{ 'demo.slow' | t }}</span>
          <span class="choice-hint">{{ 'demo.slow.hint' | t }}</span>
        </span>
      </label>
      <label class="choice">
        <input type="checkbox" [checked]="demo.failRequests()" (change)="setFailRequests($event)" />
        <span class="choice-text">
          <span class="choice-label">{{ 'demo.fail' | t }}</span>
          <span class="choice-hint">{{ 'demo.fail.hint' | t }}</span>
        </span>
      </label>
    </fieldset>
  `,
  styles: `
    .intro {
      margin-bottom: var(--s-5);
      max-width: 40ch;
    }
  `,
})
export class DemoControls {
  protected readonly demo = inject(DemoStore);
  private readonly clock = inject(ClockStore);
  private readonly forecast = inject(ForecastStore);

  protected readonly scenarios = SCENARIOS.map(({ id }) => ({
    id,
    name: `demo.scenario.${id}` as const,
    text: `demo.scenario.${id}.text` as const,
  }));
  protected readonly timeOption = signal<TimeOption>('ahora');

  private readonly sunHours = computed(() => {
    const today = this.forecast.weather().data?.daily[0];
    return {
      sunrise: today?.sunrise ? islandHour(toDate(today.sunrise)) : 8,
      sunset: today?.sunset ? islandHour(toDate(today.sunset)) : 19.3,
    };
  });

  protected readonly timeOptions = computed(() => {
    const { sunrise, sunset } = this.sunHours();
    return [
      { value: 'ahora' as const, label: 'demo.time.now' as const, hour: null },
      { value: 'amanecer' as const, label: 'demo.time.sunrise' as const, hour: sunrise + 0.15 },
      { value: 'mediodia' as const, label: 'demo.time.noon' as const, hour: 13.5 },
      { value: 'atardecer' as const, label: 'demo.time.sunset' as const, hour: sunset - 0.1 },
      { value: 'noche' as const, label: 'demo.time.night' as const, hour: 22.5 },
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

  protected setSlowNetwork(event: Event): void {
    this.demo.setSlowNetwork((event.target as HTMLInputElement).checked);
  }

  protected setFailRequests(event: Event): void {
    this.demo.setFailRequests((event.target as HTMLInputElement).checked);
  }
}
