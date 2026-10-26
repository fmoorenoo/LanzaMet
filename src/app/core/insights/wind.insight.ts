import { msg, Msg } from '../i18n/i18n.model';
import { CardinalDirection, WeatherSnapshot, Wind } from '../models';
import { clamp } from '../utils/math';

export const DIRECTION_DEGREES: Readonly<Record<CardinalDirection, number>> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SO: 225,
  O: 270,
  NO: 315,
};

const ORDER: readonly CardinalDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export function toCardinal(degrees: number): CardinalDirection {
  return ORDER[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

/** "del nordeste" */
export function fromDirection(degrees: number): Msg {
  return msg('wind.from', { dir: msg(`dir.${toCardinal(degrees)}`) });
}

export type WindLevel = 0 | 1 | 2 | 3 | 4;

export interface WindReading {
  readonly level: WindLevel;
  /** "Viento flojo" */
  readonly label: Msg;
  /** The level alone, for a scale: "Flojo" */
  readonly scale: Msg;
  /** For sentences: "brisa suave" */
  readonly phrase: Msg;
  /** "del nordeste" */
  readonly from: Msg;
  /** "Brisa suave del nordeste" */
  readonly labelFrom: Msg;
  readonly direction: CardinalDirection;
  /** The north-easterly trade wind that shapes Lanzarote's weather. */
  readonly isTradeWind: boolean;
  /** "14 km/h, rachas de 25" */
  readonly detail: Msg;
  /** 0–1, drives how fast things drift in the scene. */
  readonly strength: number;
}

/**
 * Upper speed (km/h, exclusive) of each level: the Beaufort scale (WMO), its
 * forces grouped the way people feel them on a beach.
 *
 * | Level | Name       | km/h  | Beaufort | On the shore                          |
 * |-------|------------|-------|----------|---------------------------------------|
 * | 0     | Calma      | < 6   | 0–1      | Smoke rises, flags hang               |
 * | 1     | Flojo      | 6–19  | 2–3      | Felt on the face, flags stir          |
 * | 2     | Moderado   | 20–28 | 4        | Dry sand and loose paper lift         |
 * | 3     | Fuerte     | 29–49 | 5–6      | Sand stings, umbrellas hard to hold   |
 * | 4     | Muy fuerte | ≥ 50  | 7+       | Hard to walk against                  |
 */
export const WIND_LEVEL_MAX: readonly number[] = [6, 20, 29, 50, Infinity];

/** Above this the scale is full: the speed at which bars and gauges stop growing. */
export const WIND_SCALE_TOP_KMH = 60;

/** 0–1, how far up the scale a speed is, for bars and gauges (linear to WIND_SCALE_TOP_KMH). */
export function windShare(speedKmh: number): number {
  return clamp(speedKmh / WIND_SCALE_TOP_KMH);
}

/** Linear between (km/h, value) anchors, held flat past either end. */
function along(stops: readonly (readonly [number, number])[], speedKmh: number): number {
  const s = Math.max(0, speedKmh);
  const last = stops[stops.length - 1];
  if (s >= last[0]) return last[1];
  const i = stops.findIndex(([kmh]) => kmh > s) - 1;
  const [k0, v0] = stops[i];
  const [k1, v1] = stops[i + 1];
  return v0 + ((v1 - v0) * (s - k0)) / (k1 - k0);
}

/**
 * The colour of a speed, as an OKLCH hue: green while the wind is light,
 * yellow and orange as it turns moderate, red when it is strong, and on
 * through magenta to violet at the top of the scale. Anchored to the levels
 * above (km/h → hue), eased in between, so 18 and 22 km/h look close while
 * 12 and 35 look far apart. Past red the hue goes below 0 (−55 is violet,
 * the same angle as 305), so the scale only ever falls.
 */
const WIND_HUES: readonly (readonly [number, number])[] = [
  [0, 150],
  [10, 142],
  [20, 100],
  [29, 66],
  [38, 40],
  [46, 26],
  [60, -55],
];

export function windHue(speedKmh: number): number {
  return Math.round(along(WIND_HUES, speedKmh));
}

/**
 * How much of that colour shows, 0–1: a calm is almost white (a trace of
 * green), and the colour comes in fully by a light breeze. Multiplies the
 * chroma of the tint and the ink (`--wind-tint`).
 */
const WIND_TINTS: readonly (readonly [number, number])[] = [
  [0, 0.1],
  [9, 1],
];

export function windTint(speedKmh: number): number {
  return Math.round(along(WIND_TINTS, speedKmh) * 100) / 100;
}

/**
 * Where a speed sits on the five-step scale, 0–5: whole steps for the levels
 * passed, plus how far into the current one. Gauges fill by this, so each
 * segment is one level and its fill is the speed within it.
 */
export function windSteps(speedKmh: number): number {
  const index = WIND_LEVEL_MAX.findIndex((max) => speedKmh < max);
  const level = index === -1 ? 4 : index;
  const from = level === 0 ? 0 : WIND_LEVEL_MAX[level - 1];
  const to = level === 4 ? WIND_SCALE_TOP_KMH + 10 : WIND_LEVEL_MAX[level];
  return level + clamp((speedKmh - from) / (to - from));
}

export function readWind(wind: Wind): WindReading {
  const index = WIND_LEVEL_MAX.findIndex((max) => wind.speedKmh < max);
  const level = (index === -1 ? 4 : index) as WindLevel;
  const direction = toCardinal(wind.fromDegrees);
  const label = msg(`wind.level.${level}.label`);
  const from = fromDirection(wind.fromDegrees);
  return {
    level,
    label,
    scale: msg(`wind.scale.${level}`),
    phrase: msg(`wind.level.${level}.phrase`),
    from,
    labelFrom: msg('wind.labelFrom', { label, from }),
    direction,
    isTradeWind: (direction === 'N' || direction === 'NE') && wind.speedKmh >= 15,
    detail:
      wind.gustKmh >= wind.speedKmh + 6
        ? msg('wind.detailGusts', { speed: wind.speedKmh, gust: wind.gustKmh })
        : msg('wind.detail', { speed: wind.speedKmh }),
    strength: clamp(wind.speedKmh / 50),
  };
}

export type Trend = 'sube' | 'baja' | 'estable';

/** Compares the next few hours with now. */
export function windTrend(now: WeatherSnapshot, upcoming: readonly WeatherSnapshot[]): Trend {
  const ahead = upcoming.slice(1, 6).map((h) => h.wind.speedKmh);
  if (ahead.length === 0) return 'estable';
  const max = Math.max(...ahead);
  const min = Math.min(...ahead);
  if (max >= now.wind.speedKmh + 7 && max >= 20) return 'sube';
  if (min <= now.wind.speedKmh - 7) return 'baja';
  return 'estable';
}
