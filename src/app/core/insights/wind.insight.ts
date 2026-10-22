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
  /** "Brisa suave" */
  readonly label: Msg;
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

/** Upper speed (km/h, exclusive) of each level, from "no wind" to "very strong". */
const LEVEL_MAX: readonly number[] = [6, 20, 30, 45, Infinity];

export function readWind(wind: Wind): WindReading {
  const index = LEVEL_MAX.findIndex((max) => wind.speedKmh < max);
  const level = (index === -1 ? 4 : index) as WindLevel;
  const direction = toCardinal(wind.fromDegrees);
  const label = msg(`wind.level.${level}.label`);
  const from = fromDirection(wind.fromDegrees);
  return {
    level,
    label,
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
