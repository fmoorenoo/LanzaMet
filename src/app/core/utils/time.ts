import { IsoDate, IsoInstant } from '../models';

/*
 * Island time, independent of language. Words for days and durations live in
 * the i18n layer (core/i18n/translate.ts).
 */

/** Every time in the product is shown in island time, wherever the visitor is. */
export const ISLAND_TIME_ZONE = 'Atlantic/Canary';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ISLAND_TIME_ZONE,
  timeZoneName: 'shortOffset',
  hour: 'numeric',
});

// 24-hour island time reads the same in every language the app speaks.
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ISLAND_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const offsetCache = new Map<number, number>();

/** Minutes ahead of UTC in Lanzarote at a given instant (0 in winter, 60 in summer). */
export function islandOffsetMinutes(date: Date): number {
  const hourKey = Math.floor(date.getTime() / HOUR);
  const cached = offsetCache.get(hourKey);
  if (cached !== undefined) return cached;

  const label = offsetFormatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value;
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(label ?? '');
  const offset = match
    ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0))
    : 0;
  offsetCache.set(hourKey, offset);
  return offset;
}

function shifted(date: Date): Date {
  return new Date(date.getTime() + islandOffsetMinutes(date) * MINUTE);
}

/** Fractional local hour of the day, 0 ≤ h < 24. */
export function islandHour(date: Date): number {
  const local = shifted(date);
  return local.getUTCHours() + local.getUTCMinutes() / 60;
}

export function islandDateKey(date: Date): IsoDate {
  return shifted(date).toISOString().slice(0, 10);
}

/** UTC instant of local midnight for the island day containing `date`. */
export function startOfIslandDay(date: Date): Date {
  const local = shifted(date);
  const midnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const guess = new Date(midnightAsUtc - islandOffsetMinutes(date) * MINUTE);
  return new Date(midnightAsUtc - islandOffsetMinutes(guess) * MINUTE);
}

/** UTC instant for a local wall-clock hour on the island day of `date`. */
export function atIslandHour(date: Date, hour: number): Date {
  const start = startOfIslandDay(date);
  const naive = new Date(start.getTime() + hour * HOUR);
  const drift = islandOffsetMinutes(start) - islandOffsetMinutes(naive);
  return new Date(naive.getTime() + drift * MINUTE);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR);
}

/** Local midnight `days` island days after the day containing `date` (DST-safe). */
export function islandDayStart(date: Date, days = 0): Date {
  return startOfIslandDay(addHours(startOfIslandDay(date), days * 24 + 12));
}

export function toDate(value: IsoInstant | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** "16:40" */
export function formatTime(value: IsoInstant | Date): string {
  return timeFormatter.format(toDate(value));
}

export function minutesBetween(a: IsoInstant | Date, b: IsoInstant | Date): number {
  return (toDate(b).getTime() - toDate(a).getTime()) / MINUTE;
}

export const TIME = { MINUTE, HOUR } as const;
