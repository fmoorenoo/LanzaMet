import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { canonicalUrl, SeoTags } from './seo-tags';

@Component({ template: '' })
class Blank {}

const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
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
  });

  async function setUp() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'mar', component: Blank },
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
});
