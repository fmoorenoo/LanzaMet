import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { atIslandHour, TIME } from '../utils/time';

/**
 * The app's sense of "now". Normally the real clock; it can be pinned to a
 * wall-clock hour on the island to preview night, dawn or sunset.
 */
@Service()
export class ClockStore {
  private readonly realNow = signal(new Date());

  /** Island wall-clock hour to simulate (e.g. 20.5), or null for real time. */
  readonly pinnedHour = signal<number | null>(null);

  readonly now = computed(() => {
    const pinned = this.pinnedHour();
    const real = this.realNow();
    return pinned === null ? real : atIslandHour(real, pinned);
  });

  /** Changes once per hour; data is refreshed on this beat. */
  readonly hourKey = computed(() => Math.floor(this.now().getTime() / TIME.HOUR));

  /**
   * Changes every quarter of an hour: the beat data is re-read on. Each
   * response's own cache lifetime decides whether that reaches the network.
   */
  readonly quarterKey = computed(() => Math.floor(this.now().getTime() / (15 * TIME.MINUTE)));

  constructor() {
    const timer = setInterval(() => this.realNow.set(new Date()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  pinHour(hour: number | null): void {
    this.pinnedHour.set(hour);
  }
}
