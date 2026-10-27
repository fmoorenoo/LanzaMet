import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LocationSource } from '../../core/data/data-sources';
import { ZONE_GUIDE } from '../../core/data/zone-guide';
import { LOCATIONS } from '../../core/data/locations';
import { ZoneView } from '../../core/state/zone-navigation';
import { ZoneAbout } from './zone-about';

function render(id: string, view: ZoneView) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: LocationSource, useValue: { list: () => of(LOCATIONS) } },
    ],
  });
  const fixture = TestBed.createComponent(ZoneAbout);
  fixture.componentRef.setInput(
    'location',
    LOCATIONS.find((l) => l.id === id),
  );
  fixture.componentRef.setInput('view', view);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const fact = (el: HTMLElement, name: string) =>
  el.querySelector(`[data-fact="${name}"] dd`)?.textContent?.trim() ?? null;

describe('ZoneAbout', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reads every place’s sea where the README says, 4 to 18 km out', () => {
    // README, "Puntos de consulta por zona".
    const km: Record<string, number> = {
      'puerto-del-carmen': 7,
      arrecife: 10,
      'playa-blanca': 4,
      'costa-teguise': 12,
      famara: 18,
      'la-santa': 13,
      orzola: 8,
      arrieta: 17,
      'el-golfo': 5,
    };
    for (const [id, distance] of Object.entries(km)) {
      expect(fact(render(id, 'weather'), 'sea'), id).toBe(`Se lee mar adentro, a ${distance} km`);
      TestBed.resetTestingModule();
    }
  });

  it('says what makes the place itself, and its facts', () => {
    const el = render('famara', 'weather');
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Sobre Famara');
    expect(el.querySelector('.lead')?.textContent).toContain('Risco de Famara');
    expect(fact(el, 'municipality')).toBe('Teguise');
    expect(fact(el, 'coast')).toBe('Mira al noroeste');
    expect(fact(el, 'station')).toBe('Sin estación costera cerca');
    // Hoy already shows the camera in its details: not repeated here.
    expect(el.querySelector('[data-fact="webcam"]')).toBeNull();
    TestBed.resetTestingModule();
    expect(render('famara', 'sea').querySelector('[data-fact="webcam"]')).not.toBeNull();
  });

  it('says when the model can’t tell two places apart', () => {
    expect(render('arrecife', 'weather').querySelector('.note')?.textContent).toContain(
      'no distingue Arrecife de Costa Teguise',
    );
    TestBed.resetTestingModule();
    expect(render('orzola', 'weather').querySelector('.note')).toBeNull();
  });

  it('leads to its other page and to the places beside it, on the same kind of page', () => {
    const links = (el: HTMLElement) =>
      [...el.querySelectorAll<HTMLAnchorElement>('.ways a')].map((a) => a.getAttribute('href'));
    expect(links(render('famara', 'weather'))).toEqual([
      '/mar/famara',
      '/tiempo/la-santa',
      '/tiempo/orzola',
    ]);
    TestBed.resetTestingModule();
    expect(links(render('famara', 'sea'))).toEqual([
      '/tiempo/famara',
      '/mar/la-santa',
      '/mar/orzola',
    ]);
  });

  it('knows every place in the catalogue, and only those', () => {
    const ids = LOCATIONS.map((l) => l.id).sort();
    expect(Object.keys(ZONE_GUIDE).sort()).toEqual(ids);
    for (const guide of Object.values(ZONE_GUIDE)) {
      for (const near of guide.nearby) expect(ids).toContain(near);
      if (guide.sharesWeatherWith) expect(ids).toContain(guide.sharesWeatherWith);
    }
  });
});
