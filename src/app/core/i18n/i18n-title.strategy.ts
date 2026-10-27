import { effect, inject, Service, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { zoneArea, zoneOfState } from '../state/zone-navigation';
import { MessageKey, Msg, msg } from './i18n.model';
import { I18n } from './i18n.store';

/**
 * The words a place's page puts in its title and description: its name and
 * where it is ("Previsión para Famara (Teguise, Lanzarote)…"). Empty elsewhere.
 */
export function zoneParams(state: RouterStateSnapshot): Msg['params'] {
  const zone = zoneOfState(state);
  return zone ? { place: zone.name, area: zoneArea(zone) } : undefined;
}

/**
 * Routes name their title with a message key; the document title follows the
 * route, the place it shows and the language ("Hoy en Lanzarote · LanzaMet").
 */
@Service({ autoProvided: false })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private readonly page = signal<Msg | null>(null);

  constructor() {
    super();
    effect(() => {
      const page = this.page();
      const brand = msg('app.brand');
      this.title.setTitle(this.i18n.t(page ? msg('route.title', { page, brand }) : brand));
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot) as MessageKey | undefined;
    this.page.set(key ? msg(key, zoneParams(snapshot)) : null);
  }
}
