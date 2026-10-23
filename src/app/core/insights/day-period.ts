import { islandHour, TIME } from '../utils/time';
import { SunTimes } from './sun.insight';

/*
 * The moment of the day a piece of text talks about. It follows the sun of
 * the place and its day (Open-Meteo gives sunrise and sunset in island time),
 * not fixed clock hours: at 07:30 in October the sun is still below the
 * horizon, but the day has begun, so it is first light, not night.
 */

export type DayPeriod =
  /** From 01:00 until an hour before sunrise. */
  | 'madrugada'
  /** First light: from an hour before sunrise until 75 minutes after it. */
  | 'primera-hora'
  | 'manana'
  /** Around the sun's highest point: an hour before it until 90 minutes after. */
  | 'mediodia'
  | 'tarde'
  /** The last hour of sun and the twilight after it. */
  | 'atardecer'
  /** From 45 minutes after sunset until 01:00. */
  | 'noche';

const FIRST_LIGHT_BEFORE = 60 * TIME.MINUTE;
const FIRST_LIGHT_AFTER = 75 * TIME.MINUTE;
const MIDDAY_BEFORE = 60 * TIME.MINUTE;
const MIDDAY_AFTER = 90 * TIME.MINUTE;
const SUNSET_BEFORE = 60 * TIME.MINUTE;
const SUNSET_AFTER = 45 * TIME.MINUTE;
/** Island hour at which the night turns into the small hours. */
const SMALL_HOURS_FROM = 1;

/** Which part of the day `at` falls in, given that day's sun in the island. */
export function dayPeriod(at: Date, sun: SunTimes): DayPeriod {
  const t = at.getTime();
  const sunrise = sun.sunrise.getTime();
  const sunset = sun.sunset.getTime();
  const solarNoon = (sunrise + sunset) / 2;

  if (t < sunrise - FIRST_LIGHT_BEFORE) {
    return islandHour(at) < SMALL_HOURS_FROM ? 'noche' : 'madrugada';
  }
  if (t < sunrise + FIRST_LIGHT_AFTER) return 'primera-hora';
  if (t < solarNoon - MIDDAY_BEFORE) return 'manana';
  if (t < solarNoon + MIDDAY_AFTER) return 'mediodia';
  if (t < sunset - SUNSET_BEFORE) return 'tarde';
  if (t < sunset + SUNSET_AFTER) return 'atardecer';
  return 'noche';
}

/** True between sunrise and sunset. */
export function isSunUp(at: Date, sun: SunTimes): boolean {
  const t = at.getTime();
  return t >= sun.sunrise.getTime() && t < sun.sunset.getTime();
}
