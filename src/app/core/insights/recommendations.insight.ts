import {
  Recommendation,
  SeaSnapshot,
  TimeWindow,
  WeatherSnapshot,
  ZoneConditions,
} from '../models';
import { clamp } from '../utils/math';
import {
  addHours,
  formatTime,
  islandDateKey,
  islandHour,
  minutesBetween,
  toDate,
} from '../utils/time';
import { describeWaves, readSea } from './sea.insight';
import { skyPhrase } from './sky.insight';
import { beachScore } from './verdict.insight';
import { readWind } from './wind.insight';

/*
 * Turns island-wide conditions into a handful of concrete suggestions.
 * In this phase it runs over simulated data; the same rules can run over real
 * forecasts, or move to a backend, without changing the Recommendation contract.
 */

interface HourPoint {
  readonly time: Date;
  readonly weather: WeatherSnapshot;
  readonly sea: SeaSnapshot | null;
}

interface Window {
  readonly points: readonly HourPoint[];
  readonly total: number;
  readonly average: number;
}

function hourPoints(zone: ZoneConditions): HourPoint[] {
  return zone.weather.hourly.map((weather, i) => ({
    time: toDate(weather.time),
    weather,
    sea: zone.sea?.hourly[i] ?? null,
  }));
}

/** Daylight hours left today, or tomorrow's if today is nearly over. */
function planningHours(zone: ZoneConditions, now: Date): HourPoint[] {
  const all = hourPoints(zone);
  const today = islandDateKey(now);
  const rest = all.filter((p) => p.weather.isDaylight && islandDateKey(p.time) === today);
  if (rest.length >= 2) return rest;
  const tomorrow = islandDateKey(addHours(now, 24));
  return all.filter((p) => p.weather.isDaylight && islandDateKey(p.time) === tomorrow);
}

function bestWindow(
  points: readonly HourPoint[],
  score: (p: HourPoint) => number,
  threshold: number,
): Window | null {
  let best: Window | null = null;
  let run: HourPoint[] = [];
  let runTotal = 0;
  const close = () => {
    if (run.length > 0 && (!best || runTotal > best.total)) {
      best = { points: run, total: runTotal, average: runTotal / run.length };
    }
    run = [];
    runTotal = 0;
  };
  points.forEach((p, i) => {
    const contiguous = i === 0 || minutesBetween(points[i - 1].time, p.time) <= 60;
    if (!contiguous) close();
    const s = score(p);
    if (s >= threshold) {
      run.push(p);
      runTotal += s;
    } else {
      close();
    }
  });
  close();
  return best;
}

function toTimeWindow(window: Window): TimeWindow {
  const first = window.points[0].time;
  const last = window.points[window.points.length - 1].time;
  return { from: first.toISOString(), to: addHours(last, 1).toISOString() };
}

function middle<T>(items: readonly T[]): T {
  return items[Math.floor(items.length / 2)];
}

const canBathe = (z: ZoneConditions) => z.location.kind !== 'costa' && z.location.shore !== 'roca';

function walkScore(p: HourPoint): number {
  const t = p.weather.temperatureC;
  const comfort = t < 18 ? clamp(1 - (18 - t) / 5) : t <= 25 ? 1 : clamp(1 - (t - 25) / 5);
  const sun = p.weather.uvIndex <= 4 ? 1 : 0.35;
  const wind = p.weather.wind.speedKmh <= 25 ? 1 : 0.5;
  return p.weather.sky === 'lluvia' ? 0 : comfort * sun * wind;
}

