import { Component, computed, inject, input } from '@angular/core';
import { MessageKey, msg, Msg } from '../../../core/i18n/i18n.model';
import { I18n } from '../../../core/i18n/i18n.store';
import { timeWindow } from '../../../core/i18n/phrases';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { WeatherWarning } from '../../../core/models';
import { ClockStore } from '../../../core/state/clock.store';
import { addHours, islandDateKey, toDate } from '../../../core/utils/time';
import { Icon } from '../icon/icon';

/** Meteoalerta phenomena the interface can name in every language, by code. */
const PHENOMENA: Readonly<Record<string, MessageKey>> = {
  AT: 'warning.phenomenon.AT',
  BT: 'warning.phenomenon.BT',
  CO: 'warning.phenomenon.CO',
  NE: 'warning.phenomenon.NE',
  NI: 'warning.phenomenon.NI',
  PR: 'warning.phenomenon.PR',
  TO: 'warning.phenomenon.TO',
  VI: 'warning.phenomenon.VI',
  VS: 'warning.phenomenon.VS',
  DU: 'warning.phenomenon.DU',
  GL: 'warning.phenomenon.GL',
  OL: 'warning.phenomenon.OL',
};

/**
 * Official warnings in force, as the issuer words them. Colour backs up the
 * level, it never replaces the word. The phenomenon is named from its code in
 * the visitor's language; the description is the issuer's own text, in
 * English when AEMET publishes it, otherwise in Spanish as issued.
 */
@Component({
  selector: 'qth-warning-banner',
  imports: [Icon, TranslatePipe],
  template: `
    <ul class="list warning-list">
      @for (w of items(); track w.id) {
        <li class="warning weather-warning" [class]="'is-' + w.level" [attr.data-level]="w.level">
          <qth-icon name="alert" />
          <span class="text">
            <span class="title">{{ w.title | t }}</span>
            <span class="sub">{{ w.area | t }} · {{ w.when | t }}</span>
            @if (w.description) {
              <span class="sub" [attr.lang]="w.descriptionLang">{{ w.description }}</span>
            }
          </span>
        </li>
      }
    </ul>
    <p class="source warning-source">
      {{ 'warning.source' | t }}
      <a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener"
        >AEMET</a
      >
    </p>
  `,
  host: {
    class: 'warning-banner',
    role: 'region',
    '[attr.aria-label]': 'regionLabel()',
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
    // The level tints the whole notice and its mark; the word says it too.
    .warning {
      display: flex;
      gap: var(--s-3);
      align-items: flex-start;
      padding: var(--s-3) var(--s-4);
      border-radius: var(--r-md);
      // Mixed in OKLab: an OKLCH mix would swing the hue from amber through green.
      background-color: color-mix(in oklab, var(--level) 14%, var(--c-surface-sunken));
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
  private readonly i18n = inject(I18n);

  protected readonly regionLabel = computed(() => this.i18n.t('warning.region'));

  protected readonly items = computed(() => {
    const now = this.clock.now();
    const english = this.i18n.lang() === 'en';
    return this.warnings().map((w) => {
      const expires = toDate(w.expires);
      const known = w.phenomenonCode ? PHENOMENA[w.phenomenonCode] : undefined;
      const phenomenon: Msg | string = known ? msg(known) : w.phenomenon.toLocaleLowerCase('es-ES');
      const description = english && w.descriptionEn ? w.descriptionEn : w.description;
      return {
        id: w.id,
        level: w.level,
        title: msg('warning.title', { level: msg(`warning.level.${w.level}`), phenomenon }),
        area: msg(w.coastal ? 'warning.area.coast' : 'warning.area.island'),
        description,
        // Spanish as issued when there is no English version.
        descriptionLang: description === w.description ? 'es' : 'en',
        when:
          toDate(w.onset) <= now
            ? this.inForceUntil(expires, now)
            : timeWindow(w.onset, w.expires, now),
      };
    });
  });

  private inForceUntil(expires: Date, now: Date): Msg {
    const time = { time: expires };
    const day = islandDateKey(expires);
    if (day === islandDateKey(now)) return msg('warning.until.today', { time });
    if (day === islandDateKey(addHours(now, 24))) return msg('warning.until.tomorrow', { time });
    return msg('warning.until.weekday', { weekday: { weekday: expires, style: 'long' }, time });
  }
}
