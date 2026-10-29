import { LOCATIONS } from '../data/locations';
import { LANGS } from './i18n.model';
import {
  addressPath,
  alternatePath,
  langOfPath,
  PAGE_IDS,
  pagePath,
  readPath,
  SiteAddress,
  ZONE_VIEWS,
  zonePath,
} from './localized-paths';

const everyAddress: SiteAddress[] = LANGS.flatMap((lang) => [
  ...PAGE_IDS.map((page): SiteAddress => ({ lang, page })),
  ...ZONE_VIEWS.flatMap((view) => LOCATIONS.map((l): SiteAddress => ({ lang, view, zone: l.id }))),
]);

describe('localized paths', () => {
  it('writes each page in Spanish at the root and in English under /en', () => {
    expect(pagePath('today', 'es')).toBe('/');
    expect(pagePath('today', 'en')).toBe('/en');
    expect(pagePath('zones', 'es')).toBe('/zonas');
    expect(pagePath('zones', 'en')).toBe('/en/places');
    expect(pagePath('plans', 'en')).toBe('/en/where-to-go');
    expect(pagePath('feedback', 'en')).toBe('/en/feedback');
    expect(zonePath('weather', 'playa-blanca', 'es')).toBe('/tiempo/playa-blanca');
    expect(zonePath('sea', 'playa-blanca', 'en')).toBe('/en/sea/playa-blanca');
  });

  it('tells the language from the address alone', () => {
    expect(langOfPath('/en')).toBe('en');
    expect(langOfPath('/en/sea?dia=2026-10-30')).toBe('en');
    expect(langOfPath('/en#x')).toBe('en');
    expect(langOfPath('/')).toBe('es');
    expect(langOfPath('/mar')).toBe('es');
    // Only the whole first segment counts.
    expect(langOfPath('/enlaces')).toBe('es');
  });

  it('reads back every address it writes, in both languages', () => {
    expect(everyAddress).toHaveLength(2 * (PAGE_IDS.length + 2 * LOCATIONS.length));
    for (const address of everyAddress) {
      expect(readPath(addressPath(address))).toEqual(address);
    }
  });

  it('gives every page its twin in the other language, and back', () => {
    for (const address of everyAddress) {
      const path = addressPath(address);
      const other = address.lang === 'es' ? 'en' : 'es';
      expect(alternatePath(alternatePath(path, other)!, address.lang)).toBe(path);
    }
    expect(alternatePath('/mar', 'en')).toBe('/en/sea');
    expect(alternatePath('/en/weather/famara', 'es')).toBe('/tiempo/famara');
    expect(alternatePath('/sobre', 'es')).toBe('/sobre');
  });

  it('keeps the day and the anchor when changing language', () => {
    expect(alternatePath('/mar/famara?dia=2026-10-30#temperatura-agua', 'en')).toBe(
      '/en/sea/famara?dia=2026-10-30#temperatura-agua',
    );
    expect(alternatePath('/en?dia=2026-10-30', 'es')).toBe('/?dia=2026-10-30');
  });

  it('has no twin for an address the site does not have', () => {
    for (const url of [
      '/no-existe',
      '/en/no-such-page',
      '/tiempo/atlantida',
      '/en/weather/papagayo',
      '/en/zonas',
      '/places',
      '/mar/famara/extra',
    ]) {
      expect(readPath(url)).toBeNull();
      expect(alternatePath(url, 'en')).toBeNull();
    }
  });
});
