import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { readStored, writeStored } from '../utils/storage';
import { islandHour, toDate } from '../utils/time';
import { ClockStore } from './clock.store';
import { ForecastStore } from './forecast.store';

export type ThemePreference = 'auto' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'auto' || value === 'light' || value === 'dark';

const GROUND_HEX: Readonly<Record<Theme, string>> = { light: '#f8fafb', dark: '#0d121c' };

/**
 * Day and night follow the sun over the selected place unless the visitor
 * picks one. Also keeps the browser chrome (status bar) matching the top of
 * the page — the sky on the home screen, the ground elsewhere.
 */
@Service()
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly clock = inject(ClockStore);
  private readonly forecast = inject(ForecastStore);

  readonly preference = signal<ThemePreference>(readStored('theme', isPreference) ?? 'auto');

  /** Colour currently painted under the status bar, if a page owns it. */
  private readonly topColor = signal<string | null>(null);

  readonly isDaylight = computed(() => {
    const now = this.clock.now();
    const today = this.forecast.weather().data?.daily[0];
    if (today?.sunrise && today.sunset) {
      return now >= toDate(today.sunrise) && now < toDate(today.sunset);
    }
    const hour = islandHour(now);
    return hour >= 7.5 && hour < 19.5;
  });

  readonly theme = computed<Theme>(() => {
    const preference = this.preference();
    if (preference !== 'auto') return preference;
    return this.isDaylight() ? 'light' : 'dark';
  });

  constructor() {
    // Prerendered pages keep index.html's light theme: the sun at build time
    // says nothing about when they are read. The browser sets it at once.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.theme();
    });
    effect(() => {
      const color = this.topColor() ?? GROUND_HEX[this.theme()];
      this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    writeStored('theme', preference);
  }

  paintTop(hex: string | null): void {
    this.topColor.set(hex);
  }
}
