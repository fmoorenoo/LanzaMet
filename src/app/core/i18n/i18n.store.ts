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

const isTrue = (value: unknown): value is true => value === true;

/**
 * The interface language. Every address opens in Spanish, so a page reads the
 * same for every visitor and for search engines (which send no language
 * preference). A choice made in Settings, or from the suggestion, is
 * remembered and always wins. The browser's preferences only decide whether
 * to suggest the other language. Changing it re-renders every text at once,
 * without reloading: templates and computed values read `lang` through `t()`.
 */
@Service()
export class I18n {
  private readonly document = inject(DOCUMENT);
  private readonly browserLang = detectLang(globalThis.navigator?.languages ?? []);

  /** The visitor's own choice; null until they make one. */
  private readonly chosen = signal<Lang | null>(readStored('lang', isLang));
  private readonly suggestionDismissed = signal(readStored('langSuggestion', isTrue) ?? false);

  readonly langs = LANGS;
  readonly lang = computed<Lang>(() => this.chosen() ?? DEFAULT_LANG);
  /** BCP 47 locale for numbers and dates ("es-ES", "en-GB"). */
  readonly locale = computed(() => LOCALES[this.lang()]);

  /**
   * The browser's language when the page speaks another one and the visitor
   * hasn't chosen yet, nor said no to the suggestion.
   */
  readonly suggestion = computed<Lang | null>(() =>
    this.chosen() === null && !this.suggestionDismissed() && this.browserLang !== this.lang()
      ? this.browserLang
      : null,
  );

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
    this.chosen.set(lang);
    writeStored('lang', lang);
  }

  /** The visitor said no to the suggestion: it doesn't come back on this device. */
  dismissSuggestion(): void {
    this.suggestionDismissed.set(true);
    writeStored('langSuggestion', true);
  }
}
