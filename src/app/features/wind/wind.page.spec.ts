import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockDataSources } from '../../mocks/mock-data-sources';
import { WindPage } from './wind.page';

describe('WindPage', () => {
  afterEach(() => localStorage.clear());

  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideMockDataSources()] });
    const fixture = TestBed.createComponent(WindPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('ranks every place from least to most wind, each linking to its own page', async () => {
    const el = await render();
    const rows = [...el.querySelectorAll<HTMLAnchorElement>('.calm-wind-row')];
    expect(rows).toHaveLength(9);
    const speeds = rows.map((r) =>
      Number.parseInt(r.querySelector('.calm-value')!.textContent!, 10),
    );
    expect(speeds).toEqual([...speeds].sort((a, b) => a - b));
    expect(rows[0].getAttribute('href')).toBe(`/tiempo/${rows[0].dataset['locationId']}`);
    expect(rows[0].querySelector('.calm-gust')?.textContent).toMatch(/Rachas de hasta \d+ km\/h/);
  });

  it('names the calmest and the windiest place in its lead', async () => {
    const el = await render();
    const names = [...el.querySelectorAll('.calm-name')].map((n) => n.textContent!.trim());
    const lead = el.querySelector('.lead')!.textContent!;
    if (lead.includes('Ahora sopla menos')) {
      expect(lead).toContain(names[0]);
      expect(lead).toContain(names[names.length - 1]);
    } else {
      expect(lead).toContain('Las 9 zonas de la isla');
    }
  });

  it('explains the five steps of the scale with their speeds', async () => {
    const el = await render();
    const ranges = [...el.querySelectorAll('.legend-range')].map((r) => r.textContent!.trim());
    expect(ranges).toEqual([
      'Menos de 6 km/h',
      'De 6 a 19 km/h',
      'De 20 a 28 km/h',
      'De 29 a 49 km/h',
      '50 km/h o más',
    ]);
  });

  it('says the hour on show as a verdict: now, then the hour chosen in the strip', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideMockDataSources()] });
    const fixture = TestBed.createComponent(WindPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const verdict = () => el.querySelector('#wind-hour-verdict');
    expect(verdict()?.querySelector('.verdict-when')?.textContent?.trim()).toBe('Ahora');
    expect(verdict()?.querySelector('.verdict-words')?.textContent?.trim()).toMatch(
      /^(Sin viento|Viento)/,
    );
    expect(verdict()?.querySelector('.verdict-detail')?.textContent).toMatch(
      /km\/h, rachas de \d+/,
    );

    el.querySelectorAll<HTMLButtonElement>('.hour-cell')[3].click();
    fixture.detectChanges();
    expect(verdict()?.querySelector('.verdict-when')?.textContent?.trim()).toMatch(/^\d{2}:00$/);
  });
});
