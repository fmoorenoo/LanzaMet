import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from './i18n.store';
import { PageId, pagePath } from './localized-paths';

/**
 * `[routerLink]="'about' | path"`: a page's address in the language on
 * screen (/sobre, /en/about). Impure like `t`, for the same reason: the
 * language is a signal read during rendering.
 */
@Pipe({ name: 'path', pure: false })
export class PathPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(page: PageId): string {
    return pagePath(page, this.i18n.lang());
  }
}
