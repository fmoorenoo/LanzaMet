import { IsoDate, IsoInstant } from '../models/weather.model';
import type { MessageKey } from './messages/es';

export type { MessageKey } from './messages/es';

/** Languages the interface speaks. Spanish is the default and the source of every text. */
export type Lang = 'es' | 'en';

export const LANGS: readonly Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';

export const isLang = (value: unknown): value is Lang => value === 'es' || value === 'en';

/**
 * A piece of text described as data: which message, with which values. The
 * rules that read the weather return these, never sentences, so the same
 * rule speaks every language; the i18n layer turns them into text.
 */
export interface Msg {
  readonly key: MessageKey;
  readonly params?: Readonly<Record<string, Param>>;
}

/** A value formatted by the language at render time. */
export type Formatted =
  /** "16:40", always in island time. */
  | { readonly time: IsoInstant | Date }
  /** "2 h 10 min", "45 min", "un momento". */
  | { readonly duration: number }
  /** A fixed number of decimals; `sign` adds "+" (always) or keeps only "−". */
  | { readonly decimal: number; readonly digits: number; readonly sign?: 'always' | 'negative' }
  /** "Jue" / "Thu", "Viernes" / "Friday". */
  | { readonly weekday: IsoInstant | Date; readonly style: 'short' | 'long' }
  /** "Hoy", "Mañana" or the weekday, from the island date. */
  | { readonly day: IsoDate; readonly today: IsoDate };

/**
 * What a placeholder can hold: literal text (names of places and stations,
 * text from a provider), a number (localised, up to one decimal), another
 * message, or a value formatted by the language.
 */
export type Param = string | number | Msg | Formatted;

export function msg(key: MessageKey, params?: Msg['params']): Msg {
  return params ? { key, params } : { key };
}

export const isMsg = (value: unknown): value is Msg =>
  typeof value === 'object' && value !== null && 'key' in value;
