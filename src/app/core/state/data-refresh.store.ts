import { Service, signal } from '@angular/core';

/** A single beat every data resource listens to when the user asks for fresh data. */
@Service()
export class DataRefreshStore {
  readonly version = signal(0);

  refresh(): void {
    this.version.update((v) => v + 1);
  }
}
