import { Component, computed, inject, output, signal } from '@angular/core';
import {
  disabled,
  email,
  FieldState,
  form,
  FormField,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import {
  EMAIL_MAX_LENGTH,
  FEEDBACK_KINDS,
  FeedbackError,
  FeedbackFailureReason,
  FeedbackKind,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
} from '../../../core/feedback/feedback.model';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { MessageKey, Msg, msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconName } from '../../../shared/ui/icon/icons';

/** What the page shows once the provider has confirmed receipt. */
export interface FeedbackReceipt {
  readonly email: string | null;
  readonly anonymous: boolean;
}

interface FeedbackModel {
  kind: FeedbackKind | '';
  message: string;
  anonymous: boolean;
  email: string;
  /** The honeypot: hidden from people, irresistible to bots. */
  website: string;
}

interface KindOption {
  readonly kind: FeedbackKind;
  readonly icon: IconName;
  readonly label: MessageKey;
  readonly hint: MessageKey;
}

const KIND_ICONS: Readonly<Record<FeedbackKind, IconName>> = {
  bug: 'bug',
  suggestion: 'idea',
  improvement: 'sprout',
  other: 'message',
};

type SendState = 'idle' | 'sending' | 'failed';

/** The counter warms up as the end of the allowed length comes near. */
const NEAR_LIMIT = MESSAGE_MAX_LENGTH * 0.9;

/**
 * Kind, message, anonymity and an optional email. Errors show once a field
 * has been left or a send was attempted; the only "sent" is the provider's.
 */
@Component({
  selector: 'qth-feedback-form',
  imports: [FormField, Icon, TranslatePipe],
  templateUrl: './feedback-form.html',
  styleUrl: './feedback-form.scss',
  host: { class: 'feedback-form' },
})
export class FeedbackForm {
  private readonly feedback = inject(FeedbackService);

  /** Emitted only after the provider has confirmed receipt. */
  readonly sent = output<FeedbackReceipt>();

  protected readonly kinds: readonly KindOption[] = FEEDBACK_KINDS.map((kind) => ({
    kind,
    icon: KIND_ICONS[kind],
    label: `feedback.kind.${kind}`,
    hint: `feedback.kind.${kind}.hint`,
  }));

  protected readonly maxLength = MESSAGE_MAX_LENGTH;
  protected readonly limits = msg('feedback.message.limits', {
    min: MESSAGE_MIN_LENGTH,
    max: MESSAGE_MAX_LENGTH,
  });

  private readonly model = signal<FeedbackModel>({
    kind: '',
    message: '',
    // Anonymous unless the visitor chooses otherwise.
    anonymous: true,
    email: '',
    website: '',
  });

  protected readonly f = form(this.model, (p) => {
    required(p.kind);
    validate(p.message, ({ value }) => {
      const length = value().trim().length;
      if (length === 0) return { kind: 'empty' };
      if (length < MESSAGE_MIN_LENGTH) return { kind: 'short' };
      if (value().length > MESSAGE_MAX_LENGTH) return { kind: 'long' };
      return null;
    });
    // Anonymous means the email is neither asked for nor sent.
    disabled(p.email, ({ valueOf }) => valueOf(p.anonymous));
    email(p.email);
    validate(p.email, ({ value }) =>
      value().trim().length > EMAIL_MAX_LENGTH ? { kind: 'long' } : null,
    );
  });

  /** When the form was shown: the anti-spam check needs it. */
  private readonly startedAt = Date.now();

  protected readonly state = signal<SendState>('idle');
  protected readonly failure = signal<Msg | null>(null);
  protected readonly sending = computed(() => this.state() === 'sending');

  protected readonly anonymous = computed(() => this.model().anonymous);
  protected readonly length = computed(() => this.model().message.length);
  protected readonly nearLimit = computed(() => this.length() >= NEAR_LIMIT);
  protected readonly overLimit = computed(() => this.length() > MESSAGE_MAX_LENGTH);
  protected readonly count = computed(() =>
    msg('feedback.message.count', { count: this.length(), max: MESSAGE_MAX_LENGTH }),
  );
  protected readonly counter = computed(() =>
    msg('feedback.message.counter', { count: this.length(), max: MESSAGE_MAX_LENGTH }),
  );

  /** The prompt follows the kind chosen, so the visitor knows what helps. */
  protected readonly placeholder = computed<MessageKey>(
    () => `feedback.message.placeholder.${this.model().kind || 'none'}`,
  );

  protected readonly kindError = computed(() => this.visibleError(this.f.kind()) !== null);

  protected readonly messageError = computed((): Msg | null => {
    switch (this.visibleError(this.f.message())) {
      case 'empty':
        return msg('feedback.invalid.messageEmpty');
      case 'short':
        return msg('feedback.invalid.messageShort', { min: MESSAGE_MIN_LENGTH });
      case 'long':
        return msg('feedback.invalid.messageLong', {
          n: this.length() - MESSAGE_MAX_LENGTH,
        });
      default:
        return null;
    }
  });

  protected readonly emailError = computed((): Msg | null => {
    switch (this.visibleError(this.f.email())) {
      case null:
        return null;
      case 'long':
        return msg('feedback.invalid.emailLong');
      default:
        return msg('feedback.invalid.email');
    }
  });

  protected onAnonymousChange(anonymous: boolean): void {
    // Turning anonymity on forgets any email typed, so none can leave by mistake.
    if (anonymous) this.f.email().value.set('');
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.sending()) return;
    this.failure.set(null);

    await submit(this.f, {
      action: async () => {
        await this.send();
        return undefined;
      },
      onInvalid: () => this.focusFirstInvalid(),
    });
  }

  private async send(): Promise<void> {
    const draft = this.model();
    if (draft.kind === '') return;
    this.state.set('sending');
    try {
      await this.feedback.send({
        kind: draft.kind,
        message: draft.message,
        anonymous: draft.anonymous,
        email: draft.email,
        honeypot: draft.website,
        startedAt: this.startedAt,
      });
      this.state.set('idle');
      this.sent.emit({
        anonymous: draft.anonymous,
        email: draft.anonymous ? null : draft.email.trim() || null,
      });
    } catch (error) {
      this.state.set('failed');
      this.failure.set(failureMessage(error));
    }
  }

  private focusFirstInvalid(): void {
    const first = [this.f.kind(), this.f.message(), this.f.email()].find((field) =>
      field.invalid(),
    );
    first?.focusBoundControl();
  }

  /** The error kind to show for a field: only once it was touched or a send was tried. */
  private visibleError(field: FieldState<unknown>): string | null {
    if (!field.touched() || field.disabled()) return null;
    return field.errors()[0]?.kind ?? null;
  }
}

function failureMessage(error: unknown): Msg {
  const reason: FeedbackFailureReason =
    error instanceof FeedbackError ? error.reason : 'unavailable';
  if (reason === 'too-soon' && error instanceof FeedbackError) {
    return msg('feedback.failed.too-soon', { wait: { duration: error.retryAfterMs ?? 0 } });
  }
  return msg(`feedback.failed.${reason}`);
}
