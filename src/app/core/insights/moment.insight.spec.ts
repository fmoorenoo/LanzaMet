import { simulateSea, simulateWeather } from '../../mocks/sim/simulator';
import { LOCATIONS } from '../data/locations';
import { Location, ZoneConditions } from '../models';
import { formatTime, islandDateKey, islandHour } from '../utils/time';
import {
  dayKind,
  dayMoment,
  dayStart,
  hoursOfDay,
  stepAt,
  stepsFrom,
  zoneAt,
} from './moment.insight';

const byId = (id: string): Location => {
  const location = LOCATIONS.find((l) => l.id === id);
  if (!location) throw new Error(id);
  return location;
};

// 22 October 2026, 09:20 in Lanzarote (UTC+1).
const now = new Date('2026-10-22T08:20:00Z');

function zone(id: string): ZoneConditions {
  const location = byId(id);
  return {
    location,
    weather: simulateWeather({ location, scenario: 'alisio', now }),
    sea: simulateSea({ location, scenario: 'alisio', now }),
  };
}

describe('the day on screen', () => {
  it('shows today as it is now, and any later day at its midday', () => {
    expect(dayMoment('2026-10-22', now)).toBe(now);
    const friday = dayMoment('2026-10-24', now);
    expect(islandDateKey(friday)).toBe('2026-10-24');
    expect(formatTime(friday)).toBe('12:00');
  });

  it('opens each day at its own midnight, also across the change to winter time', () => {
    expect(formatTime(dayStart('2026-10-24'))).toBe('00:00');
    // Clocks go back on 25 October: that day is 25 hours long.
    const sunday = dayStart('2026-10-25');
    const monday = dayStart('2026-10-26');
    expect(formatTime(sunday)).toBe('00:00');
    expect((monday.getTime() - sunday.getTime()) / 3_600_000).toBe(25);
  });

  it('tells today, tomorrow and later apart', () => {
    expect(dayKind('2026-10-22', '2026-10-22')).toBe('today');
    expect(dayKind('2026-10-23', '2026-10-22')).toBe('tomorrow');
    expect(dayKind('2026-10-27', '2026-10-22')).toBe('later');
  });
});

describe('hours of a day', () => {
  const forecast = simulateWeather({ location: byId('arrecife'), scenario: 'alisio', now });

  it("finds a later day's 24 hours, from 00:00 to 23:00", () => {
    const hours = hoursOfDay(forecast.hourly, '2026-10-24');
    expect(hours).toHaveLength(24);
    expect(islandHour(new Date(hours[0].time))).toBe(0);
    expect(islandHour(new Date(hours[23].time))).toBe(23);
  });

  it('finds the hour containing a moment, and the hours from it on', () => {
    const at = dayMoment('2026-10-25', now);
    expect(formatTime(stepAt(forecast.hourly, at)?.time ?? '')).toBe('12:00');
    const from = stepsFrom(forecast.hourly, at);
    expect(formatTime(from[0].time)).toBe('12:00');
    expect(stepAt(forecast.hourly, new Date('2027-01-01T12:00:00Z'))).toBeUndefined();
  });
});

describe('a place at another moment', () => {
  it('takes that hour as its "now", for the weather and the sea alike', () => {
    const famara = zone('famara');
    const at = dayMoment('2026-10-24', now);
    const from = dayStart('2026-10-24');
    const later = zoneAt(famara, at, from);
    expect(later.weather.current.time).toBe(stepAt(famara.weather.hourly, at)?.time);
    expect(later.sea?.current.time).toBe(stepAt(famara.sea?.hourly ?? [], at)?.time);
    expect(later.weather.hourly[0].time).toBe(from.toISOString());
    // The day's own facts (its high and low, its sun) are untouched.
    expect(later.weather.daily).toBe(famara.weather.daily);
  });

  it('keeps the place as it is when the forecast has nothing for that hour', () => {
    const famara = zone('famara');
    expect(zoneAt(famara, new Date('2027-01-01T12:00:00Z'))).toBe(famara);
  });

  it('has no sea, rather than today’s, past the end of the sea forecast', () => {
    const famara = zone('famara');
    const shortSea = famara.sea ? { ...famara.sea, hourly: famara.sea.hourly.slice(0, 6) } : null;
    const later = zoneAt({ ...famara, sea: shortSea }, dayMoment('2026-10-24', now));
    expect(later.sea).toBeNull();
  });
});
