import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DomSanitizer } from '@angular/platform-browser';
import { LOCATIONS } from '../../core/data/locations';
import { Lang, MessageKey, msg } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { zonePath } from '../../core/i18n/localized-paths';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { translate } from '../../core/i18n/translate';
import { LocationId } from '../../core/models';
import { SITE_ORIGIN } from '../../core/seo/seo-tags';
import { SHARE_CONFIG } from '../../core/share/share-config';
import { LocationsStore } from '../../core/state/locations.store';
import { Icon } from '../../shared/ui/icon/icon';
import { WIDGET_THEMES, WidgetTheme } from '../../widget/widget-card';

/** The card's size in the code it gives (the card fits 280–480 px wide). */
const WIDTH = 320;
const HEIGHT = 210;

const THEME_LABEL: Readonly<Record<WidgetTheme, MessageKey>> = {
  auto: 'widget.page.theme.auto',
  light: 'widget.page.theme.light',
  dark: 'widget.page.theme.dark',
};

/** Each language names itself, as in Settings. */
const LANG_OPTIONS: readonly { readonly lang: Lang; readonly name: string }[] = [
  { lang: 'es', name: 'Español' },
  { lang: 'en', name: 'English' },
];

interface WidgetChoice {
  zone: LocationId;
  lang: Lang;
  theme: WidgetTheme;
}

type Copied = 'code' | 'link' | 'failed';

/**
 * Where a website owner chooses the card for their place (/widget/{zona},
 * served by the Worker), sees it, and copies the code: an iframe and, below
 * it, one visible line that names LanzaMet with a plain link. For those
 * without a website, the place's own link does the same in a guide or a
 * message.
 */
@Component({
  selector: 'lm-widget-page',
  host: { id: 'widget-page', class: 'page widget-page' },
  imports: [FormField, Icon, TranslatePipe],
  templateUrl: './widget.page.html',
  styleUrl: './widget.page.scss',
})
export class WidgetPage {
  private readonly i18n = inject(I18n);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly origin = inject(SHARE_CONFIG).publicUrl ?? SITE_ORIGIN;

  protected readonly zones = LOCATIONS;
  protected readonly langs = LANG_OPTIONS;
  protected readonly themes = WIDGET_THEMES.map((theme) => ({ theme, label: THEME_LABEL[theme] }));
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;

  private readonly model = signal<WidgetChoice>({
    zone: inject(LocationsStore).selected()?.id ?? LOCATIONS[0].id,
    lang: this.i18n.lang(),
    theme: 'auto',
  });
  protected readonly f = form(this.model);

  private readonly zone = computed(
    () => LOCATIONS.find((l) => l.id === this.model().zone) ?? LOCATIONS[0],
  );
  /** The card's address, without the origin. */
  private readonly cardPath = computed(() => {
    const { lang, theme } = this.model();
    return `/widget/${this.zone().id}?lang=${lang}&theme=${theme}`;
  });
  /**
   * The preview, from this same site. Safe to trust: the address is built
   * here from the catalogue's place ids and two fixed lists, never from input text.
   */
  protected readonly preview = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.cardPath()),
  );
  protected readonly cardTitle = computed(
    () =>
      `${translate(msg('widget.title', { place: this.zone().name }), this.model().lang)} · LanzaMet`,
  );

  /** The place's forecast in the card's language: the link under the card and the one to share. */
  protected readonly link = computed(
    () => this.origin + zonePath('weather', this.zone().id, this.model().lang),
  );

  protected readonly code = computed(() => {
    const { lang } = this.model();
    const src = (this.origin + this.cardPath()).replace(/&/g, '&amp;');
    const credit = translate(msg('widget.embed.credit', { place: this.zone().name }), lang);
    return [
      `<iframe src="${src}" width="${WIDTH}" height="${HEIGHT}" style="border:0;max-width:100%" title="${this.cardTitle()}" loading="lazy"></iframe>`,
      `<p style="margin:4px 0 0;font:13px/1.4 system-ui,sans-serif">${credit} <a href="${this.link()}">LanzaMet</a></p>`,
    ].join('\n');
  });

  protected readonly copied = signal<Copied | null>(null);

  protected copy(what: 'code' | 'link'): void {
    const text = what === 'code' ? this.code() : this.link();
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard) {
      this.copied.set('failed');
      return;
    }
    clipboard.writeText(text).then(
      () => this.copied.set(what),
      () => this.copied.set('failed'),
    );
  }
}
