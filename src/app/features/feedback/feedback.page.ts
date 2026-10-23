import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, inject, Injector, signal } from '@angular/core';
import { FeedbackService } from '../../core/feedback/feedback.service';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { FeedbackForm, FeedbackReceipt } from './feedback-form/feedback-form';
import { FeedbackPrivacy } from './feedback-privacy';
import { FeedbackSent } from './feedback-sent';

/** "Help us": report a bug or suggest something; leaving an email is optional. */
@Component({
  selector: 'qth-feedback-page',
  host: { id: 'feedback-page', class: 'page feedback-page' },
  imports: [FeedbackForm, FeedbackSent, FeedbackPrivacy, StatusMessage, TranslatePipe],
  template: `
    <header id="feedback-header" class="page-head page-header">
      <h1 class="t-display">{{ 'route.feedback' | t }}</h1>
      <p class="t-lead t-muted lead">{{ 'feedback.lead' | t }}</p>
    </header>

    <div class="content">
      @if (!configured) {
        <qth-status-message
          id="feedback-not-configured"
          class="notice"
          [title]="'feedback.notConfigured' | t"
          [text]="'feedback.notConfigured.text' | t"
        />
      }
      @if (receipt(); as sent) {
        <qth-feedback-sent [receipt]="sent" (again)="again()" />
      } @else {
        <qth-feedback-form (sent)="receipt.set($event)" />
      }

      <qth-feedback-privacy id="feedback-privacy" class="privacy" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: var(--s-12);
    }
    .page-head {
      display: grid;
      gap: var(--s-3);
      padding: calc(var(--safe-top) + var(--s-8)) var(--gutter) var(--s-8);
    }
    .lead {
      max-width: 38ch;
    }
    .content {
      display: grid;
      gap: var(--s-6);
      padding: 0 var(--gutter);
    }
    // The privacy line sits right under the send button, as its footnote.
    .privacy {
      margin-top: calc(var(--s-2) - var(--s-6));
    }
    @media (min-width: 48rem) {
      .page-head,
      .content {
        max-width: 40rem;
        margin-inline: auto;
      }
      .page-head {
        padding-top: var(--s-12);
      }
    }
  `,
})
export class FeedbackPage {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly configured = inject(FeedbackService).configured;
  protected readonly receipt = signal<FeedbackReceipt | null>(null);

  /** A fresh, empty form, with focus on its first choice. */
  protected again(): void {
    this.receipt.set(null);
    afterNextRender(
      () => this.document.querySelector<HTMLElement>('#feedback-kind input')?.focus(),
      { injector: this.injector },
    );
  }
}
