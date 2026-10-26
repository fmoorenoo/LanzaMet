import { Service, signal } from '@angular/core';

/** Which app-level sheets are open. Any page can ask for them. */
@Service()
export class UiStore {
  readonly locationPickerOpen = signal(false);
  readonly dayPickerOpen = signal(false);
  readonly settingsOpen = signal(false);
  readonly installGuideOpen = signal(false);

  openLocationPicker(): void {
    this.locationPickerOpen.set(true);
  }

  openDayPicker(): void {
    this.dayPickerOpen.set(true);
  }

  openSettings(): void {
    this.settingsOpen.set(true);
  }

  openInstallGuide(): void {
    this.installGuideOpen.set(true);
  }
}
