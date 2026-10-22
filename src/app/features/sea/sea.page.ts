import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { describeWaves, readSea, seaLevelFor } from '../../core/insights/sea.insight';
import { extremesBetween, readTide } from '../../core/insights/tide.insight';
import { Location, LocationId } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { formatTime, islandDayStart, toDate } from '../../core/utils/time';
import { UiStore } from '../../layout/ui.store';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { TideChart } from './tide-chart/tide-chart';

const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

function distanceKm(a: Location, b: Location): number {
  const dLat = (a.position.latitude - b.position.latitude) * 111;
  const dLon = (a.position.longitude - b.position.longitude) * 111 * Math.cos((29 * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/** The ocean: is the tide coming in or going out, and where is the water calm? */
@Component({
  selector: 'qth-sea-page',
  imports: [Icon, StatusMessage, TideChart],
  templateUrl: './sea.page.html',
  styleUrl: './sea.page.scss',
})
export class SeaPage {
  protected readonly ui = inject(UiStore);
  protected readonly forecast = inject(ForecastStore);
  protected readonly island = inject(IslandStore);
  protected readonly locations = inject(LocationsStore);
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
    return today ? { sunrise: toDate(today.sunrise), sunset: toDate(today.sunset) } : null;
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
        height: e.heightM.toLocaleString('es-ES', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
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
    return data ? readSea(data.current) : null;
  });

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
        .sort((a, b) => distanceKm(here, a) - distanceKm(here, b))[0] ?? null
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
