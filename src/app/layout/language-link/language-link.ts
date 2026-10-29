import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Lang } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { LanguageLinks } from '../../core/i18n/language-links';
import { Icon } from '../../shared/ui/icon/icon';

/** Each language names itself, so anyone can find their own (as in Settings). */
const NAMES: Readonly<Record<Lang, string>> = { es: 'Español', en: 'English' };

/**
 * The same page in the other language, at the end of every page: a real
 * link, so a visitor finds it without opening Settings, and so can any
 * crawler that doesn't read `hreflang`. Following it is a choice, and is
 * remembered like one.
 */
@Component({
  selector: 'lm-language-link',
  imports: [RouterLink, Icon],
  template: `
    <a
      id="language-link"
      class="btn btn--quiet language-link"
      [routerLink]="target()"
      [attr.hreflang]="other()"
      [attr.lang]="other()"
      (click)="i18n.remember(other())"
    >
      <lm-icon name="languages" />
      {{ name() }}
    </a>
  `,
  host: { class: 'language-link-row' },
  styles: `
    :host {
      display: flex;
      justify-content: center;
      padding: var(--s-4) var(--gutter) var(--s-8);
    }
  `,
})
export class LanguageLink {
  protected readonly i18n = inject(I18n);
  private readonly links = inject(LanguageLinks);
  private readonly router = inject(Router);

  protected readonly other = computed<Lang>(() => (this.i18n.lang() === 'es' ? 'en' : 'es'));
  protected readonly name = computed(() => NAMES[this.other()]);
  /** A tree, not a string: the address may carry the day (?dia=) and an anchor. */
  protected readonly target = computed(() => this.router.parseUrl(this.links.linkTo(this.other())));
}
