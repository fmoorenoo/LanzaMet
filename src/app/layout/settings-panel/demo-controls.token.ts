import { InjectionToken, Type } from '@angular/core';

/**
 * The demo build plugs its own controls (weather scenario, time of day,
 * network) into the settings sheet through this token, so none of the
 * simulated-data code ships with the real app.
 */
export const DEMO_CONTROLS = new InjectionToken<Type<unknown>>('DEMO_CONTROLS');
