import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
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
    /** Say how long until the next high or low (not for a later day, which has no now). */
    readonly countdown?: boolean;
  };
}

const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

/** Wind, sea and tide — each as a word first, a number second, and a tiny gauge. */
@Component({
  selector: 'lm-conditions',
  imports: [RouterLink, Icon, TranslatePipe],
  templateUrl: './conditions.html',
  styleUrl: './conditions.scss',
  host: { class: 'current-conditions' },
})
export class Conditions {
  readonly view = input.required<ConditionsView>();

  private readonly document = inject(DOCUMENT);

  protected readonly windBars = [0, 1, 2, 3];

  /** To the hours, where the wind is given for each one; focus goes with the eye. */
  protected showHours(): void {
    const hours = this.document.getElementById('hourly-forecast');
    if (!hours) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    hours.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    hours.querySelector<HTMLElement>('.hour-cell[tabindex="0"]')?.focus({ preventScroll: true });
  }

  protected readonly windTrendText = computed(() => {
    const trend = this.view().windTrend;
    return trend === 'estable' ? null : msg(`wind.trend.${trend}`);
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
