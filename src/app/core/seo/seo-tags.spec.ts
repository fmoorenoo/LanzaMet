import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { I18n } from '../i18n/i18n.store';
import { canonicalUrl, SeoTags } from './seo-tags';

@Component({ template: '' })
class Blank {}

const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
const description = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null;
const robots = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? null;

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
          { path: '', component: Blank },
          {
            path: 'mar',
            title: 'seo.title.sea',
            component: Blank,
            data: { description: 'seo.description.sea', crumb: 'nav.sea', image: 'sea' },
          },
          { path: '**', component: Blank, data: { noindex: true } },
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

  it('describes each page in the language on screen, and the site where a page has no summary', async () => {
    const harness = await setUp();
    await harness.navigateByUrl('/mar');
    expect(description()).toMatch(/^Pleamar y bajamar estimadas/);

    TestBed.inject(I18n).use('en');
    TestBed.tick();
    expect(description()).toMatch(/^Estimated high and low tides/);

    await harness.navigateByUrl('/');
    expect(description()).toMatch(/^How the day looks in Lanzarote/);
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
  });
});
