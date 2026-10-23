import { inject, Service } from '@angular/core';
import { I18n } from '../i18n/i18n.store';
import { readStored, writeStored } from '../utils/storage';
import {
  assertCanSend,
  EMPTY_HISTORY,
  isSendHistory,
  recordSent,
  SendHistory,
} from './feedback-guard';
import { FeedbackTransport } from './feedback-transport';
import { FeedbackDraft, FeedbackError } from './feedback.model';

const HISTORY_KEY = 'feedback';

/**
 * Sends what the visitor wrote, whoever the provider is. It strips the draft
 * down to what may leave the device (no email when anonymous), applies the
 * anti-repetition rules, and resolves only when the provider confirms receipt.
 */
@Service()
export class FeedbackService {
  private readonly transport = inject(FeedbackTransport);
  private readonly i18n = inject(I18n);

  /** False when this build cannot deliver anything (no provider key). */
  readonly configured = this.transport.configured;

  private history: SendHistory = readStored(HISTORY_KEY, isSendHistory) ?? EMPTY_HISTORY;
  private inflight: Promise<void> | null = null;

  /** A second call while one is on its way joins it instead of sending twice. */
  send(draft: FeedbackDraft): Promise<void> {
    this.inflight ??= this.deliver(draft).finally(() => (this.inflight = null));
    return this.inflight;
  }

  private async deliver(draft: FeedbackDraft): Promise<void> {
    if (!this.transport.configured) throw new FeedbackError('not-configured');
    // Bots fill every field; people never see this one. Nothing is sent.
    if (draft.honeypot.trim() !== '') throw new FeedbackError('rejected');

    const message = draft.message.trim();
    // Another tab may have sent something since this one loaded.
    const history = readStored(HISTORY_KEY, isSendHistory) ?? this.history;
    assertCanSend(history, message, draft.startedAt, Date.now());

    await this.transport.send({
      kind: draft.kind,
      message,
      lang: this.i18n.lang(),
      email: draft.anonymous ? null : draft.email.trim() || null,
    });

    this.history = recordSent(history, message, Date.now());
    writeStored(HISTORY_KEY, this.history);
  }
}
