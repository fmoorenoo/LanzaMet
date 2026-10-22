import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/state/theme.store';
import { LocationPicker } from './layout/location-picker/location-picker';
import { NavBar } from './layout/nav-bar/nav-bar';
import { SettingsPanel } from './layout/settings-panel/settings-panel';

@Component({
  selector: 'qth-root',
  imports: [RouterOutlet, NavBar, LocationPicker, SettingsPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Day/night theming follows the sun from the first frame.
    inject(ThemeStore);
  }
}
