import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { LocationSource } from '../data/data-sources';
import { LOCATIONS } from '../data/locations';
import { LocationsStore } from './locations.store';
import {
  knownZone,
  selectZone,
  ZONE_PARAM,
  zoneArea,
  zoneById,
  ZoneNavigation,
  zonePath,
} from './zone-navigation';

@Component({ template: '' })
class Blank {}

describe('zone addresses', () => {
  afterEach(() => localStorage.clear());

  async function setUp() {
    TestBed.configureTestingModule({
      providers: [
        { provide: LocationSource, useValue: { list: () => of(LOCATIONS) } },
        provideRouter([
          { path: '', component: Blank },
          { path: 'mar', component: Blank },
          { path: 'zonas', component: Blank },
          {
            path: `tiempo/:${ZONE_PARAM}`,
            canMatch: [knownZone],
            canActivate: [selectZone],
            component: Blank,
          },
          {
            path: `mar/:${ZONE_PARAM}`,
            canMatch: [knownZone],
            canActivate: [selectZone],
            component: Blank,
          },
          { path: '**', component: Blank, data: { notFound: true } },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    TestBed.inject(LocationsStore).all(); // load the catalogue
    TestBed.tick();
    return {
      harness,
      router: TestBed.inject(Router),
      zones: TestBed.inject(ZoneNavigation),
      locations: TestBed.inject(LocationsStore),
    };
  }

  it('builds each place’s two addresses and says where it is', () => {
    expect(zonePath('weather', 'famara')).toBe('/tiempo/famara');
    expect(zonePath('sea', 'famara')).toBe('/mar/famara');
    expect(zoneArea(zoneById('famara')!)).toBe('Teguise, Lanzarote');
    expect(zoneArea(zoneById('arrecife')!)).toBe('Lanzarote');
  });

  it('chooses the place an address names, and knows it is a place’s page', async () => {
    const { harness, zones, locations } = await setUp();
    await harness.navigateByUrl('/tiempo/arrieta');
    expect(locations.selected()?.id).toBe('arrieta');
    expect(zones.routeZone()?.name).toBe('Arrieta');

    await harness.navigateByUrl('/zonas');
    expect(zones.routeZone()).toBeNull();
    // Chosen once, remembered: Hoy at / opens on it.
    expect(localStorage.getItem('lm.selected')).toBe('"arrieta"');
  });

  it('treats a name that is not a place as a page that does not exist', async () => {
    const { harness, router } = await setUp();
    await harness.navigateByUrl('/tiempo/atlantida');
    expect(router.routerState.snapshot.root.firstChild?.data['notFound']).toBe(true);
  });

  it('moves the address with the place on a weather or sea page, and only there', async () => {
    const { harness, router, zones, locations } = await setUp();
    await harness.navigateByUrl('/');
    zones.switchTo('famara');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/tiempo/famara');

    await harness.navigateByUrl('/mar');
    zones.switchTo('orzola');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/mar/orzola');

    await harness.navigateByUrl('/zonas');
    zones.switchTo('el-golfo');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/zonas');
    expect(locations.selected()?.id).toBe('el-golfo');

    zones.open('la-santa', 'sea');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/mar/la-santa');
  });
});
