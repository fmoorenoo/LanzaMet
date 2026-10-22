import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { readStored, writeStored } from '../utils/storage';
import { DEFAULT_LANG, isLang, Lang, LANGS, MessageKey, Msg } from './i18n.model';
import { LOCALES, translate } from './translate';

/**
 * The visitor's first language the interface speaks, from the browser's
 * preferences; Spanish when none matches.
 */
export function detectLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return DEFAULT_LANG;
}

/**
 * The interface language. A choice made in Settings is remembered and always
 * wins; until then the browser's preferences decide, on every visit. Changing
 * it re-renders every text at once, without reloading: templates and computed
 * values read `lang` through `t()`.
 */
@Service()
export class I18n {
  private readonly document = inject(DOCUMENT);

  readonly langs = LANGS;
  readonly lang = signal<Lang>(
    readStored('lang', isLang) ?? detectLang(globalThis.navigator?.languages ?? []),
  );
  /** BCP 47 locale for numbers and dates ("es-ES", "en-GB"). */
  readonly locale = computed(() => LOCALES[this.lang()]);

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.document.documentElement.lang = lang;
      this.document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', translate('app.description', lang));
    });
  }

  /** Text for a message in the current language (reactive inside templates and computed). */
  t(text: Msg | MessageKey, params?: Msg['params']): string {
    const message = typeof text === 'string' ? { key: text, params } : text;
    return translate(message, this.lang());
  }

  /** A choice made by the visitor: applied at once and remembered on this device. */
  use(lang: Lang): void {
    this.lang.set(lang);
    writeStored('lang', lang);
  }
}
