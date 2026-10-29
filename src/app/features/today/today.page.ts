import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ZoneNavigation } from '../../core/state/zone-navigation';
import { ZoneAbout } from '../../shared/zone-about/zone-about';
import { RouterLink } from '@angular/router';
import { msg, Msg } from '../../core/i18n/i18n.model';
import { PathPipe } from '../../core/i18n/path.pipe';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { readSea } from '../../core/insights/sea.insight';
import { readUv, skyPhrase } from '../../core/insights/sky.insight';
import { drawingSunTimes, readDaylight } from '../../core/insights/sun.insight';
import { readTide } from '../../core/insights/tide.insight';
import { dayVerdict } from '../../core/insights/verdict.insight';
import { fromDirection, readWind, windTrend } from '../../core/insights/wind.insight';
import { buildRecommendations } from '../../core/insights/recommendations.insight';
import {
  dateFromKey,
  DAY_HOUR,
  dayKind,
  hoursOfDay,
  stepAt,
  stepsFrom,
  zoneAt,
} from '../../core/insights/moment.insight';
import { DailyForecast, IsoDate } from '../../core/models';
import { DayStore } from '../../core/state/day.store';
import { ClockStore } from '../../core/state/clock.store';
import { DataRefreshStore } from '../../core/state/data-refresh.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { OfficialStore } from '../../core/state/official.store';
import { ThemeStore } from '../../core/state/theme.store';
import { addHours, islandDateKey, islandHour, toDate } from '../../core/utils/time';
import { PlanItem } from '../../shared/plans/plan-item';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { WarningBanner } from '../../shared/ui/warning-banner/warning-banner';
import { buildScene } from '../../shared/scene/scene-state';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { SunPath } from '../../shared/ui/sun-path/sun-path';
import { WebcamLink } from '../../shared/ui/webcam-link/webcam-link';
import { webcamFor } from '../../core/data/webcams';
import { Conditions, ConditionsView } from './conditions/conditions';
import { DayList } from './day-list/day-list';
import { HourTimeline } from './hour-timeline/hour-timeline';
import { WeatherCard } from './share/weather-card';
import { HeroView, TodayHero } from './today-hero/today-hero';

/**
 * What the sun does next, seen from `at`: the time it rises or sets and how
 * long until then; after sunset, tomorrow's sunrise. Null when the provider
 * gave no sun times (the nominal day only lights the drawing, it is never said).
 */
function sunLineAt(daily: readonly DailyForecast[], day: DailyForecast, at: Date): Msg | null {
  if (!day.sunrise || !day.sunset) return null;
  const sunrise = toDate(day.sunrise);
  const sunset = toDate(day.sunset);
  if (at < sunrise) {
    return msg('today.sun.rises', {
      time: { time: sunrise },
      duration: { duration: sunrise.getTime() - at.getTime() },
    });
  }
  if (at < sunset) {
    return msg('today.sun.sets', {
      time: { time: sunset },
      duration: { duration: sunset.getTime() - at.getTime() },
    });
  }
  const next = daily[daily.indexOf(day) + 1];
  return next?.sunrise ? msg('sun.tomorrow', { time: { time: next.sunrise } }) : null;
}

/** A later day's light, said whole: "Amanece a las 07:05 y atardece a las 18:12." */
function sunLineOf(day: DailyForecast): Msg | null {
  return day.sunrise && day.sunset
    ? msg('today.sun.day', { sunrise: { time: day.sunrise }, sunset: { time: day.sunset } })
    : null;
}

/**
 * "How is today?" — the answer first (sky, words, temperature), then wind,
 * sea and tide, then time. Choosing an hour re-renders the whole scene for
 * that moment.
 */
