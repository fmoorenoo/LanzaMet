import { computed, inject, Service, signal } from '@angular/core';
import { DataRefreshStore } from '../core/state/data-refresh.store';
import { readStored, writeStored } from '../core/utils/storage';
import { DEFAULT_SCENARIO, isScenarioId, ScenarioId } from './sim/scenarios';

/**
 * Controls for the simulated data: which weather story to tell and how the
 * "network" behaves, so loading and error states can be seen on purpose.
 */
@Service()
export class DemoStore {
  private readonly refreshStore = inject(DataRefreshStore);

  // A URL like `/?escenario=calima&lento&fallo` opens the demo in a given state
  // (handy for reviews and for testing loading and error states from a cold start).
  private readonly query = new URLSearchParams(globalThis.location?.search ?? '');

  readonly scenario = signal<ScenarioId>(this.initialScenario());
  readonly slowNetwork = signal(this.query.has('lento'));
  readonly failRequests = signal(this.query.has('fallo'));

  readonly latencyMs = computed(() => (this.slowNetwork() ? 1800 : 280));

  private initialScenario(): ScenarioId {
    const fromUrl = this.query.get('escenario');
    if (isScenarioId(fromUrl)) return fromUrl;
    return readStored('demo.scenario', isScenarioId) ?? DEFAULT_SCENARIO;
  }

  setScenario(id: ScenarioId): void {
    this.scenario.set(id);
    writeStored('demo.scenario', id);
    this.refreshStore.refresh();
  }

  setSlowNetwork(value: boolean): void {
    this.slowNetwork.set(value);
    this.refreshStore.refresh();
  }

  setFailRequests(value: boolean): void {
    this.failRequests.set(value);
    this.refreshStore.refresh();
  }
}
