import { Component, computed, input } from '@angular/core';
import { skyLabel } from '../../../core/insights/sky.insight';
import { SkyCondition } from '../../../core/models';

type Tone = 'sun' | 'ray' | 'moon' | 'cloud' | 'cloud-back' | 'rain' | 'haze';

interface GlyphPart {
  readonly d: string;
  readonly tone: Tone;
  readonly transform?: string;
}

const SUN_CORE = 'M12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4z';
const SUN_RAYS =
  'M12 2.6v1.9M12 19.5v1.9M2.6 12h1.9M19.5 12h1.9M5.35 5.35l1.35 1.35M17.3 17.3l1.35 1.35M5.35 18.65l1.35-1.35M17.3 6.7l1.35-1.35';
const SMALL_SUN_CORE = 'M9 5.4a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z';
const SMALL_SUN_RAYS = 'M9 1.7v1.3M3.4 8.5H2.1M5 4.5l-.9-.9M13 4.5l.9-.9M4.6 12.5l-.9.9';
const MOON = 'M18.6 14.4A7.2 7.2 0 1 1 9.6 5.4a5.8 5.8 0 0 0 9 9z';
const SMALL_MOON = 'M13.2 10.4A4.7 4.7 0 1 1 7.3 4.5a3.8 3.8 0 0 0 5.9 5.9z';
const CLOUD =
  'M8.5 19.5h8.25a3.4 3.4 0 0 0 .5-6.77 4.75 4.75 0 0 0-9.13-1.08A3.95 3.95 0 0 0 8.5 19.5z';
const BIG_CLOUD =
  'M7.5 19h9a3.75 3.75 0 0 0 .55-7.46 5.25 5.25 0 0 0-10.1-1.2A4.33 4.33 0 0 0 7.5 19z';
const BACK_CLOUD = 'M12.6 10.6a4.1 4.1 0 0 1 7.8-1.1 3.1 3.1 0 0 1 .3 6.1H14.5z';
const RAIN = 'M8.6 19.6 7.7 21.6M12.6 19.6l-.9 2M16.6 19.6l-.9 2';
const HAZE_SUN = 'M12 5.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z';
const HAZE_RAYS = 'M12 1.6v1.5M5.4 9.2H3.9M20.1 9.2h-1.5M7.2 4.4l-1-1M16.8 4.4l1-1';
const HAZE_LINES = 'M3.5 15.6h17M5.5 18.6h13M8 21.6h8';

const DAY: Readonly<Record<SkyCondition, readonly GlyphPart[]>> = {
  despejado: [
    { d: SUN_RAYS, tone: 'ray' },
    { d: SUN_CORE, tone: 'sun' },
  ],
  'poco-nuboso': [
    { d: SMALL_SUN_RAYS, tone: 'ray' },
    { d: SMALL_SUN_CORE, tone: 'sun' },
    { d: CLOUD, tone: 'cloud' },
  ],
  nuboso: [
    { d: SMALL_SUN_RAYS, tone: 'ray' },
    { d: SMALL_SUN_CORE, tone: 'sun' },
    { d: BACK_CLOUD, tone: 'cloud-back' },
    { d: CLOUD, tone: 'cloud' },
  ],
  cubierto: [
    { d: BACK_CLOUD, tone: 'cloud-back', transform: 'translate(0 -1.5)' },
    { d: BIG_CLOUD, tone: 'cloud' },
  ],
  calima: [
    { d: HAZE_RAYS, tone: 'ray' },
    { d: HAZE_SUN, tone: 'sun' },
    { d: HAZE_LINES, tone: 'haze' },
  ],
  lluvia: [
    { d: BACK_CLOUD, tone: 'cloud-back', transform: 'translate(0 -4)' },
    { d: BIG_CLOUD, tone: 'cloud', transform: 'translate(0 -2.5)' },
    { d: RAIN, tone: 'rain' },
  ],
};

const NIGHT: Readonly<Record<SkyCondition, readonly GlyphPart[]>> = {
  ...DAY,
  despejado: [{ d: MOON, tone: 'moon' }],
  'poco-nuboso': [
    { d: SMALL_MOON, tone: 'moon' },
    { d: CLOUD, tone: 'cloud' },
  ],
  nuboso: [
    { d: SMALL_MOON, tone: 'moon' },
    { d: BACK_CLOUD, tone: 'cloud-back' },
    { d: CLOUD, tone: 'cloud' },
  ],
  calima: [
    { d: SMALL_MOON, tone: 'moon', transform: 'translate(3 0)' },
    { d: HAZE_LINES, tone: 'haze' },
  ],
};

/** Two-tone weather glyph: a warm sun, a pale moon, clouds that occlude them. */
@Component({
  selector: 'qth-sky-glyph',
  host: { class: 'sky-glyph', '[attr.data-sky]': 'sky()' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.role]="decorative() ? null : 'img'"
      [attr.aria-hidden]="decorative() ? 'true' : null"
    >
      @if (!decorative()) {
        <svg:title>{{ label() }}</svg:title>
      }
      @for (part of parts(); track $index) {
        <svg:path
          [attr.d]="part.d"
          [attr.class]="part.tone"
          [attr.transform]="part.transform ?? null"
        />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1.75rem;
      height: 1.75rem;
      flex: none;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .sun {
      fill: var(--glyph-sun);
      stroke: var(--glyph-sun-edge);
    }
    .ray {
      stroke: var(--glyph-sun-edge);
    }
    .moon {
      fill: var(--glyph-moon);
      stroke: color-mix(in oklch, var(--glyph-moon), currentColor 45%);
    }
    .cloud {
      fill: var(--glyph-cloud-fill);
    }
    .cloud-back {
      fill: color-mix(in oklch, var(--glyph-cloud-fill), currentColor 16%);
      stroke-opacity: 0.7;
    }
    .rain {
      stroke: var(--glyph-rain);
    }
    .haze {
      stroke: color-mix(in oklch, var(--c-heat), currentColor 25%);
    }
  `,
})
export class SkyGlyph {
  readonly sky = input.required<SkyCondition>();
  readonly isDaylight = input(true);
  /** When the condition is already written next to the glyph. */
  readonly decorative = input(false);

  protected readonly parts = computed(() => (this.isDaylight() ? DAY : NIGHT)[this.sky()]);
  protected readonly label = computed(() => skyLabel(this.sky(), this.isDaylight()));
}
