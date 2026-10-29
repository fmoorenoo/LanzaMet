import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { speak } from '../i18n/lang-route';
import { canonicalUrl, SeoTags } from './seo-tags';

@Component({ template: '' })
class Blank {}

const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
const description = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null;
const robots = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? null;
const alternates = () =>
  Object.fromEntries(
    [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map(
      (link) => [link.hreflang, link.href],
    ),
  );

const sea: Route = {
  title: 'seo.title.sea',
  component: Blank,
  data: { description: 'seo.description.sea', crumb: 'nav.sea', image: 'sea' },
};
const notFound: Route = { path: '**', component: Blank, data: { noindex: true } };

describe('canonicalUrl', () => {
  it('keeps only the path, on the public domain', () => {
    const origin = 'https://lanzamet.com';
    expect(canonicalUrl(origin, '/')).toBe('https://lanzamet.com/');
    expect(canonicalUrl(origin, '')).toBe('https://lanzamet.com/');
    expect(canonicalUrl(origin, '/mar?dia=2026-10-28#curve')).toBe('https://lanzamet.com/mar');
    expect(canonicalUrl(origin, '/zonas/')).toBe('https://lanzamet.com/zonas');
  });
});

describe('SeoTags', () => {
  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.head.querySelectorAll('link[rel="alternate"]').forEach((l) => l.remove());
    document.head.querySelector('meta[name="robots"]')?.remove();
    document.head.querySelector('meta[name="description"]')?.remove();
    document.head
      .querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')
      .forEach((m) => m.remove());
    document.getElementById('structured-data')?.remove();
    localStorage.clear();
  });

  async function setUp() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'en',
            canActivateChild: [speak('en')],
            children: [{ path: '', component: Blank }, { ...sea, path: 'sea' }, notFound],
          },
          {
            path: '',
            canActivateChild: [speak('es')],
            children: [{ path: '', component: Blank }, { ...sea, path: 'mar' }, notFound],
          },
        ]),
      ],
    });
    TestBed.inject(SeoTags);
    return RouterTestingHarness.create();
  }

  it('names each page by its own address, without the query', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/mar?dia=2026-10-28');
    expect(canonical()).toBe('https://lanzamet.com/mar');
    expect(robots()).toBeNull();

    await harness.navigateByUrl('/');
    expect(canonical()).toBe('https://lanzamet.com/');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('keeps an unknown address out of search results, with no canonical', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/no-existe');
    expect(robots()).toBe('noindex');
    expect(canonical()).toBeNull();

    await harness.navigateByUrl('/mar');
    expect(robots()).toBeNull();
    expect(canonical()).toBe('https://lanzamet.com/mar');
  });

  it('describes each page in the language of its address, and the site where a page has no summary', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/mar');
    expect(description()).toMatch(/^Pleamar y bajamar estimadas/);

    await harness.navigateByUrl('/en/sea');
    expect(description()).toMatch(/^Estimated high and low tides/);
    expect(canonical()).toBe('https://lanzamet.com/en/sea');

    await harness.navigateByUrl('/en');
    expect(description()).toMatch(/^How the day looks in Lanzarote/);
    expect(canonical()).toBe('https://lanzamet.com/en');
  });

  it('names the page in each language from both versions, and none out of the index', async () => {
    const harness = await setUp();
    const both = {
      es: 'https://lanzamet.com/mar',
      en: 'https://lanzamet.com/en/sea',
      'x-default': 'https://lanzamet.com/mar',
    };
    await harness.navigateByUrl('/mar?dia=2026-10-28');
    expect(alternates()).toEqual(both);

    await harness.navigateByUrl('/en/sea');
    expect(alternates()).toEqual(both);
    expect(document.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(3);

    await harness.navigateByUrl('/en');
    expect(alternates()).toEqual({
      es: 'https://lanzamet.com/',
      en: 'https://lanzamet.com/en',
      'x-default': 'https://lanzamet.com/',
    });

    await harness.navigateByUrl('/en/no-such-page');
    expect(alternates()).toEqual({});
  });

  it('gives each page a link preview and structured data, and none to a page out of the index', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/mar');
    const og = (p: string) =>
      document.head.querySelector<HTMLMetaElement>(`meta[property="${p}"]`)?.content ?? null;
    expect(og('og:title')).toBe('Mareas en Lanzarote hoy: pleamar, bajamar y olas');
    expect(og('og:url')).toBe('https://lanzamet.com/mar');
    expect(og('og:image')).toBe('https://lanzamet.com/og/sea.jpg');
    expect(og('og:locale')).toBe('es_ES');
    expect(document.head.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
    const ld = JSON.parse(document.getElementById('structured-data')?.textContent ?? 'null');
    const page = ld['@graph'].find((n: { '@type': string }) => n['@type'] === 'WebPage');
    expect(page.url).toBe('https://lanzamet.com/mar');
    expect(page.breadcrumb.itemListElement[0].name).toBe('Inicio');

    await harness.navigateByUrl('/no-existe');
    expect(document.getElementById('structured-data')).toBeNull();
    expect(og('og:image')).toBe('https://lanzamet.com/og/home.jpg');

    // In English: its own picture (the words are in the image) and its own home page.
    await harness.navigateByUrl('/en/sea');
    expect(og('og:image')).toBe('https://lanzamet.com/og/en/sea.jpg');
    expect(og('og:locale')).toBe('en_GB');
    const en = JSON.parse(document.getElementById('structured-data')?.textContent ?? 'null');
    const enPage = en['@graph'].find((n: { '@type': string }) => n['@type'] === 'WebPage');
    expect(enPage.breadcrumb.itemListElement[0]).toMatchObject({
      name: 'Home',
      item: 'https://lanzamet.com/en',
    });
  });
});
