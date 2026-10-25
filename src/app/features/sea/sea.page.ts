import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { describeWaves, readSea, seaFacets, seaLevelFor } from '../../core/insights/sea.insight';
import { msg, Msg } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { extremesBetween, readTide, tideHeight } from '../../core/insights/tide.insight';
import { DATA_MODE } from '../../core/data/http/data-config';
import { LocationId } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { OfficialStore } from '../../core/state/official.store';
import { distanceKm } from '../../core/utils/geo';
import { islandDayStart, toDate } from '../../core/utils/time';
import { UiStore } from '../../layout/ui.store';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { WarningBanner } from '../../shared/ui/warning-banner/warning-banner';
import { TideChart } from './tide-chart/tide-chart';

/** Height of the waves drawn in the "Oleaje" glyph, by sea level. */
const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

/** The ocean: is the tide coming in or going out, and where is the water calm? */
@Component({
  selector: 'lm-sea-page',
  imports: [Icon, StatusMessage, TideChart, DataCredit, WarningBanner, TranslatePipe],
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
      {
        id: 'today',
        label: msg('day.today'),
        start: islandDayStart(now, 0),
        end: islandDayStart(now, 1),
      },
      {
        id: 'tomorrow',
        label: msg('day.tomorrow'),
        start: islandDayStart(now, 1),
        end: islandDayStart(now, 2),
      },
    ].map((day) => ({
      id: day.id,
      label: day.label,
      extremes: extremesBetween(tides, day.start, day.end).map((e) => ({
        kind: e.kind,
        name: msg(`tide.kind.${e.kind}`),
        time: e.time,
        height: tideHeight(e.heightM, tides.datum),
        isPast: toDate(e.time) < now,
      })),
    }));
  });

  protected readonly sea = computed(() => {
    const data = this.forecast.sea().data;
    const here = this.location();
    if (!data) return null;
    return {
      ...readSea(data.current),
      facets: seaFacets(data.current),
      wavePath: `M2 12q4.5 ${-WAVE_AMPLITUDE[seaLevelFor(data.current.waveHeightM)]} 9 0t9 0t9 0t9 0t9 0`,
      /** The swell's arrow points where it travels: away from where it comes from. */
      swellTo:
        data.current.swell && data.current.swell.heightM >= 0.2
          ? `${(data.current.swell.fromDegrees + 180) % 360}deg`
          : null,
      /** Marine models describe open water, not the shoreline; say how far out. */
      offshoreKm: here ? Math.round(distanceKm(here.position, data.point)) : null,
    };
  });

  /**
   * An official source is named under the curve. A model's estimate says so
   * in the headings ("estimadas") and in the credit at the foot of the page,
   * not in the chart itself.
   */
  protected readonly tideSource = computed<Msg[]>(() => {
    const tides = this.forecast.tides().data;
    if (!tides) return [];
    const { source } = tides;
    return [
      ...(source.official
        ? [
            msg(source.kind === 'station' ? 'seaPage.source.station' : 'seaPage.source.reference', {
              name: source.name,
            }),
          ]
        : []),
      ...(this.isDemo ? [msg('seaPage.source.demo')] : []),
    ];
  });

  protected readonly coastalWarnings = computed(() =>
    this.official.warnings().filter((w) => w.coastal),
  );

  /**
   * Places ordered from calmest to roughest water, each with a bar of its
   * wave height against the roughest (never less than 1 m at the top, so a
   * calm day's ripples don't fill the bars, yet 20 cm and 40 cm still differ).
   */
  protected readonly calmest = computed(() => {
    const zones = (this.island.zones().data ?? []).flatMap((z) =>
      z.sea ? [{ location: z.location, sea: z.sea.current }] : [],
    );
    const top = Math.max(1, ...zones.map((z) => z.sea.waveHeightM));
    return zones
      .map((z) => {
        const height = z.sea.waveHeightM;
        return {
          id: z.location.id,
          name: z.location.name,
          level: seaLevelFor(height),
          label: readSea(z.sea).label,
          waves: describeWaves(height),
          height,
          share: Math.max(0.04, height / top).toFixed(3),
          isHere: z.location.id === this.location()?.id,
        };
      })
      .sort((a, b) => a.height - b.height);
  });

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
