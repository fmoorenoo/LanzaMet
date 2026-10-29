import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DATA_MODE } from '../../core/data/http/data-config';
import {
  fromDirection,
  readWind,
  WIND_LEVEL_MAX,
  windHue,
  windShare,
  windTint,
} from '../../core/insights/wind.insight';
import { Msg, msg } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { zonePath } from '../../core/i18n/localized-paths';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { ForecastStore } from '../../core/state/forecast.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { UiStore } from '../../layout/ui.store';
import { HourTimeline } from '../today/hour-timeline/hour-timeline';

/** The hours ahead the gusts are read over. */
const AHEAD_HOURS = 24;

interface WindRow {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly speed: number;
  readonly level: number;
  readonly words: Msg;
  readonly maxGust: number;
  readonly share: number;
  readonly hue: number;
  readonly tint: number;
  readonly isHere: boolean;
}

/** The five steps of the scale, as the colours read them. */
const LEGEND = WIND_LEVEL_MAX.map((max, level) => {
  const from = level === 0 ? 0 : WIND_LEVEL_MAX[level - 1];
  // The colour of the middle of the step (the last one: just past its start).
  const sample = Number.isFinite(max) ? (from + max) / 2 : from + 6;
  return {
    level,
    label: msg(`wind.scale.${level}` as Msg['key']),
    range:
      level === 0
        ? msg('windPage.range.below', { to: max })
        : Number.isFinite(max)
          ? msg('windPage.range', { from, to: max - 1 })
          : msg('windPage.range.above', { from }),
    hue: windHue(sample),
    tint: windTint(sample),
  };
});

/**
 * The wind across the island now: the places from least to most wind (the
 * question "where is it calm today?"), the hours ahead for the chosen place,
 * and how to read it. Outside the tab bar: Hoy leads here from its hours.
 */
@Component({
  selector: 'lm-wind-page',
  host: { id: 'wind-page', class: 'page wind-page' },
  imports: [
    RouterLink,
    NgTemplateOutlet,
    Icon,
    StatusMessage,
    DataCredit,
    HourTimeline,
    TranslatePipe,
  ],
  templateUrl: './wind.page.html',
  styleUrl: './wind.page.scss',
})
export class WindPage {
  protected readonly island = inject(IslandStore);
  protected readonly forecast = inject(ForecastStore);
  protected readonly ui = inject(UiStore);
  private readonly locations = inject(LocationsStore);
  private readonly i18n = inject(I18n);

  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  protected readonly place = this.locations.selected;
  protected readonly legend = LEGEND;

  /** Places from least to most wind now, each with its strongest gust in the hours ahead. */
  protected readonly calmest = computed<readonly WindRow[]>(() => {
    const here = this.place()?.id;
    return (this.island.zones().data ?? [])
      .map(({ location, weather }) => {
        const wind = weather.current.wind;
        const reading = readWind(wind);
        const ahead = weather.hourly.slice(0, AHEAD_HOURS).map((h) => h.wind.gustKmh);
        return {
          id: location.id,
          name: location.name,
          path: zonePath('weather', location.id, this.i18n.lang()),
          speed: Math.round(wind.speedKmh),
          level: reading.level,
          words: reading.level > 0 ? reading.labelFrom : reading.label,
          maxGust: Math.round(Math.max(wind.gustKmh, ...ahead)),
          share: windShare(wind.speedKmh),
          hue: windHue(wind.speedKmh),
          tint: windTint(wind.speedKmh),
          isHere: location.id === here,
        };
      })
      .sort((a, b) => a.speed - b.speed || a.name.localeCompare(b.name));
  });

  /** "Right now it blows least in … and most in …", once there's an island to compare. */
  protected readonly summary = computed(() => {
    const rows = this.calmest();
    if (rows.length < 2) return null;
    const calm = rows[0];
    const windy = rows[rows.length - 1];
    if (calm.speed === windy.speed) return null;
    return msg('windPage.now', {
      calm: calm.name,
      calmKmh: calm.speed,
      windy: windy.name,
      windyKmh: windy.speed,
    });
  });

  /** The chosen place's next hours, as in Hoy. */
  protected readonly hours = computed(
    () => this.forecast.weather().data?.hourly.slice(0, AHEAD_HOURS) ?? [],
  );

  /** An hour chosen in the strip; back to none when the place changes. */
  protected readonly hour = linkedSignal<unknown, number | null>({
    source: () => this.place()?.id,
    computation: () => null,
  });

  /**
   * The verdict of the hour on show: now, or the hour chosen in the strip.
   * "15:00 · Viento flojo del este · 13 km/h, rachas de 35", tinted with the
   * wind's colour, as the strip is.
   */
  protected readonly hourVerdict = computed(() => {
    const index = this.hour();
    const step = this.hours()[index ?? 0];
    if (!step) return null;
    const { wind } = step;
    const reading = readWind(wind);
    return {
      when:
        index === null ? msg('common.now') : msg('common.value', { value: { time: step.time } }),
      words:
        reading.level > 0
          ? msg('wind.labelFrom', { label: reading.label, from: fromDirection(wind.fromDegrees) })
          : reading.label,
      detail: msg('wind.detailGusts', {
        speed: Math.round(wind.speedKmh),
        gust: Math.round(wind.gustKmh),
      }),
      hue: windHue(wind.speedKmh),
      tint: windTint(wind.speedKmh),
    };
  });
}
