import { ZoneConditions } from '../models';
import { seaLevelFor } from './sea.insight';
import { readWind } from './wind.insight';

/*
 * Where to go when it blows: the kinds of day that decide which coast is
 * sheltered, and the places ordered from the calmest to the roughest. The
 * kinds are the ones the fixed guide in Dónde ir explains; these rules only
 * say which of them today is.
 */

/** The kinds of day the guide explains, in the order it lists them (most usual first). */
export type WindSituation = 'alisio' | 'mar-de-fondo' | 'sur' | 'calma';

export const WIND_SITUATIONS: readonly WindSituation[] = ['alisio', 'mar-de-fondo', 'sur', 'calma'];

/** Below this everywhere (km/h), the island is calm and the direction says nothing. */
const CALM_MAX_KMH = 15;

/** Coasts open to the Atlantic swell from the north and west. */
const SWELL_COASTS: ReadonlySet<string> = new Set(['N', 'NO', 'O']);

/** "Mar movido" or more on those coasts: the swell is the news of the day. */
const SWELL_MIN_LEVEL = 3;

/**
 * The direction the island's wind comes from, in degrees: the mean of every
 * place's wind, each weighted by its speed, so the open coasts (where the
 * flow is felt) count more than the sheltered ones. Null when nothing blows.
 */
export function islandWindFrom(zones: readonly ZoneConditions[]): number | null {
  let x = 0;
  let y = 0;
  for (const { weather } of zones) {
    const { speedKmh, fromDegrees } = weather.current.wind;
    const rad = (fromDegrees * Math.PI) / 180;
    x += speedKmh * Math.sin(rad);
    y += speedKmh * Math.cos(rad);
  }
  if (Math.hypot(x, y) < 1) return null;
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}

/**
 * Which of the guide's kinds of day today is: none, one or two (a swell can
 * come with any wind). A wind from the west or north-west is none of them.
 */
export function windSituations(zones: readonly ZoneConditions[]): ReadonlySet<WindSituation> {
  const found = new Set<WindSituation>();
  if (zones.length === 0) return found;

  const maxWind = Math.max(...zones.map((z) => z.weather.current.wind.speedKmh));
  if (maxWind < CALM_MAX_KMH) {
    found.add('calma');
  } else {
    const from = islandWindFrom(zones);
    // North to east-north-east is the trade wind; east round to south-west, the "wrong" side.
    if (from !== null && (from >= 337.5 || from < 75)) found.add('alisio');
    else if (from !== null && from >= 75 && from < 247.5) found.add('sur');
  }

  const swell = zones.some(
    (z) =>
      z.sea !== null &&
      SWELL_COASTS.has(z.location.facing) &&
      seaLevelFor(z.sea.current.waveHeightM) >= SWELL_MIN_LEVEL,
  );
  if (swell) found.add('mar-de-fondo');
  return found;
}

/**
 * How rough a place is now, 0–4: the worse of its wind and its sea, on the
 * scales the rest of the app reads them with. Without a sea forecast, the
 * wind alone.
 */
export function roughness(zone: ZoneConditions): number {
  const wind = readWind(zone.weather.current.wind).level;
  const sea = zone.sea ? seaLevelFor(zone.sea.current.waveHeightM) : 0;
  return Math.max(wind, sea);
}

/** The places from the most sheltered to the roughest: by roughness, then wind, then waves. */
export function byShelter(zones: readonly ZoneConditions[]): ZoneConditions[] {
  return [...zones].sort(
    (a, b) =>
      roughness(a) - roughness(b) ||
      a.weather.current.wind.speedKmh - b.weather.current.wind.speedKmh ||
      (a.sea?.current.waveHeightM ?? 0) - (b.sea?.current.waveHeightM ?? 0) ||
      a.location.name.localeCompare(b.location.name),
  );
}
