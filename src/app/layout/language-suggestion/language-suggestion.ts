import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Lang, MessageKey } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { translate } from '../../core/i18n/translate';
import { Icon } from '../../shared/ui/icon/icon';
import { Tooltip } from '../../shared/ui/tooltip/tooltip';

/** A moment to see the page first. */
const QUIET_MS = 1500;

/**
 * Every page opens in Spanish. When the browser prefers the other language,
 * this small card offers it, written in that language, so whoever needs it
 * can read it. It never takes the focus; choosing or closing it is remembered.
 * It looks like the install invite and sits where it does (the invite waits
 * while this is open).
 */
@Component({
  selector: 'lm-language-suggestion',
  imports: [Icon, Tooltip],
  template: `
    @if (shown(); as lang) {
      <aside
        id="language-suggestion"
        class="invite"
        [attr.lang]="lang"
        [attr.aria-label]="text(lang, 'langSuggest.label')"
        animate.leave="is-leaving"
      >
        <span class="badge" aria-hidden="true"><lm-icon name="languages" /></span>
        <div class="text">
          <p class="title">{{ text(lang, 'langSuggest.title') }}</p>
          <button
            id="language-suggestion-button"
            type="button"
            class="btn btn--primary action"
            (click)="accept(lang)"
            (keydown.escape)="dismiss()"
          >
            {{ text(lang, 'langSuggest.action') }}
          </button>
        </div>
        <button
          type="button"
          class="icon-btn close"
          [attr.aria-label]="text(lang, 'langSuggest.dismiss')"
          [lmTooltip]="text(lang, 'langSuggest.dismiss')"
          (click)="dismiss()"
          (keydown.escape)="dismiss()"
        >
          <lm-icon name="close" />
        </button>
      </aside>
    }
  `,
  styleUrl: '../install/install-invite.scss',
  styles: `
    .badge {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--r-md);
      background-color: var(--c-surface-sunken);
      color: var(--c-ink-2);

      lm-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
      }
    }
  `,
})
export class LanguageSuggestion {
  private readonly i18n = inject(I18n);
  private readonly document = inject(DOCUMENT);

  private readonly ready = signal(false);
  protected readonly shown = computed(() => (this.ready() ? this.i18n.suggestion() : null));

  constructor() {
    effect((onCleanup) => {
      if (!this.i18n.suggestion()) return;
      const timer = setTimeout(() => this.ready.set(true), QUIET_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  /** The card speaks the language it offers, whatever the page speaks. */
  protected text(lang: Lang, key: MessageKey): string {
    return translate(key, lang);
  }

  protected accept(lang: Lang): void {
    this.returnFocus();
    this.i18n.use(lang);
  }

  protected dismiss(): void {
    this.returnFocus();
    this.i18n.dismissSuggestion();
  }

  /** Closed from the keyboard: the focus goes back to the page, not to nowhere. */
  private returnFocus(): void {
    if (this.document.activeElement?.closest('#language-suggestion')) {
      this.document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }
}
