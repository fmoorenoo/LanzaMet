import { Component, computed, inject } from '@angular/core';
import { Lang } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';

interface LanguageOption {
  readonly lang: Lang;
  /** Each language names itself, so anyone can find their own. */
  readonly name: string;
}

const OPTIONS: readonly LanguageOption[] = [
  { lang: 'es', name: 'Español' },
  { lang: 'en', name: 'English' },
];

/**
 * Spanish or English, switched at once and remembered. Real radio buttons
 * (arrow keys move between them); a thumb glides behind the chosen one. The
 * legend always carries both words, so it reads in either language.
 */
@Component({
  selector: 'lm-language-selector',
  imports: [Icon, TranslatePipe],
  template: `
    <fieldset class="group">
      <legend class="legend lang-legend">
        <lm-icon name="languages" />
        <span
          >{{ 'settings.language' | t }}
          <span class="lang-other" [attr.lang]="otherLang()" aria-hidden="true"
            >· {{ otherWord() }}</span
          ></span
        >
      </legend>
      <div class="lang-switch" [style.--index]="index()">
        <span class="lang-thumb" aria-hidden="true"></span>
        @for (option of options; track option.lang) {
          <label class="lang-option" [attr.lang]="option.lang" [attr.data-lang]="option.lang">
            <input
              type="radio"
              name="language"
              [value]="option.lang"
              [checked]="i18n.lang() === option.lang"
              (change)="i18n.use(option.lang)"
            />
            <span class="lang-name">{{ option.name }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
  host: { class: 'language-selector' },
  styles: `
    :host {
      display: block;
    }

    .lang-legend {
      display: flex;
      align-items: center;
      gap: var(--s-2);

      lm-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
      }
    }

    .lang-other {
      color: var(--c-ink-3);
      font-weight: 500;
    }

    .lang-switch {
      position: relative;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 0.25rem;
      border-radius: var(--r-pill);
      background-color: var(--c-surface-sunken);
    }

    // One step of the thumb is exactly one option wide.
    .lang-thumb {
      position: absolute;
      top: 0.25rem;
      bottom: 0.25rem;
      left: 0.25rem;
      width: calc((100% - 0.5rem) / 2);
      border-radius: var(--r-pill);
      background-color: var(--c-surface-raised);
      box-shadow: var(--shadow-1);
      transform: translate3d(calc(var(--index, 0) * 100%), 0, 0);
      transition: transform var(--d-base) var(--ease-in-out);
    }

    .lang-option {
      position: relative;
      display: grid;
      place-items: center;
      min-height: 2.75rem;
      border-radius: var(--r-pill);
      cursor: pointer;
      transition: transform var(--d-press) var(--ease-out);

      &:active {
        transform: scale(0.97);
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        opacity: 0;
        cursor: pointer;
      }

      &:has(input:focus-visible) {
        outline: 2px solid var(--c-focus);
        outline-offset: 2px;
      }
    }

    .lang-name {
      font-size: var(--fs-small);
      font-weight: 560;
      color: var(--c-ink-2);
      transition: color var(--d-fast) ease;

      input:checked + & {
        color: var(--c-ink);
        font-weight: 680;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      .lang-option:hover .lang-name {
        color: var(--c-ink);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .lang-thumb {
        transition: none;
      }
    }
  `,
})
export class LanguageSelector {
  protected readonly i18n = inject(I18n);
  protected readonly options = OPTIONS;

  protected readonly index = computed(() =>
    this.options.findIndex((o) => o.lang === this.i18n.lang()),
  );

  /** The word "language" in the other language, for whoever can't read this one. */
  protected readonly otherLang = computed<Lang>(() => (this.i18n.lang() === 'es' ? 'en' : 'es'));
  protected readonly otherWord = computed(() =>
    this.otherLang() === 'en' ? 'Language' : 'Idioma',
  );
}
