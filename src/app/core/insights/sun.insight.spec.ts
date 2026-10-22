import { DailyForecast } from '../models';
import { formatTime, islandHour } from '../utils/time';
import { drawingSunTimes, readDaylight } from './sun.insight';

const day = (date: string, sunrise: string | null, sunset: string | null): DailyForecast => ({
  date,
  minC: 19,
  maxC: 25,
  sky: 'despejado',
  precipitationChance: 0,
  maxWindKmh: 15,
  windFromDegrees: 30,
  uvMax: 6,
  sunrise,
  sunset,
});

// 22 October 2026 in Lanzarote (UTC+1): sunrise 08:00, sunset 19:17.
const DAYS = [
  day('2026-10-22', '2026-10-22T07:00:00.000Z', '2026-10-22T18:17:00.000Z'),
  day('2026-10-23', '2026-10-23T07:01:00.000Z', '2026-10-23T18:16:00.000Z'),
];

describe('daylight', () => {
  it('counts down to sunrise before dawn', () => {
    const reading = readDaylight(DAYS, new Date('2026-10-22T05:30:00Z'));
    expect(reading?.phase).toBe('before-sunrise');
    expect(reading?.progress).toBe(0);
    expect(reading?.untilMs).toBe(90 * 60_000);
  });

  it('places the sun along its path during the day', () => {
    const noon = new Date('2026-10-22T12:38:30Z');
    const reading = readDaylight(DAYS, noon);
    expect(reading?.phase).toBe('day');
    expect(reading?.progress).toBeCloseTo(0.5, 2);
    expect(formatTime(reading?.sunset ?? '')).toBe('19:17');
    expect(reading?.dayLengthMs).toBe((11 * 60 + 17) * 60_000);
  });

  it("looks ahead to tomorrow's sunrise after sunset", () => {
    const reading = readDaylight(DAYS, new Date('2026-10-22T21:00:00Z'));
    expect(reading?.phase).toBe('after-sunset');
    expect(formatTime(reading?.nextSunrise ?? '')).toBe('08:01');
  });

  it('says nothing when the provider has no sun times for today', () => {
    const missing = [day('2026-10-22', null, null)];
    expect(readDaylight(missing, new Date('2026-10-22T12:00:00Z'))).toBeNull();
    expect(readDaylight([], new Date('2026-10-22T12:00:00Z'))).toBeNull();
  });

  it('draws a nominal day only when the real one is missing', () => {
    const at = new Date('2026-10-22T12:00:00Z');
    expect(drawingSunTimes(DAYS[0], at).sunset.toISOString()).toBe('2026-10-22T18:17:00.000Z');
    const nominal = drawingSunTimes(day('2026-10-22', null, null), at);
    expect(islandHour(nominal.sunrise)).toBe(7.5);
    expect(islandHour(nominal.sunset)).toBe(19.5);
  });
});
