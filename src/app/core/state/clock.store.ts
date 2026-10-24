import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, linkedSignal, Service, signal } from '@angular/core';
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

  /** The page is on screen. */
  private readonly visible = signal(true);

  private readonly beat = linkedSignal<{ quarter: number; visible: boolean }, number>({
    source: () => ({ quarter: this.quarterKey(), visible: this.visible() }),
    computation: (source, previous) =>
      source.visible || previous === undefined ? source.quarter : previous.value,
  });

  /**
   * The beat data is re-read on: the quarter of an hour, held while the tab
   * is hidden, so a forgotten tab asks for nothing. It moves on — and stale
   * data is asked for again — as soon as the page is seen again.
   */
  readonly refreshBeat = computed(() => this.beat());

  /**
   * Ticks on each minute's turn, so a clock showing it changes with the
   * wall's, and catches up at once when a backgrounded tab comes back.
   */
  constructor() {
    const document = inject(DOCUMENT);
    this.visible.set(document.visibilityState !== 'hidden');
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A few milliseconds past the turn, so timer drift never lands just before it.
    const schedule = (from: number) => {
      clearTimeout(timer);
      timer = setTimeout(tick, TIME.MINUTE - (from % TIME.MINUTE) + 20);
    };
    const tick = () => {
      const now = new Date();
      this.realNow.set(now);
      schedule(now.getTime());
    };
    schedule(Date.now());
    const onVisible = () => {
      this.visible.set(document.visibilityState !== 'hidden');
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  pinHour(hour: number | null): void {
    this.pinnedHour.set(hour);
  }
}
