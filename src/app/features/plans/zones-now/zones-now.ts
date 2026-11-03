import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Msg, msg } from '../../../core/i18n/i18n.model';
import { I18n } from '../../../core/i18n/i18n.store';
import { zonePath } from '../../../core/i18n/localized-paths';
import { PathPipe } from '../../../core/i18n/path.pipe';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { seaLevelFor } from '../../../core/insights/sea.insight';
import { byShelter } from '../../../core/insights/shelter.insight';
import { readWind, windHue, windTint } from '../../../core/insights/wind.insight';
import { IslandStore } from '../../../core/state/island.store';
import { LocationsStore } from '../../../core/state/locations.store';
import { Icon } from '../../../shared/ui/icon/icon';

interface ZoneRow {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  /** Null until the island's forecast arrives (the names are there from the start). */
  readonly now: {
    readonly windKmh: number;
    readonly windWord: Msg;
    readonly hue: number;
    readonly tint: number;
    readonly seaWord: Msg | null;
    readonly waves: Msg | null;
    readonly water: Msg | null;
  } | null;
}

/**
 * Every place at once, for choosing where to go: wind, sea and water in one
 * table, from the most sheltered to the roughest. The names and links are in
 * the page from the first byte (search engines read them); the figures fill
 * in when the forecast arrives.
 */
@Component({
  selector: 'lm-zones-now',
  host: { class: 'zones-now' },
  imports: [RouterLink, Icon, TranslatePipe, PathPipe],
  templateUrl: './zones-now.html',
  styleUrl: './zones-now.scss',
})
export class ZonesNow {
  protected readonly island = inject(IslandStore);
  private readonly locations = inject(LocationsStore);
  private readonly i18n = inject(I18n);

  protected readonly loading = computed(() => {
    const status = this.island.zones().status;
    return status !== 'ready' && status !== 'error';
  });

  protected readonly rows = computed<readonly ZoneRow[]>(() => {
    const lang = this.i18n.lang();
    const zones = this.island.zones().data;
    if (!zones?.length) {
      return this.locations.all().map((location) => ({
        id: location.id,
        name: location.name,
        path: zonePath('weather', location.id, lang),
        now: null,
      }));
    }
    return byShelter(zones).map(({ location, weather, sea }) => {
      const wind = weather.current.wind;
      const seaNow = sea?.current ?? null;
      const water = seaNow?.waterTemperatureC ?? null;
      return {
        id: location.id,
        name: location.name,
        path: zonePath('weather', location.id, lang),
        now: {
          windKmh: Math.round(wind.speedKmh),
          windWord: readWind(wind).scale,
          hue: windHue(wind.speedKmh),
          tint: windTint(wind.speedKmh),
          seaWord: seaNow ? msg(`plans.zones.sea.${seaLevelFor(seaNow.waveHeightM)}`) : null,
          waves: seaNow
            ? msg('plans.zones.waves', { height: { decimal: seaNow.waveHeightM, digits: 1 } })
            : null,
          water: water === null ? null : msg('plans.zones.temp', { temp: Math.round(water) }),
        },
      };
    });
  });
}
