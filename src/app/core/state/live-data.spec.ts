import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import {
  LocationSource,
  MarineSource,
  ObservationSource,
  WarningSource,
  WeatherSource,
} from '../data/data-sources';
import { LOCATIONS } from '../data/locations';
import { ForecastStore } from './forecast.store';
import { IslandStore } from './island.store';
import { LIVE_DATA } from './live-data';
import { OfficialStore } from './official.store';

/** Every source records that it was asked, and never answers. */
function sources(asked: string[]) {
  const never = (name: string) => () => {
    asked.push(name);
    return new Observable<never>();
  };
  return [
    { provide: LocationSource, useValue: { list: () => new Observable((s) => s.next(LOCATIONS)) } },
    { provide: WeatherSource, useValue: { forecast: never('weather') } },
    { provide: MarineSource, useValue: { sea: never('sea'), tides: never('tides') } },
    { provide: WarningSource, useValue: { active: never('warnings') } },
    { provide: ObservationSource, useValue: { latest: never('observations') } },
  ];
}

describe('LIVE_DATA', () => {
  it('is on in a browser and off when pages are prerendered', () => {
    expect(TestBed.inject(LIVE_DATA)).toBe(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    expect(TestBed.inject(LIVE_DATA)).toBe(false);
  });

  it('keeps the stores from asking for any data while prerendering, so sections show their skeletons', () => {
    const asked: string[] = [];
    TestBed.configureTestingModule({
      providers: [...sources(asked), { provide: LIVE_DATA, useValue: false }],
    });
    const forecast = TestBed.inject(ForecastStore);
    const island = TestBed.inject(IslandStore);
    const official = TestBed.inject(OfficialStore);
    TestBed.tick();

    expect(asked).toEqual([]);
    expect(forecast.weather().status).toBe('loading');
    expect(island.zones().status).toBe('loading');
    expect(official.bulletin().status).toBe('loading');
  });

  it('lets them ask in a browser', () => {
    const asked: string[] = [];
    TestBed.configureTestingModule({ providers: sources(asked) });
    TestBed.inject(ForecastStore).weather();
    TestBed.inject(OfficialStore).bulletin();
    TestBed.tick();
    expect(asked).toEqual(expect.arrayContaining(['weather', 'warnings']));
  });
});