@Component({
  selector: 'lm-today-page',
  imports: [
    RouterLink,
    TodayHero,
    Icon,
    StatusMessage,
    Conditions,
    HourTimeline,
    DayList,
    PlanItem,
    DataCredit,
    WarningBanner,
    SunPath,
    WebcamLink,
    ZoneAbout,
    TranslatePipe,
    PathPipe,
  ],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  host: { id: 'today-page', class: 'page today-page' },
})
export class TodayPage {
  protected readonly locations = inject(LocationsStore);
  protected readonly forecast = inject(ForecastStore);
  protected readonly island = inject(IslandStore);
  protected readonly official = inject(OfficialStore);
  protected readonly days = inject(DayStore);
  private readonly clock = inject(ClockStore);
  private readonly refreshStore = inject(DataRefreshStore);
  private readonly theme = inject(ThemeStore);

  protected readonly location = this.locations.selected;
  /** The place the address names (/tiempo/:zona); null at /. */
  protected readonly routeZone = inject(ZoneNavigation).routeZone;
  /** The page's subject, for search engines and screen readers. */
  protected readonly heading = computed(() => {
    const zone = this.routeZone();
    return zone ? msg('seo.heading.weatherZone', { place: zone.name }) : msg('seo.heading.today');
  });

  private readonly hero = viewChild.required(TodayHero);

  /**
   * Hour chosen in the timeline, as an index into `hours()`; null means the
   * day's own moment (now, or a later day's midday). Resets with the place
   * and with the day.
   */
  protected readonly previewIndex = linkedSignal<string, number | null>({
    source: () => `${this.location()?.id ?? ''}|${this.days.day()}`,
    computation: () => null,
  });

  /** The hours offered: today's next 24, or the 24 hours of a later day. */
  protected readonly hours = computed(() => {
    const hourly = this.forecast.weather().data?.hourly ?? [];
    return this.days.isToday() ? hourly.slice(0, 24) : hoursOfDay(hourly, this.days.day());
  });

  /** Where the timeline rests with no hour chosen: now, or the later day's midday. */
  protected readonly restIndex = computed(() => {
    if (this.days.isToday()) return 0;
    const hours = this.hours();
    const noon = hours.findIndex((h) => islandHour(toDate(h.time)) === DAY_HOUR);
    return noon === -1 ? Math.floor(hours.length / 2) : noon;
  });

  /** The scene is not now: an hour chosen, or a later day. */
  protected readonly isAway = computed(() => this.previewIndex() !== null || !this.days.isToday());

  private readonly moment = computed(() => {
    const index = this.previewIndex();
    const hour = index === null ? undefined : this.hours()[index];
    return hour ? toDate(hour.time) : this.days.moment();
  });

  protected readonly view = computed(() => {
    const location = this.location();
    const forecast = this.forecast.weather().data;
    if (!location || !forecast) return null;

    const live = !this.isAway();
    const at = this.moment();
    const weather = live ? forecast.current : (stepAt(forecast.hourly, at) ?? forecast.current);
    const seaForecast = this.forecast.sea().data;
    const sea = seaForecast
      ? live
        ? seaForecast.current
        : (stepAt(seaForecast.hourly, at) ?? null)
      : null;
    const tides = this.forecast.tides().data;
    const tide = tides ? readTide(tides, at) : null;
    const today = this.days.today();
    const dayKey = islandDateKey(at);
    const day = forecast.daily.find((d) => d.date === dayKey) ?? forecast.daily[0];
    const upcoming = stepsFrom(forecast.hourly, at);
    const wind = readWind(weather.wind);
    const sun = drawingSunTimes(day, at);

    const conditions: ConditionsView = {
      wind,
      windTrend: windTrend(weather, upcoming),
      sea: {
        status: seaForecast && !sea ? 'empty' : this.forecast.sea().status,
        reading: sea ? readSea(sea) : null,
        pending: this.forecast.sea().pending,
      },
      tide: {
        status: tides && !tide ? 'empty' : this.forecast.tides().status,
        reading: tide,
        pending: this.forecast.tides().pending,
        estimated: tides ? !tides.source.official : false,
        countdown: this.days.isToday(),
      },
    };

    const dayName = msg('common.value', { value: { day: dayKey, today } });
    return {
      weather,
      // The clock names the moment's day only when the day button doesn't.
      moment: { at, day: dayKey === this.days.day() ? null : dayName, isNow: live },
      sunLine: this.days.isToday() ? sunLineAt(forecast.daily, day, at) : sunLineOf(day),
      temperature: Math.round(weather.temperatureC),
      range: { max: day.maxC, min: day.minC },
      verdict: dayVerdict({
        location,
        weather,
        upcoming,
        sea,
        day: dayKind(dayKey, today),
        at,
        sun,
      }),
      conditions,
      momentLabel: live ? msg('common.now') : msg('time.at', { day: dayName, time: { time: at } }),
      scene: buildScene({
        location,
        weather,
        sea,
        tideLevel: tide?.level ?? null,
        ...sun,
        at,
      }),
    };
  });

