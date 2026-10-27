import { Component, computed, inject, signal } from '@angular/core';
import { ZoneNavigation } from '../../core/state/zone-navigation';
import { Msg } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { zoneHeadline } from '../../core/insights/island.insight';
import { Location, LocationId, SkyCondition } from '../../core/models';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { HorizontalScroll } from '../../shared/ui/horizontal-scroll/horizontal-scroll';
import { ScrollControls } from '../../shared/ui/horizontal-scroll/scroll-controls';
import { Icon } from '../../shared/ui/icon/icon';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { SkyGlyph } from '../../shared/ui/sky-glyph/sky-glyph';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { Tooltip } from '../../shared/ui/tooltip/tooltip';
import { UiStore } from '../ui.store';

interface PlaceRow {
  readonly location: Location;
  readonly isCurrent: boolean;
  readonly isFavorite: boolean;
  readonly temperature: number | null;
  readonly headline: Msg | null;
  readonly sky: { readonly condition: SkyCondition; readonly isDaylight: boolean } | null;
}

const normalise = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-ES')
    .trim();

/** Fast, visual place switcher: favourites first, then the island by coast. */
@Component({
  selector: 'lm-location-picker',
  imports: [
    Sheet,
    Icon,
    SkyGlyph,
    StatusMessage,
    HorizontalScroll,
    ScrollControls,
    Tooltip,
    TranslatePipe,
  ],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.scss',
})
export class LocationPicker {
  protected readonly ui = inject(UiStore);
  protected readonly locations = inject(LocationsStore);
  private readonly zones = inject(ZoneNavigation);
  private readonly island = inject(IslandStore);

  protected readonly query = signal('');

  private toRow(location: Location): PlaceRow {
    const zone = this.island.zone(location.id);
    return {
      location,
      isCurrent: this.locations.selected()?.id === location.id,
      isFavorite: this.locations.isFavorite(location.id),
      temperature: zone ? Math.round(zone.weather.current.temperatureC) : null,
      headline: zone ? zoneHeadline(zone) : null,
      sky: zone
        ? { condition: zone.weather.current.sky, isDaylight: zone.weather.current.isDaylight }
        : null,
    };
  }

  protected readonly favorites = computed(() =>
    this.locations.favorites().map((l) => this.toRow(l)),
  );

  protected readonly groups = computed(() => {
    const q = normalise(this.query());
    return this.locations
      .byArea()
      .map((group) => ({
        ...group,
        rows: group.locations
          .filter((l) => !q || normalise(`${l.name} ${l.municipality}`).includes(q))
          .map((l) => this.toRow(l)),
      }))
      .filter((group) => group.rows.length > 0);
  });

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected choose(id: LocationId): void {
    // On a place's weather or sea, the address follows the place.
    this.zones.switchTo(id);
    this.ui.locationPickerOpen.set(false);
    this.query.set('');
  }

  protected toggleFavorite(id: LocationId): void {
    this.locations.toggleFavorite(id);
  }
}
