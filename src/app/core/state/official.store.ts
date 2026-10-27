import { computed, inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ObservationSource, WarningSource } from '../data/data-sources';
import { representativeObservation } from '../insights/observation.insight';
import { GeoPoint, StationObservation, WarningLevel, WeatherWarning } from '../models';
import { toDate } from '../utils/time';
import { ClockStore } from './clock.store';
import { DataRefreshStore } from './data-refresh.store';
import { LIVE_DATA } from './live-data';
import { sectionState } from './section-state';

const LEVEL_ORDER: Readonly<Record<WarningLevel, number>> = { rojo: 3, naranja: 2, amarillo: 1 };

/**
 * What the national weather service says officially: warnings in force for
 * the island, and what its stations measured. Both may be unavailable (the
 * app's API not deployed, no credentials); that's `empty`, not an error.
 */
@Service()
export class OfficialStore {
  private readonly clock = inject(ClockStore);
  private readonly refreshStore = inject(DataRefreshStore);
  private readonly warningSource = inject(WarningSource);
  private readonly observationSource = inject(ObservationSource);

  private readonly live = inject(LIVE_DATA);

  private readonly params = computed(() =>
    this.live
      ? { beat: this.clock.refreshBeat(), version: this.refreshStore.version() }
      : undefined,
  );

  private readonly warningsResource = rxResource({
    params: this.params,
    stream: () => this.warningSource.active(),
  });

  private readonly observationsResource = rxResource({
    params: this.params,
    stream: () => this.observationSource.latest(),
  });

  readonly bulletin = sectionState(this.warningsResource);
  readonly observations = sectionState(this.observationsResource);

  /** Warnings not yet expired, the most severe and soonest first. */
  readonly warnings = computed<readonly WeatherWarning[]>(() => {
    const now = this.clock.now();
    return (this.bulletin().data?.warnings ?? [])
      .filter((w) => toDate(w.expires) > now)
      .sort(
        (a, b) =>
          LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level] ||
          toDate(a.onset).getTime() - toDate(b.onset).getTime(),
      );
  });

  /** A warning for the coastal waters is in force or coming today. */
  readonly hasCoastalWarning = computed(() => this.warnings().some((w) => w.coastal));

  /** A recent reading from a station that can speak for `place`, if any. */
  nearestObservation(place: GeoPoint): StationObservation | null {
    return representativeObservation(place, this.observations().data ?? [], this.clock.now());
  }

  retry(): void {
    this.warningsResource.reload();
    this.observationsResource.reload();
  }
}
