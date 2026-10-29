import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MessageKey, msg } from './i18n.model';
import { detectLang, I18n } from './i18n.store';
import { speak } from './lang-route';
import { LanguageLinks } from './language-links';
import { en } from './messages/en';
import { es } from './messages/es';
import { formatDuration, translate } from './translate';

@Component({ template: '' })
class Blank {}

const GOOGLEBOT =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

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
    // Only names read the same in both: the brand, places, sources, "calima" and Android.
    const sameInBoth: readonly MessageKey[] = [
      'app.brand',
      'common.lanzarote',
      'warning.area.island',
      'week.calima',
      'legal.source.dust',
      'legal.source.observations.text',
      'demo.scenario.calima',
      'today.demo',
      'install.device.android',
      'about.credit',
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

  it("reads the browser's first language it speaks, Spanish when nothing matches", () => {
    expect(detectLang(['en-GB', 'es'])).toBe('en');
    expect(detectLang(['de-DE', 'es-ES'])).toBe('es');
    expect(detectLang(['fr', 'de'])).toBe('es');
    expect(detectLang([])).toBe('es');
  });

  describe('with a browser that prefers English', () => {
    beforeEach(() => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB', 'en']));
    afterEach(() => vi.restoreAllMocks());

    it('opens a Spanish address in Spanish anyway and only suggests English', () => {
      const i18n = TestBed.inject(I18n);
      TestBed.tick();
      expect(i18n.lang()).toBe('es');
      expect(document.documentElement.lang).toBe('es');
      expect(i18n.suggestion()).toBe('en');
    });

    it('stops suggesting once the visitor chooses or says no', () => {
      const i18n = TestBed.inject(I18n);
      i18n.remember('en');
      expect(i18n.suggestion()).toBeNull();

      localStorage.clear();
      TestBed.resetTestingModule();
      const again = TestBed.inject(I18n);
      again.dismissSuggestion();
      expect(again.suggestion()).toBeNull();
      expect(localStorage.getItem('lm.langSuggestion')).toBe('true');
    });

    it('suggests nothing on an English page', () => {
      const i18n = TestBed.inject(I18n);
      i18n.follow('en');
      expect(i18n.suggestion()).toBeNull();
    });
  });

  it('suggests Spanish on an English page to a browser that prefers it', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-ES']);
    const i18n = TestBed.inject(I18n);
    expect(i18n.suggestion()).toBeNull();
    i18n.follow('en');
    expect(i18n.suggestion()).toBe('es');
    vi.restoreAllMocks();
  });

  it('suggests nothing to a crawler, which renders in English but indexes the page as it is', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(GOOGLEBOT);
    localStorage.setItem('lm.lang', '"en"');
    const i18n = TestBed.inject(I18n);
    expect(i18n.lang()).toBe('es');
    expect(i18n.suggestion()).toBeNull();
    expect(i18n.remembered()).toBeNull();
    vi.restoreAllMocks();
  });

  it('speaks the language of the page at once and labels the document', () => {
    const i18n = TestBed.inject(I18n);
    i18n.follow('en');
    TestBed.tick();
    expect(i18n.t('nav.today')).toBe('Today');
    expect(document.documentElement.lang).toBe('en');

    i18n.follow('es');
    TestBed.tick();
    expect(i18n.t('nav.today')).toBe('Hoy');
    expect(document.documentElement.lang).toBe('es');
  });

  it('remembers a choice without changing the page by itself', () => {
    const i18n = TestBed.inject(I18n);
    i18n.remember('en');
    expect(localStorage.getItem('lm.lang')).toBe('"en"');
    expect(i18n.remembered()).toBe('en');
    expect(i18n.lang()).toBe('es');
  });
});

describe('language from the address', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  async function setUp() {
    const pages = (...paths: string[]): Route[] => [
      ...paths.map((path) => ({ path, component: Blank })),
      { path: '**', component: Blank },
    ];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'en', canActivateChild: [speak('en')], children: pages('', 'sea') },
          { path: '', canActivateChild: [speak('es')], children: pages('', 'mar') },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    return {
      harness,
      router: TestBed.inject(Router),
      i18n: TestBed.inject(I18n),
      links: TestBed.inject(LanguageLinks),
    };
  }

  it('speaks English under /en and Spanish everywhere else', async () => {
    const { harness, i18n } = await setUp();
    await harness.navigateByUrl('/en/sea');
    expect(i18n.lang()).toBe('en');
    await harness.navigateByUrl('/mar');
    expect(i18n.lang()).toBe('es');
    await harness.navigateByUrl('/en/no-such-page');
    expect(i18n.lang()).toBe('en');
  });

  it('opens the site in the language chosen before, on arrival only', async () => {
    localStorage.setItem('lm.lang', '"en"');
    const { harness, router, i18n } = await setUp();
    await harness.navigateByUrl('/mar?dia=2026-10-30');
    expect(router.url).toBe('/en/sea?dia=2026-10-30');
    expect(i18n.lang()).toBe('en');

    // Once on the site, every address is shown as it is.
    await harness.navigateByUrl('/mar');
    expect(router.url).toBe('/mar');
    expect(i18n.lang()).toBe('es');
  });

  it('never moves a crawler', async () => {
    localStorage.setItem('lm.lang', '"en"');
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(GOOGLEBOT);
    const { harness, router } = await setUp();
    await harness.navigateByUrl('/mar');
    expect(router.url).toBe('/mar');
  });

  it('leaves an address with no other version where it is', async () => {
    localStorage.setItem('lm.lang', '"en"');
    const { harness, router } = await setUp();
    await harness.navigateByUrl('/no-existe');
    expect(router.url).toBe('/no-existe');
  });

  it('switches to the same page in the other language, keeping the day, and remembers it', async () => {
    const { harness, router, i18n, links } = await setUp();
    await harness.navigateByUrl('/mar/famara?dia=2026-10-30');
    expect(links.linkTo('en')).toBe('/en/sea/famara?dia=2026-10-30');

    links.switchTo('en');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/en/sea/famara?dia=2026-10-30');
    expect(i18n.lang()).toBe('en');
    expect(localStorage.getItem('lm.lang')).toBe('"en"');

    // A page with no equivalent leads to the other language's home page.
    await harness.navigateByUrl('/en/no-such-page');
    expect(links.linkTo('es')).toBe('/');
  });
});
