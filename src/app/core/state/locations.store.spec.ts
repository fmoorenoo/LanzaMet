import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LocationSource } from '../data/data-sources';
import { LOCATIONS } from '../data/locations';
import { LocationsStore } from './locations.store';

function store(saved: Record<string, unknown>): LocationsStore {
  localStorage.clear();
  Object.entries(saved).forEach(([key, value]) =>
    localStorage.setItem(`lm.${key}`, JSON.stringify(value)),
  );
  TestBed.configureTestingModule({
    providers: [{ provide: LocationSource, useValue: { list: () => of(LOCATIONS) } }],
  });
  const locations = TestBed.inject(LocationsStore);
  TestBed.tick();
  return locations;
}

describe('LocationsStore', () => {
  afterEach(() => localStorage.clear());

  it('moves places saved before they were retired to the ones that replaced them', () => {
    const locations = store({
      selected: 'papagayo',
      favorites: ['famara', 'playa-blanca', 'papagayo', 'arrecife'],
    });
    expect(locations.selected()?.id).toBe('playa-blanca');
    expect(locations.favorites().map((l) => l.id)).toEqual(['famara', 'playa-blanca', 'arrecife']);
  });

  it('no longer lists the retired places, and lists La Santa again', () => {
    const ids = store({})
      .all()
      .map((l) => l.id);
    expect(ids).not.toContain('papagayo');
    expect(ids).toContain('la-santa');
    expect(ids).toHaveLength(8);
  });

  it('keeps La Santa when it was saved, rather than moving it to Famara', () => {
    const locations = store({ selected: 'la-santa', favorites: ['la-santa', 'famara'] });
    expect(locations.selected()?.id).toBe('la-santa');
    expect(locations.favorites().map((l) => l.id)).toEqual(['la-santa', 'famara']);
  });
});
