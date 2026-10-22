import { Service, signal } from '@angular/core';

/** Which app-level sheets are open. Any page can ask for them. */
@Service()
export class UiStore {
  readonly locationPickerOpen = signal(false);
  readonly demoPanelOpen = signal(false);

  openLocationPicker(): void {
    this.locationPickerOpen.set(true);
  }

  openDemoPanel(): void {
    this.demoPanelOpen.set(true);
  }
}
