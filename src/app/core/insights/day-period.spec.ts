import { dayPeriod, isSunUp } from './day-period';
import { SunTimes } from './sun.insight';

// 23 October 2026 in Lanzarote (UTC+1): sunrise 08:01, sunset 19:16, the sun
// highest at 13:38. Times below are island wall-clock times.
const OCTOBER: SunTimes = {
  sunrise: new Date('2026-10-23T07:01:00Z'),
  sunset: new Date('2026-10-23T18:16:00Z'),
};
const october = (hhmm: string) => new Date(`2026-10-23T${hhmm}:00+01:00`);

// 21 December 2026 (UTC+0): sunrise 07:58, sunset 18:12.
const DECEMBER: SunTimes = {
  sunrise: new Date('2026-12-21T07:58:00Z'),
  sunset: new Date('2026-12-21T18:12:00Z'),
};
const december = (hhmm: string) => new Date(`2026-12-21T${hhmm}:00Z`);

// 21 June 2026 (UTC+1): sunrise 07:10, sunset 21:04.
const JUNE: SunTimes = {
  sunrise: new Date('2026-06-21T06:10:00Z'),
  sunset: new Date('2026-06-21T20:04:00Z'),
};
const june = (hhmm: string) => new Date(`2026-06-21T${hhmm}:00+01:00`);

describe('day period', () => {
  it('calls 07:30 in October first light, not night, though the sun is not up yet', () => {
    expect(dayPeriod(october('07:30'), OCTOBER)).toBe('primera-hora');
    expect(isSunUp(october('07:30'), OCTOBER)).toBe(false);
  });

  it('turns the small hours into first light an hour before sunrise', () => {
    expect(dayPeriod(october('06:59'), OCTOBER)).toBe('madrugada');
    expect(dayPeriod(october('07:01'), OCTOBER)).toBe('primera-hora');
  });

  it('keeps first light until 75 minutes after sunrise, then it is morning', () => {
    expect(dayPeriod(october('08:01'), OCTOBER)).toBe('primera-hora');
    expect(isSunUp(october('08:01'), OCTOBER)).toBe(true);
    expect(dayPeriod(october('09:15'), OCTOBER)).toBe('primera-hora');
    expect(dayPeriod(october('09:17'), OCTOBER)).toBe('manana');
  });

  it('centres midday on the sun, not on the clock', () => {
    expect(dayPeriod(october('12:37'), OCTOBER)).toBe('manana');
    expect(dayPeriod(october('12:40'), OCTOBER)).toBe('mediodia');
    expect(dayPeriod(october('15:07'), OCTOBER)).toBe('mediodia');
    expect(dayPeriod(october('15:10'), OCTOBER)).toBe('tarde');
  });

  it('gives sunset the last hour of sun and the twilight after it', () => {
    expect(dayPeriod(october('18:15'), OCTOBER)).toBe('tarde');
    expect(dayPeriod(october('18:17'), OCTOBER)).toBe('atardecer');
    expect(isSunUp(october('19:15'), OCTOBER)).toBe(true);
    expect(isSunUp(october('19:16'), OCTOBER)).toBe(false);
    expect(dayPeriod(october('20:00'), OCTOBER)).toBe('atardecer');
    expect(dayPeriod(october('20:02'), OCTOBER)).toBe('noche');
  });

  it('keeps the night until 01:00, then the small hours begin', () => {
    expect(dayPeriod(october('23:30'), OCTOBER)).toBe('noche');
    expect(dayPeriod(october('00:30'), OCTOBER)).toBe('noche');
    expect(dayPeriod(october('01:30'), OCTOBER)).toBe('madrugada');
  });

  it('reads the island clock across the change to winter time', () => {
    // 25 October 2026: 02:00 summer time becomes 01:00 winter time.
    const sun: SunTimes = {
      sunrise: new Date('2026-10-25T07:02:00Z'),
      sunset: new Date('2026-10-25T18:14:00Z'),
    };
    expect(dayPeriod(new Date('2026-10-24T23:30:00Z'), sun)).toBe('noche'); // 00:30 WEST
    expect(dayPeriod(new Date('2026-10-25T00:30:00Z'), sun)).toBe('madrugada'); // 01:30 WEST
    expect(dayPeriod(new Date('2026-10-25T07:30:00Z'), sun)).toBe('primera-hora'); // 07:30 WET
  });

  it('follows the seasons: same clock time, different moment', () => {
    expect(dayPeriod(december('07:30'), DECEMBER)).toBe('primera-hora');
    expect(dayPeriod(june('06:30'), JUNE)).toBe('primera-hora');
    expect(dayPeriod(june('08:30'), JUNE)).toBe('manana');
    // At 20:30 in June the sun is still up; in December it is long gone.
    expect(dayPeriod(june('20:30'), JUNE)).toBe('atardecer');
    expect(dayPeriod(december('20:30'), DECEMBER)).toBe('noche');
    expect(dayPeriod(june('14:30'), JUNE)).toBe('mediodia');
  });
});
