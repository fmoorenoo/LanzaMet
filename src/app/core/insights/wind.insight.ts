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

const DIRECTION_NAMES: Readonly<Record<CardinalDirection, string>> = {
  N: 'norte',
  NE: 'nordeste',
  E: 'este',
  SE: 'sureste',
  S: 'sur',
  SO: 'suroeste',
  O: 'oeste',
  NO: 'noroeste',
};

const ORDER: readonly CardinalDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export function toCardinal(degrees: number): CardinalDirection {
  return ORDER[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

/** "del nordeste" */
export function fromDirection(degrees: number): string {
  return `del ${DIRECTION_NAMES[toCardinal(degrees)]}`;
}

export type WindLevel = 0 | 1 | 2 | 3 | 4;

export interface WindReading {
  readonly level: WindLevel;
  /** "Brisa suave" */
  readonly label: string;
  /** For sentences: "brisa suave" */
  readonly phrase: string;
  /** "del nordeste" */
  readonly from: string;
  readonly direction: CardinalDirection;
  /** The north-easterly trade wind that shapes Lanzarote's weather. */
  readonly isTradeWind: boolean;
  /** "14 km/h, rachas de 25" */
  readonly detail: string;
  /** 0–1, drives how fast things drift in the scene. */
  readonly strength: number;
}

const LEVELS: readonly { max: number; label: string; phrase: string }[] = [
  { max: 6, label: 'Sin viento', phrase: 'sin apenas viento' },
  { max: 20, label: 'Brisa suave', phrase: 'brisa suave' },
  { max: 30, label: 'Viento moderado', phrase: 'viento moderado' },
  { max: 45, label: 'Viento fuerte', phrase: 'viento fuerte' },
  { max: Infinity, label: 'Viento muy fuerte', phrase: 'viento muy fuerte' },
];

export function readWind(wind: Wind): WindReading {
  const index = LEVELS.findIndex((l) => wind.speedKmh < l.max);
  const level = (index === -1 ? 4 : index) as WindLevel;
  const direction = toCardinal(wind.fromDegrees);
  const gustText = wind.gustKmh >= wind.speedKmh + 6 ? `, rachas de ${wind.gustKmh}` : '';
  return {
    level,
    label: LEVELS[level].label,
    phrase: LEVELS[level].phrase,
    from: fromDirection(wind.fromDegrees),
    direction,
    isTradeWind: (direction === 'N' || direction === 'NE') && wind.speedKmh >= 15,
    detail: `${wind.speedKmh} km/h${gustText}`,
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
