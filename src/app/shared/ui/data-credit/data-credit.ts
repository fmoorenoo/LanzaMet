import { Component, computed, inject, input } from '@angular/core';
import { DATA_MODE } from '../../../core/data/http/data-config';
import { IsoInstant } from '../../../core/models';
import { formatTime } from '../../../core/utils/time';
import { Icon } from '../icon/icon';

export type CreditKind = 'weather' | 'sea' | 'island';

const LABEL: Readonly<Record<CreditKind, string>> = {
  weather: 'Previsión del modelo DWD ICON, de',
  sea: 'Oleaje y marea estimada de modelos de Météo-France, vía',
  island: 'Previsión de cada zona, de',
};

/**
 * Where the data on screen comes from and when it was fetched. Open-Meteo's
 * licence (CC BY 4.0) asks for this credit next to wherever its data appears.
 */
@Component({
  selector: 'qth-data-credit',
  imports: [Icon],
  template: `
    <qth-icon name="info" />
    <span>
      @if (isDemo) {
        Datos ficticios de demostración
      } @else {
        {{ label() }}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>
        (<a
          href="https://creativecommons.org/licenses/by/4.0/deed.es"
          target="_blank"
          rel="noopener"
          >CC BY 4.0</a
        >)
      }
      @if (time(); as t) {
        · consultada a las {{ t }}
      }
    </span>
  `,
  host: { class: 'data-note' },
})
export class DataCredit {
  readonly kind = input<CreditKind>('weather');
  readonly updatedAt = input<IsoInstant | null>(null);

  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  protected readonly label = computed(() => LABEL[this.kind()]);
  protected readonly time = computed(() => {
    const at = this.updatedAt();
    return at ? formatTime(at) : null;
  });
}
