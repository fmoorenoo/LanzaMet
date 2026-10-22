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
