import { DailyForecast, IsoDate, IsoInstant } from '../models';
import { addHours, atIslandHour, islandDateKey, toDate } from '../utils/time';

/*
 * Sunrise and sunset come from the forecast provider (Open-Meteo, computed for
 * each place in island time). They can be missing; then nothing about them is
 * said, and only the drawing falls back to a nominal day.
 */

/** A plain island day, used to light the scene when the provider gave no sun times. */
const NOMINAL_SUNRISE_HOUR = 7.5;
const NOMINAL_SUNSET_HOUR = 19.5;

export interface SunTimes {
  readonly sunrise: Date;
  readonly sunset: Date;
}

/** Sun times to draw with: the day's own, or a nominal day when the provider has none. */
export function drawingSunTimes(day: DailyForecast | undefined, at: Date): SunTimes {
  if (day?.sunrise && day.sunset) {
    return { sunrise: toDate(day.sunrise), sunset: toDate(day.sunset) };
  }
  return {
    sunrise: atIslandHour(at, NOMINAL_SUNRISE_HOUR),
    sunset: atIslandHour(at, NOMINAL_SUNSET_HOUR),
  };
}

/** Where the sun is now; `upcoming` for a later day, whose light is all still to come. */
export type DaylightPhase = 'before-sunrise' | 'day' | 'after-sunset' | 'upcoming';

export interface DaylightReading {
  readonly sunrise: IsoInstant;
  readonly sunset: IsoInstant;
  readonly phase: DaylightPhase;
  /** How far the sun is along today's path: 0 at sunrise, 1 at sunset. */
  readonly progress: number;
  readonly dayLengthMs: number;
  /** Until sunrise before it, until sunset during the day; 0 after sunset. */
  readonly untilMs: number;
  /** Tomorrow's sunrise, once today's sun has set (null if unknown). */
  readonly nextSunrise: IsoInstant | null;
}

/**
 * A day's light in the island: today's, seen from now; a later day's, all
 * still to come. Null when the provider has no sun times for that day.
 */
export function readDaylight(
  daily: readonly DailyForecast[],
  now: Date,
  day: IsoDate = islandDateKey(now),
): DaylightReading | null {
  const today = daily.find((d) => d.date === day);
  if (!today?.sunrise || !today.sunset) return null;
  const sunrise = toDate(today.sunrise).getTime();
  const sunset = toDate(today.sunset).getTime();
  if (day > islandDateKey(now)) {
    return {
      sunrise: today.sunrise,
      sunset: today.sunset,
      phase: 'upcoming',
      progress: 0,
      dayLengthMs: sunset - sunrise,
      untilMs: 0,
      nextSunrise: null,
    };
  }
  const t = now.getTime();
  const phase: DaylightPhase = t < sunrise ? 'before-sunrise' : t < sunset ? 'day' : 'after-sunset';
  const tomorrow = daily.find((d) => d.date === islandDateKey(addHours(now, 24)));
  return {
    sunrise: today.sunrise,
    sunset: today.sunset,
    phase,
    progress:
      phase === 'before-sunrise' ? 0 : phase === 'day' ? (t - sunrise) / (sunset - sunrise) : 1,
    dayLengthMs: sunset - sunrise,
    untilMs: phase === 'before-sunrise' ? sunrise - t : phase === 'day' ? sunset - t : 0,
    nextSunrise: phase === 'after-sunset' ? (tomorrow?.sunrise ?? null) : null,
  };
}
