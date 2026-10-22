import { TideExtreme, TidePoint } from '../../core/models';

/*
 * DEMO DATA — a fictional semi-diurnal tide with a spring/neap cycle.
 * Shaped like the real Atlantic tide around Lanzarote (two highs and two lows
 * a day, ~1–2.6 m), but the times are invented. Not for navigation.
 */

const HOUR = 3_600_000;
const PERIOD = 12.4206 * HOUR;
const SPRING_NEAP = 14.765 * 24 * HOUR;
const EPOCH_HIGH = Date.UTC(2026, 0, 1, 3, 12);
const MEAN_LEVEL = 1.32;

function amplitudeAt(t: number): number {
  return 0.92 + 0.3 * Math.cos((2 * Math.PI * (t - EPOCH_HIGH)) / SPRING_NEAP);
}

export function tideHeightAt(t: number, delayMin: number): number {
  const phase = (2 * Math.PI * (t - EPOCH_HIGH - delayMin * 60_000)) / PERIOD;
  return MEAN_LEVEL + amplitudeAt(t) * Math.cos(phase);
}

export function tideExtremes(from: number, to: number, delayMin: number): TideExtreme[] {
  const origin = EPOCH_HIGH + delayMin * 60_000;
  const half = PERIOD / 2;
  const first = Math.ceil((from - origin) / half);
  const extremes: TideExtreme[] = [];
  for (let k = first; origin + k * half <= to; k++) {
    const t = origin + k * half;
    extremes.push({
      kind: k % 2 === 0 ? 'pleamar' : 'bajamar',
      time: new Date(t).toISOString(),
      heightM: Math.round(tideHeightAt(t, delayMin) * 100) / 100,
    });
  }
  return extremes;
}

export function tideSeries(
  from: number,
  to: number,
  stepMin: number,
  delayMin: number,
): TidePoint[] {
  const points: TidePoint[] = [];
  for (let t = from; t <= to; t += stepMin * 60_000) {
    points.push({
      time: new Date(t).toISOString(),
      heightM: Math.round(tideHeightAt(t, delayMin) * 100) / 100,
    });
  }
  return points;
}
