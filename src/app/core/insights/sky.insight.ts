import { SkyCondition } from '../models';

const DAY_PHRASE: Readonly<Record<SkyCondition, string>> = {
  despejado: 'Sol',
  'poco-nuboso': 'Sol entre nubes',
  nuboso: 'Nubes y claros',
  cubierto: 'Cielo cubierto',
  calima: 'Calima',
  lluvia: 'Chubascos',
};

const NIGHT_PHRASE: Readonly<Record<SkyCondition, string>> = {
  despejado: 'Cielo despejado',
  'poco-nuboso': 'Algunas nubes',
  nuboso: 'Nubes y claros',
  cubierto: 'Cielo cubierto',
  calima: 'Calima',
  lluvia: 'Chubascos',
};

/** How the sky reads right now: "Sol entre nubes". */
export function skyPhrase(sky: SkyCondition, isDaylight: boolean): string {
  return (isDaylight ? DAY_PHRASE : NIGHT_PHRASE)[sky];
}

/** Accessible name for a weather glyph. */
export function skyLabel(sky: SkyCondition, isDaylight: boolean): string {
  return skyPhrase(sky, isDaylight);
}

export type UvBand = 'bajo' | 'moderado' | 'alto' | 'muy alto' | 'extremo';

export interface UvReading {
  readonly band: UvBand;
  /** "Sol muy intenso" */
  readonly label: string;
  readonly needsProtection: boolean;
}

export function readUv(uvIndex: number): UvReading {
  if (uvIndex <= 2) return { band: 'bajo', label: 'Sol suave', needsProtection: false };
  if (uvIndex <= 5) return { band: 'moderado', label: 'Sol moderado', needsProtection: true };
  if (uvIndex <= 7) return { band: 'alto', label: 'Sol intenso', needsProtection: true };
  if (uvIndex <= 10) return { band: 'muy alto', label: 'Sol muy intenso', needsProtection: true };
  return { band: 'extremo', label: 'Sol extremo', needsProtection: true };
}
