import { Location, SeaSnapshot, SkyCondition, WeatherSnapshot } from '../models';
import { clamp } from '../utils/math';
import { readSea } from './sea.insight';
import { skyPhrase } from './sky.insight';
import { readWind, windTrend } from './wind.insight';

export type Mood = 'radiante' | 'bueno' | 'regular' | 'malo';

export interface Verdict {
  /** The answer, in a few words: "Hoy apetece playa". */
  readonly headline: string;
  /** One supporting sentence: "Sol y brisa suave en Puerto del Carmen." */
  readonly sentence: string;
  readonly mood: Mood;
}

const SKY_SCORE: Readonly<Record<SkyCondition, number>> = {
  despejado: 1,
  'poco-nuboso': 0.92,
  nuboso: 0.6,
  cubierto: 0.32,
  calima: 0.45,
  lluvia: 0,
};

/** 0–1: how inviting a beach is at this moment. */
export function beachScore(weather: WeatherSnapshot, sea: SeaSnapshot | null): number {
  if (!weather.isDaylight) return 0;
  const t = weather.temperatureC;
  const warmth = t < 22 ? clamp((t - 16) / 6) : t <= 30 ? 1 : clamp(1 - (t - 30) / 6);
  const wind = weather.wind.speedKmh <= 15 ? 1 : clamp(1 - (weather.wind.speedKmh - 15) / 22);
  const waves =
    sea == null ? 0.75 : sea.waveHeightM <= 0.8 ? 1 : clamp(1 - (sea.waveHeightM - 0.8) / 1.4);
  const score = 0.3 * SKY_SCORE[weather.sky] + 0.25 * warmth + 0.25 * wind + 0.2 * waves;
  return weather.sky === 'lluvia' ? score * 0.25 : score;
}

const SURF_COASTS = new Set(['N', 'NO', 'O']);

export interface VerdictInput {
  readonly location: Location;
  readonly weather: WeatherSnapshot;
  /** Hourly steps from the moment being described onwards. */
  readonly upcoming: readonly WeatherSnapshot[];
  readonly sea: SeaSnapshot | null;
  /** "Hoy" or "Mañana" — the day being described. */
  readonly dayWord: string;
}

export function dayVerdict(input: VerdictInput): Verdict {
  const { location, weather, upcoming, sea, dayWord } = input;
  const place = location.name;
  const wind = readWind(weather.wind);
  const seaReading = sea ? readSea(sea) : null;
  const sky = skyPhrase(weather.sky, weather.isDaylight);
  const plain = `${sky} y ${wind.phrase} en ${place}.`;

  if (!weather.isDaylight) {
    if (weather.sky === 'lluvia') {
      return {
        headline: 'Noche de lluvia',
        sentence: `Chubascos y ${wind.phrase} en ${place}.`,
        mood: 'malo',
      };
    }
    if (wind.level >= 3) return { headline: 'Noche de viento', sentence: plain, mood: 'regular' };
    return {
      headline: weather.temperatureC >= 18 ? 'Noche templada' : 'Noche fresca',
      sentence: plain,
      mood: 'bueno',
    };
  }

  if (weather.sky === 'lluvia') {
    return {
      headline: 'Llueve, cosa rara',
      sentence: `Chubascos en ${place}. Mejor un plan a cubierto.`,
      mood: 'malo',
    };
  }

  if (weather.sky === 'calima') {
    return {
      headline: 'Día de calima',
      sentence: `Cielo turbio y aire seco en ${place}. Agua y sombra.`,
      mood: 'regular',
    };
  }

  if (wind.level >= 3) {
    return {
      headline: 'Sopla con ganas',
      sentence: `${wind.label} ${wind.from}. Mejor buscar una playa resguardada.`,
      mood: 'regular',
    };
  }

  if (windTrend(weather, upcoming) === 'sube') {
    return {
      headline: 'El viento se está levantando',
      sentence: 'Mejor buscar una playa resguardada.',
      mood: 'regular',
    };
  }

  if (seaReading && seaReading.level >= 3 && SURF_COASTS.has(location.facing)) {
    return {
      headline: 'Hay olas',
      sentence: `${seaReading.label} en ${place}: día de surf, no de baño.`,
      mood: 'regular',
    };
  }

  const score = beachScore(weather, sea);
  const bathingSpot = location.kind !== 'costa' && location.shore !== 'roca';

  if (wind.level === 2 && (weather.sky === 'despejado' || weather.sky === 'poco-nuboso')) {
    return {
      headline: 'Sol, pero con viento',
      sentence: `${wind.label} ${wind.from} en ${place}. Para la toalla, mejor una playa resguardada.`,
      mood: 'bueno',
    };
  }

  // Never invite to the beach without knowing what the sea is doing.
  if (score >= 0.8 && bathingSpot && sea) {
    return { headline: `${dayWord} apetece playa`, sentence: plain, mood: 'radiante' };
  }
  if (score >= 0.8 && bathingSpot) {
    return { headline: 'Buen día para salir', sentence: plain, mood: 'bueno' };
  }
  if (score >= 0.8) {
    return {
      headline: 'Día perfecto para asomarse',
      sentence: `${plain} Costa para mirar, no para bañarse.`,
      mood: 'radiante',
    };
  }

  if (weather.sky === 'cubierto' || weather.sky === 'nuboso') {
    return {
      headline: 'Día gris y templado',
      sentence: `${sky} en ${place}. Buen momento para pasear.`,
      mood: 'regular',
    };
  }

  if (score >= 0.62) return { headline: 'Buen día para salir', sentence: plain, mood: 'bueno' };
  return { headline: 'Día tranquilo', sentence: plain, mood: 'regular' };
}
