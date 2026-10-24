import { NgComponentOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18n } from './core/i18n/i18n.store';
import { TranslatePipe } from './core/i18n/t.pipe';
import { InstallStore } from './core/pwa/install.store';
import { ThemeStore } from './core/state/theme.store';
import { LocationPicker } from './layout/location-picker/location-picker';
import { NavBar } from './layout/nav-bar/nav-bar';
import { SettingsPanel } from './layout/settings-panel/settings-panel';
import { UiStore } from './layout/ui.store';
import { lazyComponent } from './shared/lazy-component';

@Component({
  selector: 'qth-root',
  imports: [RouterOutlet, NgComponentOutlet, NavBar, LocationPicker, SettingsPanel, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly ui = inject(UiStore);
  // Hears the browser's install offer however early it comes.
  private readonly install = inject(InstallStore);

  // Fetched only when needed: most visits never open the guide or see the invite.
  protected readonly installGuide = lazyComponent(
    () => this.ui.installGuideOpen(),
    () => import('./layout/install/install-guide/install-guide').then((m) => m.InstallGuide),
  );
  protected readonly installInvite = lazyComponent(
    () => this.install.canInvite(),
    () => import('./layout/install/install-invite').then((m) => m.InstallInvite),
  );

  constructor() {
    // Day/night theming follows the sun from the first frame…
    inject(ThemeStore);
    // …and the document speaks the visitor's language from the first frame too.
    inject(I18n);
  }
}
