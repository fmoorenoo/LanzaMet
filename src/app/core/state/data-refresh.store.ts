import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';

/** A single beat every data resource listens to when the user asks for fresh data. */
@Service()
export class DataRefreshStore {
  readonly version = signal(0);

  constructor() {
    // Back online (an installed app opened on the way to the beach): ask again
    // at once instead of waiting for the next quarter of an hour.
    inject(DOCUMENT).defaultView?.addEventListener('online', () => this.refresh());
  }

  refresh(): void {
    this.version.update((v) => v + 1);
  }
}
