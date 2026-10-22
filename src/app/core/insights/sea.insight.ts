import { SeaSnapshot } from '../models';

export type SeaLevel = 0 | 1 | 2 | 3 | 4;

export interface SeaReading {
  readonly level: SeaLevel;
  /** "Mar en calma" */
  readonly label: string;
  /** Lower-case for sentences: "mar en calma" */
  readonly phrase: string;
  /** "Olas de unos 40 cm" */
  readonly waves: string;
  /** "Agua a 22 °C" */
  readonly water: string;
}

const LEVELS: readonly { max: number; label: string }[] = [
  { max: 0.3, label: 'Mar como un plato' },
  { max: 0.8, label: 'Mar en calma' },
  { max: 1.5, label: 'Algo de mar' },
  { max: 2.5, label: 'Mar movido' },
  { max: Infinity, label: 'Mar bravo' },
];

export function seaLevelFor(waveHeightM: number): SeaLevel {
  const index = LEVELS.findIndex((l) => waveHeightM < l.max);
  return (index === -1 ? 4 : index) as SeaLevel;
}

/** Heights in words people use on the beach. */
export function describeWaves(waveHeightM: number): string {
  if (waveHeightM < 0.15) return 'Sin apenas olas';
  if (waveHeightM < 1) return `Olas de unos ${Math.max(10, Math.round(waveHeightM * 10) * 10)} cm`;
  const metres = (Math.round(waveHeightM * 2) / 2).toLocaleString('es-ES');
  return `Olas de ${metres} m`;
}

export function readSea(sea: SeaSnapshot): SeaReading {
  const level = seaLevelFor(sea.waveHeightM);
  const label = LEVELS[level].label;
  return {
    level,
    label,
    phrase: label.charAt(0).toLocaleLowerCase('es-ES') + label.slice(1),
    waves: describeWaves(sea.waveHeightM),
    water: `Agua a ${Math.round(sea.waterTemperatureC)} °C`,
  };
}
