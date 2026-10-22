import { TideDatum, TideExtreme, TideForecast, TideKind } from '../models';
import { clamp } from '../utils/math';
import { formatDuration, formatTime, toDate } from '../utils/time';

export type TideTrend = 'subiendo' | 'bajando';

export interface TideReading {
  readonly trend: TideTrend;
  /** Set when within ~40 minutes of a high or low. */
  readonly atExtreme: TideKind | null;
  /** "La marea está bajando" */
  readonly headline: string;
  /** "Bajamar a las 16:40" */
  readonly nextLabel: string;
  /** "2 h 10 min" */
  readonly untilNext: string;
  readonly previous: TideExtreme;
  readonly next: TideExtreme;
  readonly heightM: number;
  /** 0 = lowest, 1 = highest of the surrounding cycle. */
  readonly level: number;
}

const NEAR_EXTREME_MS = 40 * 60_000;

/** Height between two extremes follows half a cosine — the shape of a real tide. */
function heightBetween(previous: TideExtreme, next: TideExtreme, at: number): number {
  const a = toDate(previous.time).getTime();
  const b = toDate(next.time).getTime();
  const t = clamp((at - a) / (b - a));
  return previous.heightM + ((next.heightM - previous.heightM) * (1 - Math.cos(Math.PI * t))) / 2;
}

function bracket(tide: TideForecast, at: number): [TideExtreme, TideExtreme] | null {
  const extremes = tide.extremes;
  for (let i = 0; i < extremes.length - 1; i++) {
    const a = toDate(extremes[i].time).getTime();
    const b = toDate(extremes[i + 1].time).getTime();
    if (at >= a && at < b) return [extremes[i], extremes[i + 1]];
  }
  return null;
}

export function tideHeightAt(tide: TideForecast, at: Date): number | null {
  const pair = bracket(tide, at.getTime());
  return pair ? heightBetween(pair[0], pair[1], at.getTime()) : null;
}

export function readTide(tide: TideForecast, at: Date): TideReading | null {
  const now = at.getTime();
  const pair = bracket(tide, now);
  if (!pair) return null;
  const [previous, next] = pair;

  const trend: TideTrend = next.kind === 'pleamar' ? 'subiendo' : 'bajando';
  const sincePrevious = now - toDate(previous.time).getTime();
  const untilNextMs = toDate(next.time).getTime() - now;

  let atExtreme: TideKind | null = null;
  if (sincePrevious <= NEAR_EXTREME_MS) atExtreme = previous.kind;
  else if (untilNextMs <= NEAR_EXTREME_MS) atExtreme = next.kind;

  const heightM = heightBetween(previous, next, now);
  const low = Math.min(previous.heightM, next.heightM);
  const high = Math.max(previous.heightM, next.heightM);

  const headline =
    atExtreme === 'pleamar'
      ? 'Marea alta ahora'
      : atExtreme === 'bajamar'
        ? 'Marea baja ahora'
        : `La marea está ${trend}`;

  return {
    trend,
    atExtreme,
    headline,
    // An estimate never gets an exact-sounding time.
    nextLabel: `${next.kind === 'pleamar' ? 'Pleamar' : 'Bajamar'} ${tide.source.official ? 'a las' : 'hacia las'} ${formatTime(next.time)}`,
    untilNext: formatDuration(untilNextMs),
    previous,
    next,
    heightM,
    level: high === low ? 0.5 : clamp((heightM - low) / (high - low)),
  };
}

/**
 * "2,4" on a chart datum; "+0,5" / "−1,1" around mean sea level, where the
 * sign is the information.
 */
export function formatTideHeight(heightM: number, datum: TideDatum): string {
  const text = Math.abs(heightM).toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (datum === 'chart') return heightM < 0 ? `−${text}` : text;
  return `${heightM < 0 ? '−' : '+'}${text}`;
}

/** Extremes that fall within [from, to). */
export function extremesBetween(tide: TideForecast, from: Date, to: Date): TideExtreme[] {
  return tide.extremes.filter((e) => {
    const t = toDate(e.time).getTime();
    return t >= from.getTime() && t < to.getTime();
  });
}
