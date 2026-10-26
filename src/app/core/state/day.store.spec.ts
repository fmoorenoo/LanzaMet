import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { simulateWeather } from '../../mocks/sim/simulator';
import { LOCATIONS } from '../data/locations';
import { WeatherForecast } from '../models';
import { formatTime } from '../utils/time';
import { ClockStore } from './clock.store';
import { DayStore } from './day.store';
import { ForecastStore } from './forecast.store';

// 22 October 2026, 09:20 in Lanzarote (UTC+1).
const start = new Date('2026-10-22T08:20:00Z');

function setup() {
  const now = signal(start);
  const forecast = signal<WeatherForecast | null>(
    simulateWeather({ location: LOCATIONS[0], scenario: 'alisio', now: start }),
  );
  TestBed.configureTestingModule({
    providers: [
      { provide: ClockStore, useValue: { now } },
      {
        provide: ForecastStore,
        useValue: { weather: computed(() => ({ data: forecast() })) },
      },
    ],
  });
  return { days: TestBed.inject(DayStore), now, forecast };
}

describe('DayStore', () => {
  it('starts on today, as it is now', () => {
    const { days } = setup();
    expect(days.day()).toBe('2026-10-22');
    expect(days.isToday()).toBe(true);
    expect(days.moment()).toBe(start);
  });

  it('shows a chosen later day at its midday, its hours from its midnight', () => {
    const { days } = setup();
    days.select('2026-10-25');
    expect(days.day()).toBe('2026-10-25');
    expect(days.kind()).toBe('later');
    expect(formatTime(days.moment())).toBe('12:00');
    expect(formatTime(days.from())).toBe('00:00');
  });

  it('goes back to today when asked, or when today itself is chosen', () => {
    const { days } = setup();
    days.select('2026-10-23');
    expect(days.kind()).toBe('tomorrow');
    days.reset();
    expect(days.isToday()).toBe(true);
    days.select('2026-10-24');
    days.select('2026-10-22');
    expect(days.isToday()).toBe(true);
  });

  it('gives way to today once the chosen day has passed', () => {
    const { days, now } = setup();
    days.select('2026-10-23');
    now.set(new Date('2026-10-24T09:00:00Z'));
    expect(days.day()).toBe('2026-10-24');
    expect(days.isToday()).toBe(true);
  });

  it('only keeps a day the forecast has', () => {
    const { days } = setup();
    days.select('2026-11-15');
    expect(days.isToday()).toBe(true);
  });
});
