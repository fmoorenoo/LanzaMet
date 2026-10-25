import { msg, Msg } from '../i18n/i18n.model';
import { SeaSnapshot, WaveComponent } from '../models';
import { fromDirection } from './wind.insight';

export type SeaLevel = 0 | 1 | 2 | 3 | 4;

export interface SeaReading {
  readonly level: SeaLevel;
  /** "Mar en calma" */
  readonly label: Msg;
  /** For sentences: "mar en calma" */
  readonly phrase: Msg;
  /** "Olas de unos 40 cm" */
  readonly waves: Msg;
  /** "Agua a 22 °C", or null when the provider has no value. */
  readonly water: Msg | null;
  /** "Mar de fondo del noroeste, 1,1 m cada 11 s", or null when there is none to speak of. */
  readonly swell: Msg | null;
}

/** Upper wave height (m, exclusive) of each level, from flat to rough. */
const LEVEL_MAX: readonly number[] = [0.3, 0.8, 1.5, 2.5, Infinity];

export function seaLevelFor(waveHeightM: number): SeaLevel {
  const index = LEVEL_MAX.findIndex((max) => waveHeightM < max);
  return (index === -1 ? 4 : index) as SeaLevel;
}

/** Heights in words people use on the beach. */
export function describeWaves(waveHeightM: number): Msg {
  if (waveHeightM < 0.15) return msg('sea.waves.none');
  if (waveHeightM < 1) {
    return msg('sea.waves.cm', { cm: Math.max(10, Math.round(waveHeightM * 10) * 10) });
  }
  return msg('sea.waves.m', { m: Math.round(waveHeightM * 2) / 2 });
}

/** Swell lower than this is not worth naming. */
const MIN_SWELL_M = 0.2;

/** "Mar de fondo del noroeste, 1,1 m cada 11 s" */
export function describeSwell(swell: WaveComponent | null): Msg | null {
  if (!swell || swell.heightM < MIN_SWELL_M) return null;
  return msg('sea.swell', {
    from: fromDirection(swell.fromDegrees),
    height: { decimal: swell.heightM, digits: 1 },
    period: Math.round(swell.periodS),
  });
}

/**
 * The sea taken apart for reading at a glance, words first and figures
 * second: the waves, the swell that comes from far away, and the water.
 */
export interface SeaFacets {
  readonly waves: { readonly title: Msg; readonly detail: Msg | null; readonly level: SeaLevel };
  readonly swell: {
    readonly title: Msg;
    readonly detail: Msg;
    /** Where it comes from, for an arrow; null when there is none to speak of. */
    readonly fromDegrees: number | null;
  };
  readonly water: { readonly title: Msg; readonly detail: Msg } | null;
}

/**
 * Swell by its period: short waves were raised by wind nearby, long ones
 * have travelled from storms far away (and carry more energy for their size).
 */
function swellCharacter(periodS: number): Msg {
  if (periodS < 8) return msg('sea.swell.short');
  if (periodS < 11) return msg('sea.swell.mid');
  return msg('sea.swell.long');
}

/** How the water feels to get into: orientative bands for Lanzarote's 18–24 °C. */
export function waterFeel(temperatureC: number): Msg {
  if (temperatureC < 19) return msg('sea.waterFeel.cold');
  if (temperatureC < 21) return msg('sea.waterFeel.cool');
  if (temperatureC < 23) return msg('sea.waterFeel.pleasant');
  return msg('sea.waterFeel.warm');
}

export function seaFacets(sea: SeaSnapshot): SeaFacets {
  const swell = sea.swell && sea.swell.heightM >= MIN_SWELL_M ? sea.swell : null;
  return {
    waves: {
      title: describeWaves(sea.waveHeightM),
      detail:
        sea.waveHeightM >= 0.15 && sea.wavePeriodS > 0
          ? msg('sea.wavesEvery', { period: Math.round(sea.wavePeriodS) })
          : null,
      level: seaLevelFor(sea.waveHeightM),
    },
    swell: swell
      ? {
          title: msg('sea.swell.from', { from: fromDirection(swell.fromDegrees) }),
          detail: msg('sea.swell.detail', {
            character: swellCharacter(swell.periodS),
            numbers: msg('sea.swell.numbers', {
              height: { decimal: swell.heightM, digits: 1 },
              period: Math.round(swell.periodS),
            }),
          }),
          fromDegrees: swell.fromDegrees,
        }
      : { title: msg('sea.swell.none'), detail: msg('sea.swell.none.text'), fromDegrees: null },
    water:
      sea.waterTemperatureC === null
        ? null
        : {
            title: waterFeel(sea.waterTemperatureC),
            detail: msg('common.celsius', { value: Math.round(sea.waterTemperatureC) }),
          },
  };
}

export function readSea(sea: SeaSnapshot): SeaReading {
  const level = seaLevelFor(sea.waveHeightM);
  return {
    level,
    label: msg(`sea.level.${level}.label`),
    phrase: msg(`sea.level.${level}.phrase`),
    waves: describeWaves(sea.waveHeightM),
    water:
      sea.waterTemperatureC === null
        ? null
        : msg('sea.water', { temp: Math.round(sea.waterTemperatureC) }),
    swell: describeSwell(sea.swell),
  };
}