  protected readonly heroView = computed<HeroView | null>(() => {
    const v = this.view();
    return v
      ? {
          scene: v.scene,
          temperature: v.temperature,
          condition: skyPhrase(v.weather.sky, v.weather.isDaylight),
          wind: v.weather.wind,
          range: v.range,
          verdict: v.verdict,
          momentLabel: v.momentLabel,
          moment: v.moment,
          sunLine: v.sunLine,
        }
      : null;
  });

  /** The card the share button sends: what the hero and the conditions below it show. */
  protected readonly shareCard = computed<WeatherCard | null>(() => {
    const v = this.view();
    const location = this.location();
    if (!v || !location) return null;
    const { sea, tide, wind } = v.conditions;
    return {
      place: location.name,
      at: v.moment.at,
      isNow: v.moment.isNow,
      today: this.days.today(),
      scene: v.scene,
      temperature: v.temperature,
      feelsLike: Math.round(v.weather.feelsLikeC),
      range: v.range,
      sky: v.weather.sky,
      isDaylight: v.weather.isDaylight,
      verdict: v.verdict,
      wind,
      sea: sea.status === 'ready' ? sea.reading : null,
      tide:
        tide.status === 'ready' && tide.reading
          ? { reading: tide.reading, estimated: tide.estimated }
          : null,
    };
  });

  protected readonly heroError = computed(() => {
    const weather = this.forecast.weather();
    if (weather.status === 'error') return weather.error;
    return this.locations.error();
  });

  /** The chosen day's sunrise and sunset; today's follow the clock. */
  protected readonly daylight = computed(() =>
    readDaylight(this.forecast.weather().data?.daily ?? [], this.clock.now(), this.days.day()),
  );

  /** Section titles that name the day once it is not today. */
  protected readonly titles = computed(() => {
    const kind = this.days.kind();
    const day = this.days.label();
    if (kind === 'today') {
      return {
        hours: msg('today.hours'),
        plans: msg('today.plans'),
        noPlan: msg('today.noPlan'),
        details: msg('today.details'),
      };
    }
    return {
      hours: msg('today.hours.day', { day }),
      plans:
        kind === 'tomorrow'
          ? msg('today.plans.tomorrow')
          : msg('today.plans.later', {
              day: { weekday: dateFromKey(this.days.day()), style: 'long' },
            }),
      noPlan: msg('today.noPlan.day'),
      details: msg('today.details.day', { day }),
    };
  });

