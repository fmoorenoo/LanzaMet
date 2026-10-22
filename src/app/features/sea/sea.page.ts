import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { describeWaves, readSea, seaLevelFor } from '../../core/insights/sea.insight';
import { extremesBetween, formatTideHeight, readTide } from '../../core/insights/tide.insight';
import { DATA_MODE } from '../../core/data/http/data-config';
import { LocationId } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { OfficialStore } from '../../core/state/official.store';
import { distanceKm } from '../../core/utils/geo';
import { formatTime, islandDayStart, toDate } from '../../core/utils/time';
import { UiStore } from '../../layout/ui.store';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { WarningBanner } from '../../shared/ui/warning-banner/warning-banner';
import { TideChart } from './tide-chart/tide-chart';

const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

/** The ocean: is the tide coming in or going out, and where is the water calm? */
@Component({
  selector: 'qth-sea-page',
  imports: [Icon, StatusMessage, TideChart, DataCredit, WarningBanner],
  templateUrl: './sea.page.html',
  styleUrl: './sea.page.scss',
  host: { id: 'sea-page', class: 'page sea-page' },
})
export class SeaPage {
  protected readonly ui = inject(UiStore);
  protected readonly forecast = inject(ForecastStore);
  protected readonly island = inject(IslandStore);
  protected readonly locations = inject(LocationsStore);
  protected readonly official = inject(OfficialStore);
  private readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly clock = inject(ClockStore);
  private readonly router = inject(Router);

  protected readonly location = this.locations.selected;
  protected readonly now = this.clock.now;
  protected readonly dayStart = computed(() => islandDayStart(this.clock.now()));

  protected readonly reading = computed(() => {
    const tides = this.forecast.tides().data;
    return tides ? readTide(tides, this.clock.now()) : null;
  });

  protected readonly sun = computed(() => {
    const today = this.forecast.weather().data?.daily[0];
    return today?.sunrise && today.sunset
      ? { sunrise: toDate(today.sunrise), sunset: toDate(today.sunset) }
      : null;
  });

  protected readonly days = computed(() => {
    const tides = this.forecast.tides().data;
    if (!tides) return [];
    const now = this.clock.now();
    return [
      { label: 'Hoy', start: islandDayStart(now, 0), end: islandDayStart(now, 1) },
      { label: 'Mañana', start: islandDayStart(now, 1), end: islandDayStart(now, 2) },
    ].map((day) => ({
      label: day.label,
      extremes: extremesBetween(tides, day.start, day.end).map((e) => ({
        kind: e.kind,
        time: formatTime(e.time),
        height: formatTideHeight(e.heightM, tides.datum),
        isPast: toDate(e.time) < now,
      })),
    }));
  });

  protected readonly gaugeLevel = computed(() => {
    const level = this.reading()?.level ?? 0.5;
    return `translate3d(0, ${((1 - level) * 78).toFixed(1)}%, 0)`;
  });

  protected readonly sea = computed(() => {
    const data = this.forecast.sea().data;
    const here = this.location();
    if (!data) return null;
    return {
      ...readSea(data.current),
      /** Marine models describe open water, not the shoreline; say how far out. */
      offshoreKm: here ? Math.round(distanceKm(here.position, data.point)) : null,
    };
  });

  /** Where the tide comes from, said plainly — an estimate is never passed off as official. */
  protected readonly tideSource = computed(() => {
    const tides = this.forecast.tides().data;
    if (!tides) return null;
    const { source } = tides;
    const origin = source.official
      ? `${source.kind === 'station' ? 'Mareógrafo' : 'Predicción de referencia'}: ${source.name}.`
      : `Estimación del ${source.name.charAt(0).toLocaleLowerCase('es-ES')}${source.name.slice(1)}. No es una tabla oficial ni sirve para navegar.`;
    const datum = tides.datum === 'mean-sea-level' ? ' Alturas sobre el nivel medio del mar.' : '';
    return `${origin}${datum}${this.isDemo ? ' Datos ficticios.' : ''}`;
  });

  protected readonly coastalWarnings = computed(() =>
    this.official.warnings().filter((w) => w.coastal),
  );

  /** Places ordered from calmest to roughest water. */
  protected readonly calmest = computed(() =>
    (this.island.zones().data ?? [])
      .flatMap((z) => (z.sea ? [{ location: z.location, sea: z.sea.current }] : []))
      .map((z) => {
        const height = z.sea.waveHeightM;
        const amplitude = WAVE_AMPLITUDE[seaLevelFor(height)];
        return {
          id: z.location.id,
          name: z.location.name,
          label: readSea(z.sea).label,
          waves: describeWaves(height),
          height,
          path: `M2 12q4.5 ${-amplitude} 9 0t9 0t9 0t9 0t9 0`,
        };
      })
      .sort((a, b) => a.height - b.height),
  );

  /** For places without tide data: the closest place that has it. */
  protected readonly nearestWithTide = computed(() => {
    const here = this.location();
    if (!here || here.coverage.tide.kind !== 'none') return null;
    return (
      this.locations
        .all()
        .filter((l) => l.coverage.tide.kind !== 'none')
        .sort(
          (a, b) => distanceKm(here.position, a.position) - distanceKm(here.position, b.position),
        )[0] ?? null
    );
  });

  protected goToNearest(): void {
    const nearest = this.nearestWithTide();
    if (nearest) this.locations.select(nearest.id);
  }

  protected openDay(id: LocationId): void {
    this.locations.select(id);
    void this.router.navigateByUrl('/');
  }
}
