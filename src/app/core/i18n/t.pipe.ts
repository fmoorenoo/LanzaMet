import { inject, Pipe, PipeTransform } from '@angular/core';
import { MessageKey, Msg } from './i18n.model';
import { I18n } from './i18n.store';

/**
 * `{{ 'today.hours' | t }}` · `{{ verdict.headline | t }}` ·
 * `{{ 'common.favorite' | t: { name } }}`.
 *
 * Impure on purpose: the language is a signal read during rendering, so a
 * change of language re-renders exactly the views that show text. Each call
 * is a dictionary lookup.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(text: Msg | MessageKey | null | undefined, params?: Msg['params']): string {
    return text == null ? '' : this.i18n.t(text, params);
  }
}
