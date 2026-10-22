import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/state/theme.store';
import { DemoPanel } from './layout/demo-panel/demo-panel';
import { LocationPicker } from './layout/location-picker/location-picker';
import { NavBar } from './layout/nav-bar/nav-bar';

@Component({
  selector: 'qth-root',
  imports: [RouterOutlet, NavBar, LocationPicker, DemoPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Day/night theming follows the sun from the first frame.
    inject(ThemeStore);
  }
}
