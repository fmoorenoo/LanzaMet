import { computed, inject, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LocationSource } from '../data/data-sources';
import { RETIRED_LOCATIONS } from '../data/locations';
import { IslandArea, Location, LocationId } from '../models';
import { isString, isStringArray, readStored, writeStored } from '../utils/storage';
import { errorMessage } from './section-state';

const DEFAULT_LOCATION: LocationId = 'puerto-del-carmen';
const DEFAULT_FAVORITES: readonly LocationId[] = ['puerto-del-carmen', 'famara', 'playa-blanca'];

export const AREA_LABELS: Readonly<Record<IslandArea, string>> = {
  norte: 'Norte',
  este: 'Este',
  sur: 'Sur',
  oeste: 'Oeste',
};

/** English names for the coasts, used in element ids and `data-area`. */
export const AREA_SLUGS: Readonly<Record<IslandArea, string>> = {
  norte: 'north',
  este: 'east',
  sur: 'south',
  oeste: 'west',
};

const AREA_ORDER: readonly IslandArea[] = ['sur', 'este', 'norte', 'oeste'];

/** A place saved before it was retired from the catalogue becomes the one that replaced it. */
const current = (id: LocationId): LocationId => RETIRED_LOCATIONS[id] ?? id;

const unique = (ids: readonly LocationId[]): LocationId[] => [...new Set(ids)];

export interface AreaGroup {
  readonly area: IslandArea;
  readonly slug: string;
  readonly label: string;
  readonly locations: readonly Location[];
}

/** Known places, the one being looked at, and the visitor's favourites. */
@Service()
export class LocationsStore {
  private readonly source = inject(LocationSource);
  private readonly resource = rxResource({ stream: () => this.source.list() });

  readonly all = computed<readonly Location[]>(() =>
    this.resource.hasValue() ? this.resource.value() : [],
  );
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.status() === 'error' ? errorMessage(this.resource.error()) : null,
  );

  private readonly selectedId = signal<LocationId>(
    current(readStored('selected', isString) ?? DEFAULT_LOCATION),
  );
  private readonly favoriteIds = signal<readonly LocationId[]>(
    unique((readStored('favorites', isStringArray) ?? DEFAULT_FAVORITES).map(current)),
  );

  /** Falls back to the first known place if a stored id no longer exists. */
  readonly selected = computed<Location | null>(() => {
    const all = this.all();
    return all.find((l) => l.id === this.selectedId()) ?? all[0] ?? null;
  });

  readonly favorites = computed<readonly Location[]>(() =>
    this.favoriteIds()
      .map((id) => this.all().find((l) => l.id === id))
      .filter((l): l is Location => l !== undefined),
  );

  readonly byArea = computed<readonly AreaGroup[]>(() =>
    AREA_ORDER.map((area) => ({
      area,
      slug: AREA_SLUGS[area],
      label: AREA_LABELS[area],
      locations: this.all().filter((l) => l.area === area),
    })).filter((group) => group.locations.length > 0),
  );

  byId(id: LocationId): Location | undefined {
    return this.all().find((l) => l.id === id);
  }

  isFavorite(id: LocationId): boolean {
    return this.favoriteIds().includes(id);
  }

  select(id: LocationId): void {
    this.selectedId.set(id);
    writeStored('selected', id);
  }

  toggleFavorite(id: LocationId): void {
    this.favoriteIds.update((ids) =>
      ids.includes(id) ? ids.filter((f) => f !== id) : [...ids, id],
    );
    writeStored('favorites', this.favoriteIds());
  }

  retry(): void {
    this.resource.reload();
  }
}
