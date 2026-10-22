import { ISLAND_TIME_ZONE, islandDateKey, addHours, formatTime, toDate } from '../utils/time';
import { Formatted, isMsg, Lang, MessageKey, Msg, Param } from './i18n.model';
import { en } from './messages/en';
import { es, Messages } from './messages/es';

/*
 * Pure translation: a message plus a language gives a string. Numbers, times,
 * weekdays and durations are formatted here, by language, so the weather
 * rules only ever hand over raw values.
 */

const DICTIONARIES: Readonly<Record<Lang, Messages>> = { es, en };

/** Locale used for numbers and dates. British English keeps the 24-hour clock. */
export const LOCALES: Readonly<Record<Lang, string>> = { es: 'es-ES', en: 'en-GB' };

const numberFormats = new Map<string, Intl.NumberFormat>();
const weekdayFormats = new Map<string, Intl.DateTimeFormat>();

function numberFormat(lang: Lang, min: number, max: number): Intl.NumberFormat {
  const id = `${lang}|${min}|${max}`;
  let format = numberFormats.get(id);
  if (!format) {
    format = new Intl.NumberFormat(LOCALES[lang], {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    });
    numberFormats.set(id, format);
  }
  return format;
}

function weekdayFormat(lang: Lang, style: 'short' | 'long'): Intl.DateTimeFormat {
  const id = `${lang}|${style}`;
  let format = weekdayFormats.get(id);
  if (!format) {
    format = new Intl.DateTimeFormat(LOCALES[lang], {
      timeZone: ISLAND_TIME_ZONE,
      weekday: style,
    });
    weekdayFormats.set(id, format);
  }
  return format;
}

export function capitalise(text: string, lang: Lang): string {
  return text.charAt(0).toLocaleUpperCase(LOCALES[lang]) + text.slice(1);
}

/**
 * "jue" / "Thu" · "viernes" / "Friday", in island time, with each language's
 * own casing; a message that starts with it asks for a capital with `{^…}`.
 */
export function formatWeekday(value: string | Date, style: 'short' | 'long', lang: Lang): string {
  return weekdayFormat(lang, style).format(toDate(value)).replace('.', '');
}

/** "2 h 10 min", "45 min", "un momento". */
export function formatDuration(ms: number, lang: Lang): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 2) return translate({ key: 'duration.moment' }, lang);
  if (minutes < 60) return translate({ key: 'duration.minutes', params: { m: minutes } }, lang);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0
    ? translate({ key: 'duration.hours', params: { h } }, lang)
    : translate({ key: 'duration.hoursMinutes', params: { h, m } }, lang);
}

function formatValue(value: Formatted, lang: Lang): string {
  if ('time' in value) return formatTime(value.time);
  if ('duration' in value) return formatDuration(value.duration, lang);
  if ('weekday' in value) return formatWeekday(value.weekday, value.style, lang);
  if ('day' in value) {
    if (value.day === value.today) return translate({ key: 'day.today' }, lang);
    const tomorrow = islandDateKey(addHours(new Date(`${value.today}T12:00:00Z`), 24));
    if (value.day === tomorrow) return translate({ key: 'day.tomorrow' }, lang);
    return formatWeekday(new Date(`${value.day}T12:00:00Z`), 'long', lang);
  }
  const text = numberFormat(lang, value.digits, value.digits).format(Math.abs(value.decimal));
  if (value.decimal < 0 && text !== numberFormat(lang, value.digits, value.digits).format(0)) {
    return `−${text}`;
  }
  return value.sign === 'always' ? `+${text}` : text;
}

function formatParam(param: Param, lang: Lang): string {
  if (typeof param === 'string') return param;
  if (typeof param === 'number') return numberFormat(lang, 0, 1).format(param);
  if (isMsg(param)) return translate(param, lang);
  return formatValue(param, lang);
}

/** `{name}` inserts a value; `{^name}` inserts it with a capital first letter. */
const PLACEHOLDER = /\{(\^?)(\w+)\}/g;

export function translate(text: Msg | MessageKey, lang: Lang): string {
  const message = typeof text === 'string' ? { key: text } : text;
  const template = DICTIONARIES[lang][message.key] ?? DICTIONARIES.es[message.key];
  const params = message.params;
  if (!params) return template;
  return template.replace(PLACEHOLDER, (whole, cap: string, name: string) => {
    const value = params[name];
    if (value === undefined) return whole;
    const formatted = formatParam(value, lang);
    return cap ? capitalise(formatted, lang) : formatted;
  });
}
