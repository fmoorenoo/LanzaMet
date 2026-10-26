import { Component, computed, inject, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';
import { msg } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { islandSummary, zoneHeadline } from '../../core/insights/island.insight';
import { stepsFrom, zoneAt } from '../../core/insights/moment.insight';
import { readSea } from '../../core/insights/sea.insight';
import { drawingSunTimes } from '../../core/insights/sun.insight';
import { dayVerdict } from '../../core/insights/verdict.insight';
import { readWind } from '../../core/insights/wind.insight';
import { LocationId, ZoneConditions } from '../../core/models';
import { DayStore } from '../../core/state/day.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { zoneScene } from '../../shared/scene/scene-state';
import { Scene } from '../../shared/scene/scene';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { DayButton } from '../../shared/ui/day-button/day-button';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { Tooltip } from '../../shared/ui/tooltip/tooltip';
import { WebcamLink } from '../../shared/ui/webcam-link/webcam-link';
import { WindGauge } from '../../shared/ui/wind-gauge/wind-gauge';
import { IslandMap, MapMarker } from './island-map/island-map';

/**
 * The whole island at a glance: where it blows, where it shines, where to go.
 * Today as it is now; a later day chosen above (or anywhere else) at its midday.
 */
@Component({
  selector: 'lm-zones-page',
  imports: [
    IslandMap,
    Scene,
    Icon,
    StatusMessage,
    DataCredit,
    Tooltip,
    WindGauge,
    WebcamLink,
    DayButton,
    TranslatePipe,
  ],
  templateUrl: './zones.page.html',
  styleUrl: './zones.page.scss',
  host: { id: 'zones-page', class: 'page zones-page' },
})
export class ZonesPage {
  protected readonly island = inject(IslandStore);
  protected readonly locations = inject(LocationsStore);
  protected readonly days = inject(DayStore);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  /** The place highlighted on the map; starts on the one being followed. */
  protected readonly focusId = linkedSignal<LocationId | null>(
    () => this.locations.selected()?.id ?? null,
  );

  /** Every place at the day's moment: as it is now, or as the forecast sees that day's midday. */
  private readonly zones = computed(() => {
    const zones = this.island.zones().data ?? [];
    if (this.days.isToday()) return zones;
    const at = this.days.moment();
    const from = this.days.from();
    return zones.map((z) => zoneAt(z, at, from));
  });

  protected readonly summary = computed(() => islandSummary(this.zones()));

  private verdictFor(zone: ZoneConditions) {
    const at = this.days.moment();
    const day = zone.weather.daily.find((d) => d.date === this.days.day());
    return dayVerdict({
      location: zone.location,
      weather: zone.weather.current,
      upcoming: stepsFrom(zone.weather.hourly, at),
      sea: zone.sea?.current ?? null,
      day: this.days.kind(),
      at,
      sun: drawingSunTimes(day, at),
    });
  }

  protected readonly markers = computed<readonly MapMarker[]>(() =>
    this.zones().map((zone) => ({
      id: zone.location.id,
      name: zone.location.name,
      latitude: zone.location.position.latitude,
      longitude: zone.location.position.longitude,
      temperature: Math.round(zone.weather.current.temperatureC),
      sky: zone.weather.current.sky,
      isDaylight: zone.weather.current.isDaylight,
      mood: this.verdictFor(zone).mood,
      // Spoken by the marker's accessible name, so it is plain text.
      headline: this.i18n.t(zoneHeadline(zone)),
    })),
  );

  /** The wind that shapes the island today, read where it blows unobstructed. */
  protected readonly windFrom = computed(() => {
    const zones = this.zones();
    if (zones.length === 0) return null;
    const strongest = [...zones].sort(
      (a, b) => b.weather.current.wind.speedKmh - a.weather.current.wind.speedKmh,
    )[0];
    return strongest.weather.current.wind.speedKmh < 8
      ? null
      : strongest.weather.current.wind.fromDegrees;
  });

  protected readonly windCaption = computed(() => {
    const zones = this.zones();
    const from = this.windFrom();
    if (from === null || zones.length === 0) return msg('zones.calm');
    return msg('zones.wind', {
      from: readWind({ speedKmh: 20, gustKmh: 20, fromDegrees: from }).from,
    });
  });

  protected readonly cards = computed(() => {
    const at = this.days.moment();
    return this.zones().map((zone) => {
      const verdict = this.verdictFor(zone);
      return {
        id: zone.location.id,
        name: zone.location.name,
        municipality: zone.location.municipality,
        temperature: Math.round(zone.weather.current.temperatureC),
        headline: verdict.headline,
        sentence: verdict.sentence,
        wind: zone.weather.current.wind,
        sea: zone.sea ? readSea(zone.sea.current).label : null,
        scene: zoneScene(zone, at),
        isFavorite: this.locations.isFavorite(zone.location.id),
      };
    });
  });

  protected readonly focused = computed(
    () => this.cards().find((c) => c.id === this.focusId()) ?? null,
  );

  protected openDay(id: LocationId): void {
    this.locations.select(id);
    void this.router.navigateByUrl('/');
  }

  protected toggleFavorite(id: LocationId): void {
    this.locations.toggleFavorite(id);
  }
}
