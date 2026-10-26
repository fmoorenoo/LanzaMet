import { IsoDate, IsoInstant, ZoneConditions } from '../models';
import { addHours, atIslandHour, islandDateKey, startOfIslandDay, TIME } from '../utils/time';

/*
 * The day the app is looking at, and the moment that stands for it. Today is
 * seen as it is now; any later day at midday, when it is most itself: the
 * sun high, the beach open, the wind of the day blowing. Pure functions, so
 * every screen reads the same moment for the same day.
 */

/** The hour a day other than today is shown at. */
export const DAY_HOUR = 12;

/** Noon UTC of an island date: always inside that island day (UTC+0 or +1). */
export function dateFromKey(day: IsoDate): Date {
  return new Date(`${day}T12:00:00Z`);
}

/** Local midnight that opens the island day `day`. */
export function dayStart(day: IsoDate): Date {
  return startOfIslandDay(dateFromKey(day));
}

/** Now, for today; midday for any other day. */
export function dayMoment(day: IsoDate, now: Date): Date {
  return day === islandDateKey(now) ? now : atIslandHour(dateFromKey(day), DAY_HOUR);
}

export type DayKind = 'today' | 'tomorrow' | 'later';

export function dayKind(day: IsoDate, today: IsoDate): DayKind {
  if (day === today) return 'today';
  return day === islandDateKey(addHours(dateFromKey(today), 24)) ? 'tomorrow' : 'later';
}

/** The steps of an hourly series that fall on the island day `day`. */
export function hoursOfDay<T extends { readonly time: IsoInstant }>(
  items: readonly T[],
  day: IsoDate,
): T[] {
  return items.filter((item) => islandDateKey(new Date(item.time)) === day);
}

/** The step of an hourly series whose hour contains `at`, or undefined when there is none. */
export function stepAt<T extends { readonly time: IsoInstant }>(
  items: readonly T[],
  at: Date,
): T | undefined {
  const hour = Math.floor(at.getTime() / TIME.HOUR);
  return items.find((item) => Math.floor(Date.parse(item.time) / TIME.HOUR) === hour);
}

/** The steps of an hourly series from the hour containing `from` onwards. */
export function stepsFrom<T extends { readonly time: IsoInstant }>(
  items: readonly T[],
  from: Date,
): T[] {
  const start = Math.floor(from.getTime() / TIME.HOUR) * TIME.HOUR;
  return items.filter((item) => Date.parse(item.time) >= start);
}

/**
 * A place as the forecast sees it at `at`: that hour's weather and sea stand
 * in for "now", and its hours run from `from`. Island-wide views (the map,
 * the calmest sea, the plans) then read any day with the rules they use for
 * today. Unchanged when the forecast has no weather for that hour; without
 * a sea forecast for it, the place has no sea, rather than today's.
 */
export function zoneAt(zone: ZoneConditions, at: Date, from: Date = at): ZoneConditions {
  const weather = stepAt(zone.weather.hourly, at);
  if (!weather) return zone;
  const sea = zone.sea ? stepAt(zone.sea.hourly, at) : undefined;
  return {
    location: zone.location,
    weather: { ...zone.weather, current: weather, hourly: stepsFrom(zone.weather.hourly, from) },
    sea:
      zone.sea && sea
        ? { ...zone.sea, current: sea, hourly: stepsFrom(zone.sea.hourly, from) }
        : null,
  };
}
