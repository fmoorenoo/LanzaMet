import { Component, computed, DestroyRef, effect, inject, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { readSea } from '../../core/insights/sea.insight';
import { readUv } from '../../core/insights/sky.insight';
import { readTide } from '../../core/insights/tide.insight';
import { dayVerdict } from '../../core/insights/verdict.insight';
import { fromDirection, readWind, windTrend } from '../../core/insights/wind.insight';
import { ClockStore } from '../../core/state/clock.store';
import { DataRefreshStore } from '../../core/state/data-refresh.store';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { OfficialStore } from '../../core/state/official.store';
import { ThemeStore } from '../../core/state/theme.store';
import { addHours, formatTime, islandDateKey, toDate } from '../../core/utils/time';
import { PlanItem } from '../../shared/plans/plan-item';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { WarningBanner } from '../../shared/ui/warning-banner/warning-banner';
import { buildScene } from '../../shared/scene/scene-state';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { Conditions, ConditionsView } from './conditions/conditions';
import { DayList } from './day-list/day-list';
import { HourTimeline } from './hour-timeline/hour-timeline';
import { HeroView, TodayHero } from './today-hero/today-hero';

/**
 * "How is today?" — the answer first (sky, words, temperature), then wind,
 * sea and tide, then time. Choosing an hour re-renders the whole scene for
 * that moment.
 */
@Component({
  selector: 'qth-today-page',
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
  private readonly clock = inject(ClockStore);
  private readonly refreshStore = inject(DataRefreshStore);
  private readonly theme = inject(ThemeStore);

  protected readonly location = this.locations.selected;

  /** Hour previewed from the timeline (null = now). Resets when the place changes. */
  protected readonly previewIndex = linkedSignal<string | undefined, number | null>({
    source: () => this.location()?.id,
    computation: () => null,
  });

  protected readonly hours = computed(
    () => this.forecast.weather().data?.hourly.slice(0, 24) ?? [],
  );

  private readonly moment = computed(() => {
    const index = this.previewIndex();
    const hour = index === null ? undefined : this.hours()[index];
    return hour ? toDate(hour.time) : this.clock.now();
  });

  protected readonly view = computed(() => {
    const location = this.location();
    const forecast = this.forecast.weather().data;
    if (!location || !forecast) return null;

    const index = this.previewIndex();
    const weather = index === null ? forecast.current : forecast.hourly[index];
    const seaForecast = this.forecast.sea().data;
    const sea = seaForecast
      ? index === null
        ? seaForecast.current
        : (seaForecast.hourly[index] ?? seaForecast.current)
      : null;
    const tides = this.forecast.tides().data;
    const at = this.moment();
    const tide = tides ? readTide(tides, at) : null;
    const dayKey = islandDateKey(at);
    const day = forecast.daily.find((d) => d.date === dayKey) ?? forecast.daily[0];
    const upcoming = forecast.hourly.slice(index ?? 0);
    const isToday = dayKey === islandDateKey(this.clock.now());
    const wind = readWind(weather.wind);

    const conditions: ConditionsView = {
      wind,
      windTrend: windTrend(weather, upcoming),
      sea: {
        status: this.forecast.sea().status,
        reading: sea ? readSea(sea) : null,
        pending: this.forecast.sea().pending,
      },
      tide: {
        status: tides && !tide ? 'empty' : this.forecast.tides().status,
        reading: tide,
        pending: this.forecast.tides().pending,
        estimated: tides ? !tides.source.official : false,
      },
    };

    return {
      temperature: Math.round(weather.temperatureC),
      verdict: dayVerdict({
        location,
        weather,
        upcoming,
        sea,
        dayWord: isToday ? 'Hoy' : 'Mañana',
      }),
      conditions,
      momentLabel:
        index === null ? 'Ahora' : `${isToday ? 'Hoy' : 'Mañana'} a las ${formatTime(at)}`,
      scene: buildScene({
        location,
        weather,
        sea,
        tideLevel: tide?.level ?? null,
        sunrise: toDate(day.sunrise),
        sunset: toDate(day.sunset),
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
          verdict: v.verdict,
          momentLabel: v.momentLabel,
        }
      : null;
  });

  protected readonly heroError = computed(() => {
    const weather = this.forecast.weather();
    if (weather.status === 'error') return weather.error;
    return this.locations.error();
  });

  /** Secondary facts, in sentences rather than metrics. */
  protected readonly details = computed(() => {
    const forecast = this.forecast.weather().data;
    if (!forecast) return null;
    const today = forecast.daily[0];
    const current = forecast.current;
    const uv = readUv(today.uvMax);
    const strongSun = forecast.hourly.filter(
      (h) => h.uvIndex >= 6 && islandDateKey(toDate(h.time)) === today.date,
    );
    const feels = Math.round(current.feelsLikeC);
    const actual = Math.round(current.temperatureC);
    const sea = this.forecast.sea().data;
    return {
      feels:
        feels === actual
          ? `${feels} °C, lo que marca el termómetro`
          : feels > actual
            ? `${feels} °C: el sol calienta más de lo que parece`
            : `${feels} °C: el viento refresca`,
      sun: strongSun.length
        ? `${uv.label} de ${formatTime(strongSun[0].time)} a ${formatTime(addHours(toDate(strongSun[strongSun.length - 1].time), 1))}. Protégete.`
        : `${uv.label} el resto del día.`,
      water:
        sea?.current.waterTemperatureC != null
          ? `${Math.round(sea.current.waterTemperatureC)} °C`
          : null,
      light: `Amanece a las ${formatTime(today.sunrise)} y anochece a las ${formatTime(today.sunset)}`,
    };
  });

  protected readonly todayKey = computed(() => islandDateKey(this.clock.now()));
  protected readonly topPlans = computed(() => this.island.recommendations().slice(0, 2));
  protected readonly updatedAt = computed(() => this.forecast.weather().data?.issuedAt ?? null);

  /** What a nearby station actually measured — an observation, not the forecast. */
  protected readonly observed = computed(() => {
    const location = this.location();
    const reading = location ? this.official.nearestObservation(location.position) : null;
    if (!reading) return null;
    const parts: string[] = [];
    if (reading.temperatureC !== null) parts.push(`${Math.round(reading.temperatureC)} °C`);
    if (reading.windKmh !== null) {
      parts.push(
        reading.windKmh < 3 || reading.windFromDegrees === null
          ? 'sin apenas viento'
          : `viento ${fromDirection(reading.windFromDegrees)} a ${Math.round(reading.windKmh)} km/h`,
      );
    }
    if (parts.length === 0) return null;
    return {
      value: parts.join(' y '),
      source: `${reading.stationName} (AEMET), a las ${formatTime(reading.time)}`,
    };
  });

  constructor() {
    // The status bar takes the colour of the sky at the top of the screen.
    effect(() => this.theme.paintTop(this.view()?.scene.topHex ?? null));
    inject(DestroyRef).onDestroy(() => this.theme.paintTop(null));
  }

  protected backToNow(): void {
    this.previewIndex.set(null);
  }

  protected refresh(): void {
    this.refreshStore.refresh();
  }

  protected retryAll(): void {
    if (this.locations.error()) this.locations.retry();
    this.forecast.retry();
  }
}
