import { Component, computed, inject, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';
import { zoneHeadline } from '../../core/insights/island.insight';
import { readSea } from '../../core/insights/sea.insight';
import { dayVerdict } from '../../core/insights/verdict.insight';
import { readWind } from '../../core/insights/wind.insight';
import { LocationId, ZoneConditions } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { zoneScene } from '../../shared/scene/scene-state';
import { Scene } from '../../shared/scene/scene';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { Icon } from '../../shared/ui/icon/icon';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { IslandMap, MapMarker } from './island-map/island-map';

/** The whole island at a glance: where it blows, where it shines, where to go. */
@Component({
  selector: 'qth-zones-page',
  imports: [IslandMap, Scene, Icon, StatusMessage, DataCredit],
  templateUrl: './zones.page.html',
  styleUrl: './zones.page.scss',
  host: { id: 'zones-page', class: 'page zones-page' },
})
export class ZonesPage {
  protected readonly island = inject(IslandStore);
  protected readonly locations = inject(LocationsStore);
  private readonly clock = inject(ClockStore);
  private readonly router = inject(Router);

  /** The place highlighted on the map; starts on the one being followed. */
  protected readonly focusId = linkedSignal<LocationId | null>(
    () => this.locations.selected()?.id ?? null,
  );

  private readonly zones = computed(() => this.island.zones().data ?? []);

  private verdictFor(zone: ZoneConditions) {
    return dayVerdict({
      location: zone.location,
      weather: zone.weather.current,
      upcoming: zone.weather.hourly,
      sea: zone.sea?.current ?? null,
      dayWord: 'Hoy',
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
      headline: zoneHeadline(zone),
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
    if (from === null || zones.length === 0) return 'Sin apenas viento en la isla';
    return `Viento ${readWind({ speedKmh: 20, gustKmh: 20, fromDegrees: from }).from}`;
  });

  protected readonly cards = computed(() => {
    const now = this.clock.now();
    return this.zones().map((zone) => {
      const verdict = this.verdictFor(zone);
      return {
        id: zone.location.id,
        name: zone.location.name,
        municipality: zone.location.municipality,
        summary: zone.location.summary,
        temperature: Math.round(zone.weather.current.temperatureC),
        headline: verdict.headline,
        sentence: verdict.sentence,
        wind: readWind(zone.weather.current.wind).label,
        sea: zone.sea ? readSea(zone.sea.current).label : null,
        scene: zoneScene(zone, now),
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
