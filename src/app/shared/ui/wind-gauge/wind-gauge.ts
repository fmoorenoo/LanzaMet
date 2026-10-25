import { Component, computed, input } from '@angular/core';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { readWind, windSteps } from '../../../core/insights/wind.insight';
import { Wind } from '../../../core/models';

/**
 * The wind at a glance: an arrow pointing where it blows, the speed in km/h,
 * and its strength on the five-step scale (see WIND_LEVEL_MAX) as a word and
 * a ramp of bars, each bar one step, filled by how far into it the speed is.
 * The words carry everything; the arrow and the bars are drawn for the eye.
 *
 * `hero` sits on the sky and takes its ink; `compact` is one line for cards.
 */
@Component({
  selector: 'lm-wind-gauge',
  imports: [TranslatePipe],
  host: {
    class: 'wind-gauge',
    '[class.is-compact]': "variant() === 'compact'",
    '[attr.data-level]': 'reading().level',
  },
  template: `
    @let r = reading();
    <span class="arrow" aria-hidden="true" [style.rotate]="rotation()">
      <svg viewBox="0 0 24 24"><path d="M12 20.5V4M6.5 9.5 12 4l5.5 5.5" /></svg>
    </span>
    <span class="speed">
      <span class="visually-hidden">{{ 'wind.title' | t }}: </span>
      <span class="value t-num">{{ wind().speedKmh }}</span>
      <span class="unit">{{ 'wind.unit' | t }}</span>
    </span>
    <span class="strength">
      <span class="bars" aria-hidden="true">
        @for (fill of bars(); track $index) {
          <span class="bar" [style.--h]="0.45 + $index * 0.1375"
            ><span class="bar-fill" [style.transform]="'scaleY(' + fill + ')'"></span
          ></span>
        }
      </span>
      <span class="word">{{ r.scale | t }}</span>
    </span>
    <!-- Always laid out in the hero, empty in a calm: the line never comes and goes. -->
    @if (variant() === 'hero') {
      <span class="more">
        @if (more(); as line) {
          {{ line | t }}
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      grid-template-columns: auto auto auto;
      grid-template-areas: 'arrow speed strength' '. more more';
      align-items: center;
      column-gap: 0.625rem;
      row-gap: 0.125rem;
    }

    .arrow {
      grid-area: arrow;
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      border: 1px solid color-mix(in oklch, currentColor 30%, transparent);
      // On-screen movement: the arrow turns, it never jumps.
      transition: rotate 600ms var(--ease-in-out);

      svg {
        width: 1.125rem;
        height: 1.125rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .speed {
      grid-area: speed;
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .value {
      font-size: 1.75rem;
      font-weight: 640;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .unit {
      font-size: var(--fs-small);
      font-weight: 600;
      opacity: 0.86;
    }

    .strength {
      grid-area: strength;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding-left: 0.625rem;
      border-left: 1px solid color-mix(in oklch, currentColor 28%, transparent);
    }

    // A ramp: each bar a step of the scale, a little taller than the last.
    .bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 3px;
      height: 1.125rem;
    }

    .bar {
      position: relative;
      width: 5px;
      height: calc(var(--h) * 100%);
      overflow: hidden;
      border-radius: 2px;
      background-color: color-mix(in oklch, currentColor 26%, transparent);
    }

    .bar-fill {
      position: absolute;
      inset: 0;
      background-color: currentColor;
      transform-origin: bottom;
      transition: transform var(--d-base) var(--ease-out);
    }

    .word {
      font-size: var(--fs-small);
      font-weight: 680;
      letter-spacing: 0.005em;
    }

    .more {
      grid-area: more;
      min-height: 1lh;
      font-size: var(--fs-micro);
      font-weight: 560;
      opacity: 0.88;
    }

    // One line, for cards and lists on a surface: the strength takes its colour.
    :host(.is-compact) {
      grid-template-areas: 'arrow speed strength';
      column-gap: 0.375rem;

      .arrow {
        width: 1.25rem;
        height: 1.25rem;
        border: 0;
        color: var(--c-ink-2);

        svg {
          width: 1rem;
          height: 1rem;
        }
      }

      .value {
        font-size: var(--fs-body);
      }

      .unit {
        font-size: var(--fs-micro);
        color: var(--c-ink-2);
        opacity: 1;
      }

      .strength {
        padding-left: 0.375rem;
        gap: 0.375rem;
        border-left-color: var(--c-line-strong);
      }

      .bars {
        height: 0.875rem;
        gap: 2px;
      }

      .bar {
        width: 4px;
        background-color: var(--c-line-strong);
      }

      .bar-fill {
        background-color: var(--c-ink-2);
      }

      .word {
        font-size: var(--fs-micro);
        color: var(--c-ink-2);
      }
    }

    :host(.is-compact[data-level='2']) .bar-fill {
      background-color: var(--c-fair);
    }

    :host(.is-compact[data-level='3']) .bar-fill,
    :host(.is-compact[data-level='4']) .bar-fill {
      background-color: var(--c-poor);
    }

    @media (prefers-reduced-motion: reduce) {
      .arrow,
      .bar-fill {
        transition: none;
      }
    }
  `,
})
export class WindGauge {
  readonly wind = input.required<Wind>();
  readonly variant = input<'hero' | 'compact'>('hero');

  protected readonly reading = computed(() => readWind(this.wind()));

  /** The arrow points where the wind goes (it blows from `fromDegrees`); none in a calm. */
  protected readonly rotation = computed(() => `${(this.wind().fromDegrees + 180) % 360}deg`);

  protected readonly bars = computed(() => {
    const steps = windSteps(this.wind().speedKmh);
    return [0, 1, 2, 3, 4].map((i) => Math.min(1, Math.max(0, steps - i)).toFixed(2));
  });

  /** "Del nordeste · rachas de 50"; in a calm, no direction to speak of. */
  protected readonly more = computed(() => {
    const { speedKmh, gustKmh } = this.wind();
    const r = this.reading();
    const gusts = gustKmh >= speedKmh + 6 ? msg('wind.gusts', { gust: gustKmh }) : null;
    if (r.level === 0) return gusts ? msg('common.value', { value: gusts }) : null;
    return gusts
      ? msg('wind.more', { from: r.from, gusts })
      : msg('common.value', { value: r.from });
  });
}
