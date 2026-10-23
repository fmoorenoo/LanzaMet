import { MessageKey, msg, Msg } from '../i18n/i18n.model';
import { Location, SeaSnapshot, SkyCondition, WeatherSnapshot } from '../models';
import { clamp } from '../utils/math';
import { DayPeriod, dayPeriod, isSunUp } from './day-period';
import { readSea } from './sea.insight';
import { skyPhrase } from './sky.insight';
import { SunTimes } from './sun.insight';
import { readWind, windTrend } from './wind.insight';

export type Mood = 'radiante' | 'bueno' | 'regular' | 'malo';

export interface Verdict {
  /** The answer, in a few words: "Hoy apetece playa". */
  readonly headline: Msg;
  /** One supporting sentence: "Sol y brisa suave en Puerto del Carmen." */
  readonly sentence: Msg;
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

/** How much light the words can assume. */
type Light = 'night' | 'dawn' | 'day';

const LIGHT: Readonly<Record<DayPeriod, Light>> = {
  madrugada: 'night',
  'primera-hora': 'dawn',
  manana: 'day',
  mediodia: 'day',
  tarde: 'day',
  atardecer: 'day',
  noche: 'night',
};

/** Moments in which a beach, a sheltered cove or the waves are still worth planning. */
const PLANNING: ReadonlySet<DayPeriod> = new Set(['primera-hora', 'manana', 'mediodia', 'tarde']);

/*
 * Temperatures, °C, as they feel in Lanzarote: nights rarely drop below 14
 * and days rarely pass 30 outside a calima.
 */
const COOL_NIGHT_C = 17;
const WARM_NIGHT_C = 23;
const COOL_DAY_C = 19;
const WARM_DAY_C = 26;
const HOT_DAY_C = 31;
/** UV index from which the midday sun deserves its own warning. */
const FIERCE_UV = 9;

const isClear = (sky: SkyCondition) => sky === 'despejado' || sky === 'poco-nuboso';

export interface VerdictInput {
  readonly location: Location;
  readonly weather: WeatherSnapshot;
  /** Hourly steps from the moment being described onwards. */
  readonly upcoming: readonly WeatherSnapshot[];
  readonly sea: SeaSnapshot | null;
  /** The day being described. */
  readonly day: 'today' | 'tomorrow';
  /** The moment being described: now, or the hour chosen in the forecast. */
  readonly at: Date;
  /** Sunrise and sunset of that moment's day, at that place. */
  readonly sun: SunTimes;
}

/**
 * The moment in a few words. Hazards come first (rain, strong wind, calima,
 * waves), each said in words that fit the time of day; then what the moment
 * is good for. The sentence never contradicts the headline: both read the
 * same sky, wind and light.
 */
export function dayVerdict(input: VerdictInput): Verdict {
  const { location, weather, upcoming, sea, day, at, sun } = input;
  const period = dayPeriod(at, sun);
  const light = LIGHT[period];
  const sunUp = isSunUp(at, sun);
  const planning = PLANNING.has(period);
  const place = location.name;
  const t = weather.temperatureC;
  const wind = readWind(weather.wind);
  const sky = skyPhrase(weather.sky, sunUp);
  const plain = msg('verdict.plain', { sky, wind: wind.phrase, place });
  const verdict = (headline: MessageKey, sentence: Msg, mood: Mood): Verdict => ({
    headline: msg(headline),
    sentence,
    mood,
  });

  // ── Hazards ──────────────────────────────────────────────────
  if (weather.sky === 'lluvia') {
    if (light === 'night') {
      return verdict(
        'verdict.rain.night',
        msg('verdict.rain.night.sentence', { wind: wind.phrase, place }),
        'malo',
      );
    }
    const sentence = msg('verdict.rain.sentence', { place });
    return verdict(light === 'dawn' ? 'verdict.rain.dawn' : 'verdict.rain', sentence, 'malo');
  }

  if (wind.level >= 3) {
    const headline =
      light === 'night'
        ? 'verdict.wind.night'
        : light === 'dawn'
          ? 'verdict.wind.dawn'
          : 'verdict.wind';
    const sentence = planning ? msg('verdict.wind.sentence', { wind: wind.labelFrom }) : plain;
    return verdict(headline, sentence, 'regular');
  }

  if (weather.sky === 'calima') {
    const headline =
      light === 'night'
        ? 'verdict.calima.night'
        : light === 'dawn'
          ? 'verdict.calima.dawn'
          : 'verdict.calima';
    const sentence =
      planning && sunUp
        ? msg('verdict.calima.sentence', { place })
        : msg('verdict.calima.night.sentence', { place });
    return verdict(headline, sentence, 'regular');
  }

  if (planning && windTrend(weather, upcoming) === 'sube') {
    return verdict('verdict.windRising', msg('verdict.windRising.sentence'), 'regular');
  }

  const seaReading = sea ? readSea(sea) : null;
  if (
    planning &&
    sunUp &&
    seaReading &&
    seaReading.level >= 3 &&
    SURF_COASTS.has(location.facing)
  ) {
    return verdict(
      'verdict.waves',
      msg('verdict.waves.sentence', { sea: seaReading.label, place }),
      'regular',
    );
  }

  // ── The moment, by the light ─────────────────────────────────
  if (period === 'madrugada') {
    const headline =
      t < COOL_NIGHT_C
        ? 'verdict.smallHours.cool'
        : t >= WARM_NIGHT_C
          ? 'verdict.smallHours.warm'
          : 'verdict.smallHours.mild';
    return verdict(headline, plain, 'bueno');
  }

  if (period === 'noche') {
    if (t < COOL_NIGHT_C) return verdict('verdict.night.cool', plain, 'bueno');
    if (t >= WARM_NIGHT_C) return verdict('verdict.night.warm', plain, 'bueno');
    if (weather.sky === 'cubierto') return verdict('verdict.night.cloudy', plain, 'bueno');
    if (weather.sky === 'despejado' && wind.level <= 1) {
      return verdict('verdict.night.starry', plain, 'bueno');
    }
    return verdict('verdict.night.mild', plain, 'bueno');
  }

  if (period === 'primera-hora') {
    // Before sunrise, the useful fact is when it comes up.
    const sentence = sunUp
      ? plain
      : msg('verdict.sunrise.sentence', { sky, wind: wind.phrase, time: { time: sun.sunrise } });
    if (weather.sky === 'nuboso' || weather.sky === 'cubierto') {
      return verdict('verdict.dawn.cloudy', sentence, 'regular');
    }
    if (t < COOL_NIGHT_C) return verdict('verdict.dawn.cool', sentence, 'bueno');
    if (t >= WARM_NIGHT_C) return verdict('verdict.dawn.warm', sentence, 'bueno');
    if (weather.sky === 'despejado') return verdict('verdict.dawn.clear', sentence, 'bueno');
    return verdict('verdict.dawn.mild', sentence, 'bueno');
  }

  if (period === 'atardecer') {
    const sentence = sunUp
      ? msg('verdict.sunset.sentence', { sky, wind: wind.phrase, time: { time: sun.sunset } })
      : plain;
    if (weather.sky === 'despejado') return verdict('verdict.sunset.clear', sentence, 'bueno');
    if (weather.sky === 'cubierto') return verdict('verdict.sunset.grey', sentence, 'regular');
    return verdict('verdict.sunset.clouds', sentence, 'bueno');
  }

  // Morning, midday and afternoon.
  const afternoon = period === 'tarde';
  const shade = msg('verdict.shade.sentence', { sky, wind: wind.phrase, place });

  if (t >= HOT_DAY_C) return verdict('verdict.hot', shade, 'bueno');
  if (
    period === 'mediodia' &&
    weather.uvIndex >= FIERCE_UV &&
    t >= WARM_DAY_C &&
    isClear(weather.sky)
  ) {
    return verdict('verdict.strongSun', shade, 'bueno');
  }

  if (wind.level === 2 && isClear(weather.sky)) {
    return verdict(
      'verdict.sunnyWindy',
      msg('verdict.sunnyWindy.sentence', { wind: wind.labelFrom, place }),
      'bueno',
    );
  }

  const score = beachScore({ ...weather, isDaylight: sunUp }, sea);
  const bathingSpot = location.kind !== 'costa' && location.shore !== 'roca';
  const goodToGo = afternoon ? 'verdict.goodAfternoon' : 'verdict.goodDay';

  // Never invite to the beach without knowing what the sea is doing.
  if (score >= 0.8 && bathingSpot && sea) {
    return verdict(
      afternoon ? 'verdict.beach.afternoon' : `verdict.beach.${day}`,
      plain,
      'radiante',
    );
  }
  if (score >= 0.8 && bathingSpot) return verdict(goodToGo, plain, 'bueno');
  if (score >= 0.8) {
    return verdict('verdict.lookout', msg('verdict.lookout.sentence', { plain }), 'radiante');
  }

  if (weather.sky === 'cubierto') {
    const headline =
      t < COOL_DAY_C ? 'verdict.grey.cool' : t >= WARM_DAY_C ? 'verdict.grey.warm' : 'verdict.grey';
    return verdict(headline, msg('verdict.grey.sentence', { sky, place }), 'regular');
  }
  if (t < COOL_DAY_C) return verdict('verdict.cool', plain, 'regular');
  if (weather.sky === 'nuboso') {
    return verdict('verdict.sunnySpells', plain, score >= 0.62 ? 'bueno' : 'regular');
  }

  if (score >= 0.62) return verdict(goodToGo, plain, 'bueno');
  return verdict('verdict.calm', plain, 'regular');
}
