import { GeoPoint, StationObservation } from '../models';
import { distanceKm } from '../utils/geo';
import { TIME, toDate } from '../utils/time';

/** An observation older than this no longer describes "now". */
const MAX_AGE = 3 * TIME.HOUR;
/** Beyond this, a station says little about the place. */
const MAX_KM = 10;
/**
 * Every place in the catalogue is on the coast. A station up in the hills
 * (Tías 376 m, Haría 277 m, Tinajo 275 m) sits in other weather — Haría is
 * behind the Risco de Famara — so it never stands for a beach.
 */
const MAX_ALTITUDE_M = 150;

/**
 * The station that can honestly speak for a coastal place right now: low,
 * close and recent. Null when there is none — better nothing than a reading
 * from somewhere else.
 */
export function representativeObservation(
  place: GeoPoint,
  observations: readonly StationObservation[],
  now: Date,
): StationObservation | null {
  return (
    observations
      .filter((o) => o.altitudeM !== null && o.altitudeM <= MAX_ALTITUDE_M)
      .filter((o) => now.getTime() - toDate(o.time).getTime() <= MAX_AGE)
      .map((o) => ({ o, km: distanceKm(place, o.position) }))
      .filter(({ km }) => km <= MAX_KM)
      .sort((a, b) => a.km - b.km)[0]?.o ?? null
  );
}
