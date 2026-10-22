import { IsoInstant } from '../models';
import { formatTime, islandDateKey, toDate } from '../utils/time';
import { Formatted, msg, Msg } from './i18n.model';

/* Small phrases shared by several screens, built from raw values. */

/** "Hoy" / "Mañana" / the weekday of `at`, seen from `now`. */
export function dayOf(at: IsoInstant | Date, now: Date): Formatted {
  return { day: islandDateKey(toDate(at)), today: islandDateKey(now) };
}

/** "Hoy, de 11:00 a 17:00" */
export function timeWindow(from: IsoInstant, to: IsoInstant, now: Date): Msg {
  return msg('time.window', { day: dayOf(from, now), from: { time: from }, to: { time: to } });
}

/** "16 h" / "16:00" */
export function hourLabel(at: IsoInstant | Date): Msg {
  return msg('time.hourShort', { hour: formatTime(at).slice(0, 2) });
}
