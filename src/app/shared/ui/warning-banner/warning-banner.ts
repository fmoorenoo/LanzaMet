import { Component, computed, inject, input } from '@angular/core';
import { WeatherWarning } from '../../../core/models';
import { ClockStore } from '../../../core/state/clock.store';
import {
  formatDayName,
  formatTime,
  formatWindow,
  islandDateKey,
  toDate,
} from '../../../core/utils/time';
import { Icon } from '../icon/icon';

/**
 * Official warnings in force, as the issuer words them. Colour backs up the
 * level, it never replaces the word.
 */
@Component({
  selector: 'qth-warning-banner',
  imports: [Icon],
  template: `
    <ul class="list warning-list">
      @for (w of items(); track w.id) {
        <li class="warning weather-warning" [class]="'is-' + w.level" [attr.data-level]="w.level">
          <qth-icon name="alert" />
          <span class="text">
            <span class="title">Aviso {{ w.level }}: {{ w.phenomenon }}</span>
            <span class="sub">{{ w.area }} · {{ w.when }}</span>
            @if (w.description) {
              <span class="sub">{{ w.description }}</span>
            }
          </span>
        </li>
      }
    </ul>
    <p class="source warning-source">
      Avisos oficiales de
      <a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener"
        >AEMET</a
      >
    </p>
  `,
  host: {
    class: 'warning-banner',
    role: 'region',
    'aria-label': 'Avisos meteorológicos oficiales',
  },
  styles: `
    :host {
      display: grid;
      gap: var(--s-2);
    }
    .list {
      display: grid;
      gap: var(--s-2);
    }
    .warning {
      display: flex;
      gap: var(--s-3);
      align-items: flex-start;
      padding: var(--s-3) var(--s-4);
      border-radius: var(--r-md);
      border-left: 4px solid var(--level);
      background-color: var(--c-surface-sunken);
    }
    .is-amarillo {
      --level: var(--c-fair);
    }
    .is-naranja,
    .is-rojo {
      --level: var(--c-poor);
    }
    qth-icon {
      flex: none;
      width: var(--icon-lg);
      height: var(--icon-lg);
      color: var(--level);
    }
    .text {
      display: grid;
      gap: 0.125rem;
    }
    .title {
      font-weight: 640;
    }
    .sub {
      font-size: var(--fs-small);
      color: var(--c-ink-2);
    }
    .source {
      font-size: var(--fs-micro);
      color: var(--c-ink-3);
    }
    a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
  `,
})
export class WarningBanner {
  readonly warnings = input.required<readonly WeatherWarning[]>();

  private readonly clock = inject(ClockStore);

  protected readonly items = computed(() => {
    const now = this.clock.now();
    return this.warnings().map((w) => {
      const expires = toDate(w.expires);
      const day = formatDayName(islandDateKey(expires), islandDateKey(now));
      const until =
        day === 'Hoy' ? 'las' : day === 'Mañana' ? 'mañana a las' : `el ${day.toLowerCase()} a las`;
      return {
        id: w.id,
        level: w.level,
        phenomenon: w.phenomenon.toLocaleLowerCase('es-ES'),
        area: w.area,
        description: w.description,
        when:
          toDate(w.onset) <= now
            ? `En vigor hasta ${until} ${formatTime(expires)}`
            : formatWindow(w.onset, w.expires, now),
      };
    });
  });
}
