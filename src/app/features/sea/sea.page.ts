import { Component, computed, inject } from '@angular/core';
import { ZoneNavigation } from '../../core/state/zone-navigation';
import { ZoneAbout } from '../../shared/zone-about/zone-about';
import { describeWaves, readSea, seaFacets, seaLevelFor } from '../../core/insights/sea.insight';
import { msg, Msg, Param } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { extremesBetween, readTide, tideHeight } from '../../core/insights/tide.insight';
import { DATA_MODE } from '../../core/data/http/data-config';
import { IsoDate, IsoInstant, LocationId, TideKind } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { DayStore } from '../../core/state/day.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { OfficialStore } from '../../core/state/official.store';
import { distanceKm } from '../../core/utils/geo';
import { addHours, islandDateKey, toDate } from '../../core/utils/time';
import { dateFromKey, dayStart, stepAt, zoneAt } from '../../core/insights/moment.insight';
import { DayButton } from '../../shared/ui/day-button/day-button';
import { UiStore } from '../../layout/ui.store';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { WarningBanner } from '../../shared/ui/warning-banner/warning-banner';
import { TideChart } from './tide-chart/tide-chart';

/** The island date of an instant (as written on the page's days). */
function isoDay(at: Date): IsoDate {
  return islandDateKey(at);
}

/** "10:20", "10:20 y 22:45": the times of a day's highs or lows, in one phrase. */
function joinTimes(times: readonly IsoInstant[]): Param | null {
  const [first, ...rest] = times.map((time): Param => ({ time }));
  if (!first) return null;
  return rest.reduce<Param>((a, b) => msg('common.and', { a, b }), first);
}

/** Height of the waves drawn in the "Oleaje" glyph, by sea level. */
const WAVE_AMPLITUDE = [0.8, 2, 3.4, 5, 6.6];

/**
 * The ocean: is the tide coming in or going out, and where is the water calm?
 * Today as it is now; a later day (chosen here, in Hoy or in Zonas) with its
 * whole tide and its sea at midday.
 */
@Component({
  selector: 'lm-sea-page',
  imports: [
    Icon,
    StatusMessage,
    TideChart,
    DataCredit,
    WarningBanner,
    DayButton,
    ZoneAbout,
    TranslatePipe,
  ],
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
  private readonly zones = inject(ZoneNavigation);

  protected readonly days = inject(DayStore);
  protected readonly location = this.locations.selected;
  /** The place the address names (/mar/:zona); null at /mar. */
  protected readonly routeZone = this.zones.routeZone;
  /** The page's subject, for search engines and screen readers. */
  protected readonly heading = computed(() => {
    const zone = this.routeZone();
    return zone ? msg('seo.heading.seaZone', { place: zone.name }) : msg('seo.heading.sea');
  });
  /** The moment the page reads: now, or a later day's midday. */
  protected readonly now = this.days.moment;
  protected readonly dayStart = computed(() => dayStart(this.days.day()));

  /** Today: is the tide rising or falling now. */
  protected readonly reading = computed(() => {
    const tides = this.forecast.tides().data;
    return tides && this.days.isToday() ? readTide(tides, this.clock.now()) : null;
  });

  /** A later day: its highs and lows, said in one line under its title. */
  protected readonly dayTides = computed(() => {
    const tides = this.forecast.tides().data;
    if (!tides || this.days.isToday()) return null;
    const start = this.dayStart();
    const extremes = extremesBetween(tides, start, addHours(start, 24));
    if (extremes.length === 0) return null;
    const times = (kind: TideKind) =>
      joinTimes(extremes.filter((e) => e.kind === kind).map((e) => e.time));
    const high = times('pleamar');
    const low = times('bajamar');
    return {
      title:
        this.days.kind() === 'tomorrow'
          ? msg('seaPage.dayTitle.tomorrow')
          : msg('seaPage.dayTitle', {
              day: { weekday: dateFromKey(this.days.day()), style: 'long' },
            }),
      lead:
        high && low
          ? msg('seaPage.dayLead', { high, low })
          : high
            ? msg('seaPage.dayLead.high', { high })
            : msg('seaPage.dayLead.low', { low: low ?? '' }),
    };
  });

  protected readonly curveTitle = computed(() =>
    msg(this.days.isToday() ? 'seaPage.curve' : 'seaPage.curve.day'),
  );

  protected readonly sun = computed(() => {
    const daily = this.forecast.weather().data?.daily ?? [];
    const day = daily.find((d) => d.date === this.days.day());
    return day?.sunrise && day.sunset
      ? { sunrise: toDate(day.sunrise), sunset: toDate(day.sunset) }
      : null;
  });

  /** Highs and lows of the day on screen and of the day after it, when the forecast reaches it. */
  protected readonly tideDays = computed(() => {
    const tides = this.forecast.tides().data;
    if (!tides) return [];
    const now = this.clock.now();
    const today = this.days.today();
    const first = this.dayStart();
    return [0, 1]
      .map((offset) => {
        const start = dayStart(isoDay(addHours(first, offset * 24 + 12)));
        const date = isoDay(addHours(start, 12));
        return {
          id: date,
          label: msg('common.value', { value: { day: date, today } }),
          extremes: extremesBetween(tides, start, addHours(start, 24)).map((e) => ({
            kind: e.kind,
            name: msg(`tide.kind.${e.kind}`),
            time: e.time,
            height: tideHeight(e.heightM, tides.datum),
            isPast: toDate(e.time) < now,
          })),
        };
      })
      .filter((day) => day.extremes.length > 0);
  });

  /** The sea at the page's moment: now, or the later day's midday. */
  private readonly seaNow = computed(() => {
    const data = this.forecast.sea().data;
    if (!data) return null;
    return this.days.isToday() ? data.current : (stepAt(data.hourly, this.now()) ?? null);
  });

  protected readonly seaTitle = computed(() => {
    const place = this.location()?.name ?? '';
    const kind = this.days.kind();
    if (kind === 'today') return msg('seaPage.seaTitle', { place });
    return msg('seaPage.seaTitle.day', {
      place,
      when:
        kind === 'tomorrow'
          ? msg('seaPage.when.tomorrow')
          : msg('seaPage.when.later', {
              day: { weekday: dateFromKey(this.days.day()), style: 'long' },
            }),
    });
  });

  protected readonly sea = computed(() => {
    const data = this.forecast.sea().data;
    const current = this.seaNow();
    const here = this.location();
    if (!data || !current) return null;
    return {
      ...readSea(current),
      facets: seaFacets(current),
      wavePath: `M2 12q4.5 ${-WAVE_AMPLITUDE[seaLevelFor(current.waveHeightM)]} 9 0t9 0t9 0t9 0t9 0`,
      /** The swell's arrow points where it travels: away from where it comes from. */
      swellTo:
        current.swell && current.swell.heightM >= 0.2
          ? `${(current.swell.fromDegrees + 180) % 360}deg`
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
    const at = this.now();
    const isToday = this.days.isToday();
    const zones = (this.island.zones().data ?? [])
      .map((z) => (isToday ? z : zoneAt(z, at)))
      .flatMap((z) => (z.sea ? [{ location: z.location, sea: z.sea.current }] : []));
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
    if (nearest) this.zones.switchTo(nearest.id);
  }

  protected openDay(id: LocationId): void {
    this.zones.open(id);
  }
}
