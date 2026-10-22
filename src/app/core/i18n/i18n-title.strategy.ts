import { effect, inject, Service, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { MessageKey, msg } from './i18n.model';
import { I18n } from './i18n.store';

/**
 * Routes name their title with a message key; the document title follows the
 * route and the language ("Hoy en Lanzarote · ¿Qué tal hoy?").
 */
@Service({ autoProvided: false })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private readonly page = signal<MessageKey | null>(null);

  constructor() {
    super();
    effect(() => {
      const page = this.page();
      const brand = msg('app.brand');
      this.title.setTitle(
        this.i18n.t(page ? msg('route.title', { page: msg(page), brand }) : brand),
      );
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.page.set((this.buildTitle(snapshot) as MessageKey | undefined) ?? null);
  }
}
