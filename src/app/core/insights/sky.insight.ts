import { msg, Msg } from '../i18n/i18n.model';
import { SkyCondition } from '../models';

/** How the sky reads right now: "Sol entre nubes". */
export function skyPhrase(sky: SkyCondition, isDaylight: boolean): Msg {
  return msg(isDaylight ? `sky.day.${sky}` : `sky.night.${sky}`);
}

/** Accessible name for a weather glyph. */
export function skyLabel(sky: SkyCondition, isDaylight: boolean): Msg {
  return skyPhrase(sky, isDaylight);
}

export type UvBand = 'bajo' | 'moderado' | 'alto' | 'muy-alto' | 'extremo';

export interface UvReading {
  readonly band: UvBand;
  /** "Sol muy intenso" */
  readonly label: Msg;
  readonly needsProtection: boolean;
}

function uv(band: UvBand, needsProtection: boolean): UvReading {
  return { band, label: msg(`uv.${band}`), needsProtection };
}

export function readUv(uvIndex: number): UvReading {
  if (uvIndex <= 2) return uv('bajo', false);
  if (uvIndex <= 5) return uv('moderado', true);
  if (uvIndex <= 7) return uv('alto', true);
  if (uvIndex <= 10) return uv('muy-alto', true);
  return uv('extremo', true);
}
