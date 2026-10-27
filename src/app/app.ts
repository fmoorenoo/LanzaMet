import { NgComponentOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18n } from './core/i18n/i18n.store';
import { TranslatePipe } from './core/i18n/t.pipe';
import { InstallStore } from './core/pwa/install.store';
import { ThemeStore } from './core/state/theme.store';
import { SeoTags } from './core/seo/seo-tags';
import { ZoneNavigation } from './core/state/zone-navigation';
import { DayPicker } from './layout/day-picker/day-picker';
import { LocationPicker } from './layout/location-picker/location-picker';
import { NavBar } from './layout/nav-bar/nav-bar';
import { SettingsPanel } from './layout/settings-panel/settings-panel';
import { UiStore } from './layout/ui.store';
import { lazyComponent } from './shared/lazy-component';

@Component({
  selector: 'lm-root',
  imports: [
    RouterOutlet,
    NgComponentOutlet,
    NavBar,
    LocationPicker,
    DayPicker,
    SettingsPanel,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly ui = inject(UiStore);
  // The document speaks the visitor's language from the first frame.
  private readonly i18n = inject(I18n);
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

  // Only for a browser that prefers the language the page isn't in.
  protected readonly languageSuggestion = lazyComponent(
    () => this.i18n.suggestion() !== null,
    () =>
      import('./layout/language-suggestion/language-suggestion').then((m) => m.LanguageSuggestion),
  );

  constructor() {
    // Day/night theming follows the sun from the first frame…
    inject(ThemeStore);
    // Each page names its own address (canonical) for search engines.
    inject(SeoTags);
    // Which place the address names (/tiempo/:zona, /mar/:zona), from the first navigation.
    inject(ZoneNavigation);
  }
}
