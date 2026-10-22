import { provideHttpDataSources } from './core/data/http/provide-http-data-sources';

/**
 * Real providers. The `demo` build configuration replaces this file with
 * `data-providers.demo.ts` (see angular.json), so simulated data never ships.
 */
export const provideDataSources = () => provideHttpDataSources();