  /** Secondary facts for the day on screen, in sentences rather than metrics. */
  protected readonly details = computed(() => {
    const forecast = this.forecast.weather().data;
    if (!forecast) return null;
    const isToday = this.days.isToday();
    const day = forecast.daily.find((d) => d.date === this.days.day()) ?? forecast.daily[0];
    // Today, as it is now; a later day, at its midday.
    const at = this.days.moment();
    const current = isToday ? forecast.current : (stepAt(forecast.hourly, at) ?? forecast.current);
    const uv = readUv(day.uvMax);
    const strongSun = forecast.hourly.filter(
      (h) => h.uvIndex >= 6 && islandDateKey(toDate(h.time)) === day.date,
    );
    const feels = Math.round(current.feelsLikeC);
    const actual = Math.round(current.temperatureC);
    const sea = this.forecast.sea().data;
    const seaNow = sea ? (isToday ? sea.current : stepAt(sea.hourly, at)) : undefined;
    // Warmer than it reads: in daylight that is the sun, at night only the air.
    const warmer = current.isDaylight ? 'fact.feels.sun' : 'fact.feels.mild';
    const sunHasSet = isToday && this.daylight()?.phase === 'after-sunset';
    let sun: Msg;
    if (strongSun.length > 0) {
      sun = msg('fact.uv.window', {
        uv: uv.label,
        from: { time: strongSun[0].time },
        to: { time: addHours(toDate(strongSun[strongSun.length - 1].time), 1) },
      });
    } else {
      sun = sunHasSet
        ? msg('fact.uv.night')
        : msg(isToday ? 'fact.uv.rest' : 'fact.uv.day', { uv: uv.label });
    }
    return {
      feels: msg(
        feels === actual ? 'fact.feels.same' : feels > actual ? warmer : 'fact.feels.wind',
        {
          temp: feels,
        },
      ),
      sun,
      water:
        seaNow?.waterTemperatureC != null
          ? msg('common.celsius', { value: Math.round(seaNow.waterTemperatureC) })
          : null,
    };
  });

  /** The place's id when a public live camera shows it; the facts then link to it. */
  protected readonly webcam = computed(() => {
    if (!this.days.isToday()) return null;
    const id = this.location()?.id;
    return id && webcamFor(id) ? id : null;
  });

  /**
   * Two plans for the day on screen: today's from the island's own list (the
   * one Dónde ir shows); a later day's read from the same rules, with every
   * place as the forecast sees it at that day's midday.
   */
  protected readonly topPlans = computed(() => {
    if (this.days.isToday()) return this.island.recommendations().slice(0, 2);
    const from = this.days.from();
    const at = this.days.moment();
    const zones = (this.island.zones().data ?? []).map((z) => zoneAt(z, at, from));
    return buildRecommendations(zones, from).slice(0, 2);
  });
  protected readonly updatedAt = computed(() => this.forecast.weather().data?.issuedAt ?? null);

  /** What a nearby station actually measured — an observation, not the forecast. */
  protected readonly observed = computed(() => {
    if (!this.days.isToday()) return null;
    const location = this.location();
    const reading = location ? this.official.nearestObservation(location.position) : null;
    if (!reading) return null;
    const parts: Msg[] = [];
    if (reading.temperatureC !== null) {
      parts.push(msg('common.celsius', { value: Math.round(reading.temperatureC) }));
    }
    if (reading.windKmh !== null) {
      parts.push(
        reading.windKmh < 3 || reading.windFromDegrees === null
          ? msg('fact.observed.calm')
          : msg('fact.observed.wind', {
              from: fromDirection(reading.windFromDegrees),
              speed: Math.round(reading.windKmh),
            }),
      );
    }
    if (parts.length === 0) return null;
    return {
      value: parts.length === 2 ? msg('common.and', { a: parts[0], b: parts[1] }) : parts[0],
      source: msg('fact.observed.source', {
        station: reading.stationName,
        time: { time: reading.time },
      }),
    };
  });

  constructor() {
    // The status bar takes the colour of the sky at the top of the screen.
    effect(() => this.theme.paintTop(this.view()?.scene.topHex ?? null));
    inject(DestroyRef).onDestroy(() => this.theme.paintTop(null));
  }

  /** "Ahora": back to today, as it is now. */
  protected backToNow(): void {
    this.days.reset();
    this.previewIndex.set(null);
  }

  /**
   * A day chosen in the week's list: it fills the screen from the top, and
   * focus goes to the day button there, which says which day it is.
   */
  protected chooseDay(day: IsoDate): void {
    this.days.select(day);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    this.hero().focusDay();
  }

  protected refresh(): void {
    this.refreshStore.refresh();
  }

  protected retryAll(): void {
    if (this.locations.error()) this.locations.retry();
    this.forecast.retry();
  }
}