export function buildRecommendations(
  zones: readonly ZoneConditions[],
  now: Date,
): Recommendation[] {
  if (zones.length === 0) return [];
  const recommendations: Recommendation[] = [];
  const used = new Set<string>();
  const bathing = zones.filter(canBathe);
  // "Right now" suggestions (shelter, calm water, waves) only make sense in daylight.
  const isDaytime = zones.some((z) => z.weather.current.isDaylight);

  // ── A beach worth the trip ─────────────────────────────────
  let beach: { zone: ZoneConditions; window: Window } | null = null;
  for (const zone of bathing) {
    const window = bestWindow(planningHours(zone, now), (p) => beachScore(p.weather, p.sea), 0.74);
    if (window && (!beach || window.total > beach.window.total)) beach = { zone, window };
  }
  if (beach) {
    const mid = middle(beach.window.points);
    const sea = mid.sea ? ` y ${readSea(mid.sea).phrase}` : '';
    recommendations.push({
      id: 'playa',
      kind: 'playa',
      locationId: beach.zone.location.id,
      title: `Playa en ${beach.zone.location.name}`,
      reason: `${skyPhrase(mid.weather.sky, true)}, ${readWind(mid.weather.wind).phrase}${sea}.`,
      window: toTimeWindow(beach.window),
      score: 0.7 + 0.3 * beach.window.average,
    });
    used.add(beach.zone.location.id);
  }

  // ── Out of the wind ────────────────────────────────────────
  const windiest = [...zones].sort(
    (a, b) => b.weather.current.wind.speedKmh - a.weather.current.wind.speedKmh,
  )[0];
  if (isDaytime && windiest.weather.current.wind.speedKmh >= 22) {
    const calm = [...bathing].sort(
      (a, b) => a.weather.current.wind.speedKmh - b.weather.current.wind.speedKmh,
    );
    const pick = calm.find((z) => !used.has(z.location.id)) ?? calm[0];
    const gap = windiest.weather.current.wind.speedKmh - (pick?.weather.current.wind.speedKmh ?? 0);
    if (pick && gap >= 8) {
      const wind = readWind(windiest.weather.current.wind);
      recommendations.push({
        id: 'resguardo',
        kind: 'resguardo',
        locationId: pick.location.id,
        title: `Sin viento en ${pick.location.name}`,
        reason: `El viento ${wind.from} apenas llega: ${pick.weather.current.wind.speedKmh} km/h, frente a ${windiest.weather.current.wind.speedKmh} en ${windiest.location.name}.`,
        score: 0.72 + clamp(gap / 60) * 0.2,
      });
      used.add(pick.location.id);
    }
  }

  // ── The calmest water ──────────────────────────────────────
  const withSea = bathing
    .filter((z) => z.sea)
    .sort((a, b) => (a.sea?.current.waveHeightM ?? 9) - (b.sea?.current.waveHeightM ?? 9));
  const calmSea = withSea.find((z) => !used.has(z.location.id));
  if (isDaytime && calmSea?.sea && calmSea.sea.current.waveHeightM <= 0.8) {
    recommendations.push({
      id: 'mar-calmo',
      kind: 'mar-calmo',
      locationId: calmSea.location.id,
      title: `Mar tranquilo en ${calmSea.location.name}`,
      reason: `${describeWaves(calmSea.sea.current.waveHeightM)}: buen sitio para nadar.`,
      score: 0.7 + (0.8 - calmSea.sea.current.waveHeightM) * 0.2,
    });
    used.add(calmSea.location.id);
  }

  // ── A sunset facing the open ocean ─────────────────────────
  const sunsetZones = zones.filter((z) => ['O', 'NO', 'SO'].includes(z.location.facing));
  let sunset: { zone: ZoneConditions; at: Date; clouds: number } | null = null;
  for (const zone of sunsetZones) {
    const day = zone.weather.daily.find((d) => minutesBetween(now, d.sunset) > -15);
    if (!day) continue;
    const at = toDate(day.sunset);
    const nearest = [...zone.weather.hourly].sort(
      (a, b) => Math.abs(minutesBetween(a.time, at)) - Math.abs(minutesBetween(b.time, at)),
    )[0];
    if (!nearest || nearest.sky === 'lluvia' || nearest.cloudCover > 0.7) continue;
    if (!sunset || nearest.cloudCover < sunset.clouds) {
      sunset = { zone, at, clouds: nearest.cloudCover };
    }
  }
  if (sunset) {
    recommendations.push({
      id: 'atardecer',
      kind: 'atardecer',
      locationId: sunset.zone.location.id,
      title: `Atardecer en ${sunset.zone.location.name}`,
      reason: `El sol se pone a las ${formatTime(sunset.at)}${sunset.clouds < 0.3 ? ' con el horizonte despejado' : ' entre algunas nubes'}.`,
      window: {
        from: addHours(sunset.at, -0.75).toISOString(),
        to: addHours(sunset.at, 0.25).toISOString(),
      },
      score: 0.62 + (1 - sunset.clouds) * 0.2,
    });
  }

  // ── A walk when the sun eases off ──────────────────────────
  const promenades = zones.filter(
    (z) =>
      (z.location.kind === 'ciudad' || z.location.kind === 'pueblo') &&
      z.location.area !== 'norte' &&
      z.location.area !== 'oeste',
  );
  let walk: { zone: ZoneConditions; window: Window } | null = null;
  for (const zone of promenades) {
    const hours = hourPoints(zone).filter((p) => {
      const h = islandHour(p.time);
      return (
        minutesBetween(now, p.time) > -60 &&
        h >= 7 &&
        h <= 22 &&
        minutesBetween(now, p.time) < 20 * 60
      );
    });
    const window = bestWindow(hours, walkScore, 0.8);
    if (window && (!walk || window.total > walk.window.total)) walk = { zone, window };
  }
  if (walk) {
    const first = walk.window.points[0];
    const morning = islandHour(first.time) < 12;
    const temp = Math.round(first.weather.temperatureC);
    recommendations.push({
      id: 'paseo',
      kind: 'paseo',
      locationId: walk.zone.location.id,
      title: `Paseo por ${walk.zone.location.name}`,
      reason: morning
        ? `A primera hora, con ${temp} °C y el sol todavía suave.`
        : `Con ${temp} °C y el sol ya bajo, se camina a gusto.`,
      window: toTimeWindow(walk.window),
      score: 0.6,
    });
  }

  // ── Waves, for those who ride them ─────────────────────────
  const surf = zones
    .filter((z) => z.sea && ['N', 'NO', 'O'].includes(z.location.facing))
    .filter((z) => {
      const h = z.sea?.current.waveHeightM ?? 0;
      return h >= 1.2 && h <= 3 && z.weather.current.wind.speedKmh < 38;
    })
    .sort((a, b) => (b.sea?.current.waveHeightM ?? 0) - (a.sea?.current.waveHeightM ?? 0))[0];
  if (isDaytime && surf?.sea) {
    recommendations.push({
      id: 'olas',
      kind: 'olas',
      locationId: surf.location.id,
      title: `Olas en ${surf.location.name}`,
      reason: `${describeWaves(surf.sea.current.waveHeightM)} y viento ${readWind(surf.weather.current.wind).from}: para quien ya sabe surfear.`,
      score: 0.58,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}
