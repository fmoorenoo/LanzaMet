import { TestBed } from '@angular/core/testing';
import { MessageKey, msg } from './i18n.model';
import { detectLang, I18n } from './i18n.store';
import { en } from './messages/en';
import { es } from './messages/es';
import { formatDuration, translate } from './translate';

const placeholders = (text: string) => [...text.matchAll(/\{\^?(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  it('give every message the same placeholders in both languages', () => {
    const keys = Object.keys(es) as MessageKey[];
    const mismatched = keys.filter(
      (key) => placeholders(es[key]).join() !== placeholders(en[key]).join(),
    );
    expect(mismatched).toEqual([]);
  });

  it('translate every message into English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    // Only names read the same in both: the brand, places, sources and "calima".
    const sameInBoth: readonly MessageKey[] = [
      'app.brand',
      'common.lanzarote',
      'warning.area.island',
      'week.calima',
      'settings.source.dust',
      'settings.source.observations.text',
      'demo.scenario.calima',
      'today.demo',
    ];
    const untranslated = (Object.keys(es) as MessageKey[]).filter(
      (key) =>
        es[key] === en[key] &&
        /[a-záéíóúñ]{4,}/i.test(es[key].replace(/{[^}]+}/g, '')) &&
        !sameInBoth.includes(key),
    );
    expect(untranslated).toEqual([]);
  });
});

describe('translate', () => {
  it('formats numbers, times and durations the way each language writes them', () => {
    const swell = msg('sea.swell', {
      from: msg('wind.from', { dir: msg('dir.NO') }),
      height: { decimal: 1.14, digits: 1 },
      period: 11,
    });
    expect(translate(swell, 'es')).toBe('Mar de fondo del noroeste, 1,1 m cada 11 s');
    expect(translate(swell, 'en')).toBe('Swell from the northwest, 1.1 m every 11 s');
    expect(formatDuration(130 * 60_000, 'es')).toBe('2 h 10 min');
    expect(formatDuration(60_000, 'es')).toBe('un momento');
    expect(formatDuration(60_000, 'en')).toBe('a moment');
  });

  it('names days in island time, capitalising only where a sentence starts', () => {
    const window = msg('time.window', {
      day: { day: '2026-10-24', today: '2026-10-22' },
      from: { time: '2026-10-24T09:00:00Z' },
      to: { time: '2026-10-24T18:00:00Z' },
    });
    expect(translate(window, 'es')).toBe('Sábado, de 10:00 a 19:00');
    expect(translate(window, 'en')).toBe('Saturday, 10:00 to 19:00');
    const until = msg('warning.until.weekday', {
      weekday: { weekday: '2026-10-24T12:00:00Z', style: 'long' },
      time: { time: '2026-10-24T17:00:00Z' },
    });
    expect(translate(until, 'es')).toBe('En vigor hasta el sábado a las 18:00');
  });

  it('starts an error with a capital whatever service it names', () => {
    const error = msg('error.down', { service: msg('service.weather') });
    expect(translate(error, 'es')).toBe('El servicio meteorológico no responde ahora mismo.');
    expect(translate(error, 'en')).toBe("The weather service isn't responding right now.");
  });
});

describe('language choice', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('follows the browser until the visitor chooses, Spanish when nothing matches', () => {
    expect(detectLang(['en-GB', 'es'])).toBe('en');
    expect(detectLang(['de-DE', 'es-ES'])).toBe('es');
    expect(detectLang(['fr', 'de'])).toBe('es');
    expect(detectLang([])).toBe('es');
  });

  it('switches at once, remembers the choice and labels the document', () => {
    const i18n = TestBed.inject(I18n);
    i18n.use('en');
    TestBed.tick();
    expect(i18n.t('nav.today')).toBe('Today');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('qth.lang')).toBe('"en"');

    i18n.use('es');
    TestBed.tick();
    expect(i18n.t('nav.today')).toBe('Hoy');
    expect(document.documentElement.lang).toBe('es');
  });

  it('respects a remembered choice over the browser', () => {
    localStorage.setItem('qth.lang', '"en"');
    expect(TestBed.inject(I18n).lang()).toBe('en');
  });
});
