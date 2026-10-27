import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

/**
 * Whether the app asks for forecasts, warnings and readings. Only in a
 * browser: when pages are prerendered at build time they carry their fixed
 * text and the shape of each section, never weather that would already be
 * old when someone reads it. The stores then stay idle and every data section
 * shows its skeleton until the browser loads the real data.
 */
export const LIVE_DATA = new InjectionToken<boolean>('LIVE_DATA', {
  factory: () => isPlatformBrowser(inject(PLATFORM_ID)),
});
