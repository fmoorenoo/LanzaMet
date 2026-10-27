import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * The app as it is prerendered at build time. Nothing else changes: the
 * stores see they aren't in a browser (LIVE_DATA) and ask for no data, so
 * each page is written with its fixed text, its tags and the skeletons of its
 * data sections; the browser fills them in as it always has.
 */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
