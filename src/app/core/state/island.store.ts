import { computed, inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { MarineSource, WeatherSource } from '../data/data-sources';
import { islandSummary } from '../insights/island.insight';
import { buildRecommendations } from '../insights/recommendations.insight';
import { LocationId, ZoneConditions } from '../models';
import { ClockStore } from './clock.store';
import { DataRefreshStore } from './data-refresh.store';
import { LocationsStore } from './locations.store';
import { OfficialStore } from './official.store';
import { sectionState } from './section-state';

/**
 * Conditions for every place at once — the island view, the calmest sea and
 * the recommendations. A backend could later serve this as one request.
 */
@Service()
export class IslandStore {
  private readonly locations = inject(LocationsStore);
  private readonly clock = inject(ClockStore);
  private readonly refreshStore = inject(DataRefreshStore);
  private readonly weatherSource = inject(WeatherSource);
  private readonly marineSource = inject(MarineSource);
  private readonly official = inject(OfficialStore);

  private readonly resource = rxResource({
    params: () => {
      const all = this.locations.all();
      if (all.length === 0) return undefined;
      return { all, beat: this.clock.refreshBeat(), version: this.refreshStore.version() };
    },
    stream: ({ params }) =>
      forkJoin(
        params.all.map((location) =>
          forkJoin({
            weather: this.weatherSource.forecast(location.id),
            sea: this.marineSource.sea(location.id),
          }).pipe(map(({ weather, sea }): ZoneConditions => ({ location, weather, sea }))),
        ),
      ),
  });

  readonly zones = sectionState<readonly ZoneConditions[]>(this.resource);

  private readonly list = computed(() => this.zones().data ?? []);

  /** When the island-wide forecast was fetched. */
  readonly updatedAt = computed(() => this.list()[0]?.weather.issuedAt ?? null);

  readonly summary = computed(() => islandSummary(this.list()));

  readonly recommendations = computed(() =>
    buildRecommendations(this.list(), this.clock.now(), {
      coastalWarning: this.official.hasCoastalWarning(),
    }),
  );

  zone(id: LocationId): ZoneConditions | undefined {
    return this.list().find((z) => z.location.id === id);
  }

  retry(): void {
    this.resource.reload();
  }
}
