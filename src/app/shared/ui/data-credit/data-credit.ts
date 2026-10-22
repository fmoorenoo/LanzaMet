import { Component, computed, inject, input } from '@angular/core';
import { DATA_MODE } from '../../../core/data/http/data-config';
import { MessageKey } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { IsoInstant } from '../../../core/models';
import { Icon } from '../icon/icon';

export type CreditKind = 'weather' | 'sea' | 'island';

const LABEL: Readonly<Record<CreditKind, MessageKey>> = {
  weather: 'credit.weather',
  sea: 'credit.sea',
  island: 'credit.island',
};

/**
 * Where the data on screen comes from and when it was fetched. Open-Meteo's
 * licence (CC BY 4.0) asks for this credit next to wherever its data appears.
 */
@Component({
  selector: 'qth-data-credit',
  imports: [Icon, TranslatePipe],
  template: `
    <qth-icon name="info" />
    <span>
      @if (isDemo) {
        {{ 'credit.demo' | t }}
      } @else {
        {{ label() | t }}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>
        (<a [href]="'credit.licenceUrl' | t" target="_blank" rel="noopener">CC BY 4.0</a>)
      }
      @if (updatedAt(); as at) {
        {{ 'credit.fetched' | t: { time: { time: at } } }}
      }
    </span>
  `,
  host: { class: 'data-note data-credit', '[attr.data-kind]': 'kind()' },
})
export class DataCredit {
  readonly kind = input<CreditKind>('weather');
  readonly updatedAt = input<IsoInstant | null>(null);

  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  protected readonly label = computed(() => LABEL[this.kind()]);
}
