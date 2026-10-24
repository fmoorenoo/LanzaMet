import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { DATA_MODE } from '../../../core/data/http/data-config';
import { Lang } from '../../../core/i18n/i18n.model';
import { I18n } from '../../../core/i18n/i18n.store';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { SHARE_CONFIG, shareLink } from '../../../core/share/share-config';
import { Icon } from '../../../shared/ui/icon/icon';
import { Sheet } from '../../../shared/ui/sheet/sheet';
import { Tooltip } from '../../../shared/ui/tooltip/tooltip';
import { cardAlt, cardFileName, shareMessage, WeatherCard } from './weather-card';
import { renderWeatherCard } from './weather-card.paint';

/** What the sheet offers when the picture cannot travel through the system's share menu. */
interface Fallback {
  /** The picture, or null when it could not be drawn. */
  readonly file: File | null;
  readonly url: string | null;
  readonly alt: string;
  readonly text: string;
  /** True when the system can share the file, only not this time (the tap went stale). */
  readonly canShareFiles: boolean;
}

/** The spinner shows only if drawing takes longer than a blink. */
const SPINNER_DELAY_MS = 120;
const COPIED_MS = 2400;

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

/**
 * Shares the weather of the chosen place and moment: a drawn card, a short
 * sentence and the link. Through the system's share menu when the browser
 * can attach files to it (most phones, Chrome and Edge on Windows, Safari),
 * so WhatsApp receives the picture itself. Otherwise a sheet offers to
 * download or copy the picture and copy or send the text — and says plainly
 * that the picture has to be added by hand.
 *
 * Drawing starts as soon as the pointer or focus reaches the button, so the
 * share menu opens while the tap still counts as one (Safari allows little time).
 */
@Component({
  selector: 'qth-share-weather',
  imports: [Icon, Sheet, Tooltip, TranslatePipe],
  templateUrl: './share-weather.html',
  styleUrl: './share-weather.scss',
  host: { class: 'share-weather' },
})
export class ShareWeather {
  readonly card = input<WeatherCard | null>(null);

  private readonly i18n = inject(I18n);
  private readonly document = inject(DOCUMENT);
  private readonly demo = inject(DATA_MODE) === 'demo';
  private readonly navigator = this.document.defaultView?.navigator;
  private readonly link = shareLink(
    inject(SHARE_CONFIG),
    this.document.defaultView?.location ?? null,
  );

  protected readonly canCopyImage =
    typeof ClipboardItem !== 'undefined' && !!this.navigator?.clipboard?.write;
  protected readonly canShareText = typeof this.navigator?.share === 'function';
  protected readonly hasLink = this.link !== null;

  protected readonly rendering = signal(false);
  protected readonly sheetOpen = signal(false);
  protected readonly fallback = signal<Fallback | null>(null);
  protected readonly copied = signal<'image' | 'text' | 'failed' | null>(null);

  protected readonly label = computed(() => {
    const card = this.card();
    if (!card) return this.i18n.t('share.sheet.title');
    return this.i18n.t(card.isNow ? 'share.button' : 'share.button.later', { name: card.place });
  });

  protected readonly whatsapp = computed(() => {
    const text = this.fallback()?.text ?? '';
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });

  private drawn: { card: WeatherCard; lang: Lang; blob: Promise<Blob | null> } | null = null;
  private sharing = false;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.copiedTimer);
      this.release();
    });
  }

  /** Starts drawing the card for what is on screen now; later calls reuse it. */
  protected warm(): void {
    const card = this.card();
    if (card) void this.draw(card);
  }

  protected async share(): Promise<void> {
    const card = this.card();
    if (!card || this.sharing) return;
    this.sharing = true;
    const text = this.i18n.t(shareMessage(card, this.link));
    const spinner = setTimeout(() => this.rendering.set(true), SPINNER_DELAY_MS);
    let file: File | null = null;
    try {
      const blob = await this.draw(card);
      if (blob) file = new File([blob], cardFileName(card), { type: blob.type });
    } finally {
      clearTimeout(spinner);
      this.rendering.set(false);
    }

    try {
      const canShareFiles = !!file && !!this.navigator?.canShare?.({ files: [file] });
      if (file && canShareFiles && (await this.shareThroughSystem({ files: [file], text }))) return;
      this.openSheet(card, file, text, canShareFiles);
    } finally {
      this.sharing = false;
    }
  }

  protected async shareFile(): Promise<void> {
    const f = this.fallback();
    if (f?.file && (await this.shareThroughSystem({ files: [f.file], text: f.text }))) {
      this.sheetOpen.set(false);
    }
  }

  protected async shareText(): Promise<void> {
    const f = this.fallback();
    if (f && (await this.shareThroughSystem({ text: f.text }))) this.sheetOpen.set(false);
  }

  protected async copyImage(): Promise<void> {
    const file = this.fallback()?.file;
    if (!file) return;
    try {
      await this.navigator?.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      this.flash('image');
    } catch {
      this.flash('failed');
    }
  }

  protected async copyText(): Promise<void> {
    const text = this.fallback()?.text;
    if (!text) return;
    try {
      await this.navigator?.clipboard.writeText(text);
      this.flash('text');
    } catch {
      this.flash('failed');
    }
  }

  private draw(card: WeatherCard): Promise<Blob | null> {
    const lang = this.i18n.lang();
    if (this.drawn?.card === card && this.drawn.lang === lang) return this.drawn.blob;
    const blob = renderWeatherCard(this.document, card, {
      lang,
      link: this.link,
      demo: this.demo,
    }).catch(() => null);
    this.drawn = { card, lang, blob };
    return blob;
  }

  /**
   * True once the system took it (or the visitor closed the menu: nothing to
   * fall back to then). False when the browser refused, so the sheet takes over.
   */
  private async shareThroughSystem(data: ShareData): Promise<boolean> {
    if (!this.navigator?.share) return false;
    try {
      await this.navigator.share(data);
      return true;
    } catch (error) {
      return isAbort(error);
    }
  }

  private openSheet(card: WeatherCard, file: File | null, text: string, canShareFiles: boolean) {
    this.release();
    this.copied.set(null);
    this.fallback.set({
      file,
      url: file ? URL.createObjectURL(file) : null,
      alt: this.i18n.t(cardAlt(card)),
      text,
      canShareFiles,
    });
    this.sheetOpen.set(true);
  }

  private release(): void {
    const url = this.fallback()?.url;
    if (url) URL.revokeObjectURL(url);
  }

  private flash(what: 'image' | 'text' | 'failed'): void {
    clearTimeout(this.copiedTimer);
    this.copied.set(what);
    this.copiedTimer = setTimeout(() => this.copied.set(null), COPIED_MS);
  }
}
