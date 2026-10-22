import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeaReading } from '../../../core/insights/sea.insight';
import { TideReading } from '../../../core/insights/tide.insight';
import { Trend, WindReading } from '../../../core/insights/wind.insight';
import { SectionStatus } from '../../../core/state/section-state';
import { Icon } from '../../../shared/ui/icon/icon';

export interface ConditionsView {
  readonly wind: WindReading;
  readonly windTrend: Trend;
  readonly sea: {
    readonly status: SectionStatus;
    readonly reading: SeaReading | null;
    readonly pending: boolean;
  };
  readonly tide: {
    readonly status: SectionStatus;
    readonly reading: TideReading | null;
    readonly pending: boolean;
    /** True when the tide comes from a model, not an official prediction. */
    readonly estimated: boolean;
  };
}

const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

/** Wind, sea and tide — each as a word first, a number second, and a tiny gauge. */
@Component({
  selector: 'qth-conditions',
  imports: [RouterLink, Icon],
  templateUrl: './conditions.html',
  styleUrl: './conditions.scss',
  host: { class: 'current-conditions' },
})
export class Conditions {
  readonly view = input.required<ConditionsView>();

  protected readonly windBars = [0, 1, 2, 3];

  protected readonly windTrendText = computed(() => {
    switch (this.view().windTrend) {
      case 'sube':
        return 'va a más';
      case 'baja':
        return 'va a menos';
      default:
        return null;
    }
  });

  protected readonly wavePath = computed(() => {
    const level = this.view().sea.reading?.level ?? 0;
    const a = WAVE_AMPLITUDE[level];
    return `M2 14q4.5 ${-a} 9 0t9 0t9 0t9 0`;
  });

  /** Same path for the CSS `d` property, so supporting browsers morph it. */
  protected readonly wavePathCss = computed(() => `path("${this.wavePath()}")`);

  /** An empty tube when there is no reading — never a made-up level. */
  protected readonly tideFill = computed(() => {
    const reading = this.view().tide.reading;
    const offset = reading ? (1 - reading.level) * 70 : 100;
    return `translate3d(0, ${offset.toFixed(1)}%, 0)`;
  });
}
