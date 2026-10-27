import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';

interface Method {
  readonly id: string;
  readonly label: MessageKey;
  readonly text: MessageKey;
}

/** How each figure on screen is worked out, in the order the screens show them. */
const METHODS: readonly Method[] = [
  { id: 'forecast', label: 'about.method.forecast.label', text: 'about.method.forecast' },
  { id: 'sea', label: 'about.method.sea.label', text: 'about.method.sea' },
  { id: 'tide', label: 'about.method.tide.label', text: 'about.method.tide' },
  { id: 'dust', label: 'about.method.dust.label', text: 'about.method.dust' },
  { id: 'official', label: 'about.method.official.label', text: 'about.method.official' },
];

/**
 * Who makes LanzaMet, why, and how each figure is worked out: the method
 * that otherwise lives only in the README, said plainly. It closes with the
 * studio's mark, quiet, as a footer credit.
 */
@Component({
  selector: 'lm-about-page',
  host: { id: 'about-page', class: 'page about-page' },
  imports: [RouterLink, NgOptimizedImage, Icon, TranslatePipe],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage {
  protected readonly methods = METHODS;
}
