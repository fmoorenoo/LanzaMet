import { Component, computed, input } from '@angular/core';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { readWind, windHue, windSteps } from '../../../core/insights/wind.insight';
import { Wind } from '../../../core/models';

/**
 * The wind at a glance: an arrow pointing where it blows, the speed in km/h,
 * and its strength on the five-step scale (see WIND_LEVEL_MAX) as a word on
 * a tint of its colour (green when light, through orange, to red when
 * strong, `windHue`, the same as the hours) and a ramp of bars in that
 * colour, each bar one step, filled by how far into it the speed is. The
 * words carry everything; the arrow, the colour and the bars are for the eye.
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
    '[style.--wind-hue]': 'hue()',
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
          <span class="bar" [style.--h]="0.4 + $index * 0.15"
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
      column-gap: 0.75rem;
      row-gap: 0.25rem;
    }

    .arrow {
      grid-area: arrow;
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      border: 1.5px solid color-mix(in oklch, currentColor 40%, transparent);
      // On-screen movement: the arrow turns, it never jumps.
      transition: rotate 600ms var(--ease-in-out);

      svg {
        width: 1.375rem;
        height: 1.375rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .speed {
      grid-area: speed;
      display: inline-flex;
      align-items: baseline;
      gap: 0.3125rem;
    }

    .value {
      font-size: 2.5rem;
      font-weight: 620;
      letter-spacing: -0.035em;
      line-height: 1;
    }

    .unit {
      font-size: var(--fs-body);
      font-weight: 620;
      color: var(--gauge-ink-2, currentColor);
    }

    .strength {
      grid-area: strength;
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
    }

    // A ramp in the wind's own colour: each bar a step, a little taller than the last.
    .bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 3px;
      height: 1.5rem;
    }

    .bar {
      position: relative;
      width: 6px;
      height: calc(var(--h) * 100%);
      overflow: hidden;
      border-radius: 2px;
      background-color: color-mix(in oklch, currentColor 24%, transparent);
    }

    .bar-fill {
      position: absolute;
      inset: 0;
      background-color: oklch(var(--gauge-bar-l, 0.86) 0.15 var(--wind-hue));
      transform-origin: bottom;
      transition:
        transform var(--d-base) var(--ease-out),
        background-color var(--d-base) ease;
    }

    // The strength as a word on a tint of its colour. Over the sky it is always
    // the light tint, which stands out on any sky, day or night.
    .word {
      display: inline-flex;
      align-items: center;
      height: 1.75rem;
      padding: 0 0.625rem;
      border-radius: var(--r-pill);
      background-color: oklch(0.93 0.085 var(--wind-hue));
      color: oklch(0.4 0.13 var(--wind-hue));
      font-size: var(--fs-small);
      font-weight: 700;
      text-shadow: none;
      transition:
        background-color var(--d-base) ease,
        color var(--d-base) ease;
    }

    .more {
      grid-area: more;
      min-height: 1lh;
      font-size: var(--fs-small);
      font-weight: 560;
      color: var(--gauge-ink-2, currentColor);
    }

    // One line, for cards and lists on a surface: tint and ink follow the theme.
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
        letter-spacing: -0.01em;
      }

      .unit {
        font-size: var(--fs-micro);
        color: var(--c-ink-2);
      }

      .strength {
        gap: 0.375rem;
      }

      .bars {
        display: none;
      }

      .word {
        height: 1.375rem;
        padding: 0 0.5rem;
        background-color: oklch(var(--wind-bg-l) var(--wind-bg-c) var(--wind-hue));
        color: oklch(var(--wind-ink-l) var(--wind-ink-c) var(--wind-hue));
        font-size: var(--fs-micro);
      }
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
  protected readonly hue = computed(() => windHue(this.wind().speedKmh));

  /** The arrow points where the wind goes (it blows from `fromDegrees`). */
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
