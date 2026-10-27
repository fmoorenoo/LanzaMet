import { computed, inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MarineSource, WeatherSource } from '../data/data-sources';
import { ClockStore } from './clock.store';
import { DataRefreshStore } from './data-refresh.store';
import { LIVE_DATA } from './live-data';
import { LocationsStore } from './locations.store';
import { sectionState } from './section-state';

/**
 * Forecast for the selected place: weather, sea and tide load independently,
 * so a place without a tide gauge still gets its weather.
 */
@Service()
export class ForecastStore {
  private readonly locations = inject(LocationsStore);
  private readonly clock = inject(ClockStore);
  private readonly refreshStore = inject(DataRefreshStore);
  private readonly weatherSource = inject(WeatherSource);
  private readonly marineSource = inject(MarineSource);

  private readonly live = inject(LIVE_DATA);

  private readonly params = computed(() => {
    const location = this.locations.selected();
    if (!location || !this.live) return undefined;
    return {
      id: location.id,
      beat: this.clock.refreshBeat(),
      version: this.refreshStore.version(),
    };
  });

  private readonly isCurrent = (data: { locationId: string }) =>
    data.locationId === this.locations.selected()?.id;

  private readonly weatherResource = rxResource({
    params: this.params,
    stream: ({ params }) => this.weatherSource.forecast(params.id),
  });

  private readonly seaResource = rxResource({
    params: this.params,
    stream: ({ params }) => this.marineSource.sea(params.id),
  });

  private readonly tideResource = rxResource({
    params: this.params,
    stream: ({ params }) => this.marineSource.tides(params.id),
  });

  readonly weather = sectionState(this.weatherResource, this.isCurrent);
  readonly sea = sectionState(this.seaResource, this.isCurrent);
  readonly tides = sectionState(this.tideResource, this.isCurrent);

  readonly isRefreshing = computed(
    () =>
      this.weatherResource.isLoading() ||
      this.seaResource.isLoading() ||
      this.tideResource.isLoading(),
  );

  retry(): void {
    this.weatherResource.reload();
    this.seaResource.reload();
    this.tideResource.reload();
  }
}
