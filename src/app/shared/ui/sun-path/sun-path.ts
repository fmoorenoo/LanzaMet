import { Component, computed, input } from '@angular/core';
import { DaylightReading } from '../../../core/insights/sun.insight';
import { formatDuration, formatTime } from '../../../core/utils/time';
import { Icon } from '../icon/icon';

// The sun's path: half an ellipse standing on the horizon.
const CX = 100;
const BASE = 54;
const RX = 92;
const RY = 46;
const START = `M${CX - RX} ${BASE}`;

function pointAt(progress: number): { x: number; y: number } {
  const angle = Math.PI * progress;
  return { x: CX - RX * Math.cos(angle), y: BASE - RY * Math.sin(angle) };
}

const fixed = (n: number) => n.toFixed(1);

/**
 * Today's sunrise and sunset, with the sun on its way between them. The
 * drawing is decorative: the two times and the sentence under them say it all.
 */
@Component({
  selector: 'qth-sun-path',
  imports: [Icon],
  template: `
    @if (view(); as v) {
      <div class="sun-row">
        <p class="sun-time" data-event="sunrise">
          <span class="sun-label"><qth-icon name="sunrise" />Amanecer</span>
          <time class="sun-clock t-num" [attr.datetime]="v.sunriseIso">{{ v.sunrise }}</time>
        </p>

        <svg class="sun-arc" viewBox="0 0 200 58" aria-hidden="true">
          <path class="arc-track" [attr.d]="track" />
          @if (v.travelled) {
            <path class="arc-travelled" [attr.d]="v.travelled" [style.d]="v.travelledCss" />
          }
          <line class="horizon" x1="0" [attr.y1]="base" x2="200" [attr.y2]="base" />
          @if (v.sun) {
            <g class="sun-marker" [style.transform]="v.sun">
              <circle class="sun-halo" r="9" />
              <circle class="sun-dot" r="5" />
            </g>
          }
        </svg>

        <p class="sun-time" data-event="sunset">
          <span class="sun-label">Atardecer<qth-icon name="sunset" /></span>
          <time class="sun-clock t-num" [attr.datetime]="v.sunsetIso">{{ v.sunset }}</time>
        </p>
      </div>

      <p class="sun-status">
        {{ v.status }}<span class="sun-length"> · {{ v.dayLength }} de luz</span>
      </p>
    } @else {
      <p class="sun-missing">
        <qth-icon name="sunset" />
        Hoy no tenemos la hora de amanecer ni de atardecer para esta zona.
      </p>
    }
  `,
  host: {
    class: 'sun-path',
    role: 'group',
    'aria-label': 'Amanecer y atardecer',
    '[attr.data-phase]': 'reading()?.phase ?? "unknown"',
  },
  styles: `
    :host {
      display: grid;
      gap: var(--s-2);
      padding-block: var(--s-2) var(--s-1);
    }

    .sun-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: end;
      gap: var(--s-3);
    }

    .sun-time {
      display: grid;
      gap: 0.125rem;

      &[data-event='sunset'] {
        justify-items: end;
      }
    }

    .sun-label {
      display: inline-flex;
      align-items: center;
      gap: var(--s-1);
      font-size: var(--fs-micro);
      font-weight: 600;
      color: var(--c-ink-2);

      qth-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
      }
    }

    .sun-clock {
      font-size: 1.25rem;
      font-weight: 640;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .sun-arc {
      display: block;
      width: 100%;
      max-width: 17rem;
      justify-self: center;
      overflow: visible;
    }

    .arc-track {
      fill: none;
      stroke: var(--c-line-strong);
      stroke-width: 1.5;
      stroke-dasharray: 1.5 4.5;
      stroke-linecap: round;
    }

    .arc-travelled {
      fill: none;
      stroke: var(--glyph-sun-edge);
      stroke-width: 2;
      stroke-linecap: round;
      transition:
        d var(--d-atmos) var(--ease-in-out),
        stroke var(--d-atmos) ease;
    }

    // Once the sun has set, the day's path stays as a trace, not as light.
    :host([data-phase='after-sunset']) .arc-travelled {
      stroke: var(--c-ink-3);
      stroke-width: 1.5;
      opacity: 0.55;
    }

    .horizon {
      stroke: var(--c-line-strong);
      stroke-width: 1.5;
    }

    .sun-marker {
      transition: transform var(--d-atmos) var(--ease-in-out);
    }

    .sun-halo {
      fill: color-mix(in oklch, var(--c-sun) 30%, transparent);
    }

    .sun-dot {
      fill: var(--c-sun);
      stroke: var(--glyph-sun-edge);
      stroke-width: 1.25;
    }

    .sun-status {
      font-size: var(--fs-small);
      color: var(--c-ink-2);
      text-align: center;
      text-wrap: balance;
    }

    .sun-length {
      color: var(--c-ink-3);
    }

    .sun-missing {
      display: flex;
      align-items: center;
      gap: var(--s-2);
      font-size: var(--fs-small);
      color: var(--c-ink-2);

      qth-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
        color: var(--c-ink-3);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sun-marker,
      .arc-travelled {
        transition: none;
      }
    }
  `,
})
export class SunPath {
  readonly reading = input<DaylightReading | null>(null);

  protected readonly base = BASE;
  protected readonly track = `${START}A${RX} ${RY} 0 0 1 ${CX + RX} ${BASE}`;

  protected readonly view = computed(() => {
    const r = this.reading();
    if (!r) return null;
    const point = pointAt(r.progress);
    const travelled =
      r.progress > 0 ? `${START}A${RX} ${RY} 0 0 1 ${fixed(point.x)} ${fixed(point.y)}` : null;
    return {
      sunrise: formatTime(r.sunrise),
      sunset: formatTime(r.sunset),
      sunriseIso: r.sunrise,
      sunsetIso: r.sunset,
      travelled,
      travelledCss: travelled ? `path("${travelled}")` : null,
      // The sun only sits on its path while it is up.
      sun: r.phase === 'day' ? `translate(${fixed(point.x)}px, ${fixed(point.y)}px)` : null,
      status:
        r.phase === 'before-sunrise'
          ? `Amanece dentro de ${formatDuration(r.untilMs)}`
          : r.phase === 'day'
            ? `Quedan ${formatDuration(r.untilMs)} de sol`
            : r.nextSunrise
              ? `Mañana amanece a las ${formatTime(r.nextSunrise)}`
              : 'El sol ya se ha puesto',
      dayLength: formatDuration(r.dayLengthMs),
    };
  });
}
