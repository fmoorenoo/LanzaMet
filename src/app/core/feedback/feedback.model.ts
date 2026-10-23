import { Lang } from '../i18n/i18n.model';

/** What a visitor wants to tell us. The order is the order on screen. */
export type FeedbackKind = 'bug' | 'suggestion' | 'improvement' | 'other';

export const FEEDBACK_KINDS: readonly FeedbackKind[] = [
  'bug',
  'suggestion',
  'improvement',
  'other',
];

/** Long enough to say something useful, short enough to read in one go. */
export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 2000;
/** The longest address the email standards allow. */
export const EMAIL_MAX_LENGTH = 254;

/** What the form hands over: everything typed, plus the anti-spam signals. */
export interface FeedbackDraft {
  readonly kind: FeedbackKind;
  readonly message: string;
  readonly anonymous: boolean;
  readonly email: string;
  /** A field people never see; only bots fill it in. */
  readonly honeypot: string;
  /** When the form was first shown (ms since epoch). */
  readonly startedAt: number;
}

/**
 * What reaches the provider, and nothing more. An anonymous submission has no
 * email; no submission carries the address of the page, the browser or the device.
 */
export interface FeedbackSubmission {
  readonly kind: FeedbackKind;
  readonly message: string;
  /** Language the interface was in, so the reply (if any) can match it. */
  readonly lang: Lang;
  readonly email: string | null;
}

/**
 * Why a submission did not go through. Each reason has its own message for
 * the visitor and says whether trying again can help.
 */
export type FeedbackFailureReason =
  /** No provider key in this build: nothing was sent. */
  | 'not-configured'
  /** The device is offline or the provider could not be reached. */
  | 'offline'
  | 'timeout'
  /** The provider asked us to slow down. */
  | 'rate-limited'
  /** This device sent something moments ago, or too much in the last hour. */
  | 'too-soon'
  /** The same message was already delivered from this device. */
  | 'duplicate'
  /** The provider refused it (spam filter, invalid data). */
  | 'rejected'
  /** The provider failed, or answered something we cannot trust as a receipt. */
  | 'unavailable';

export class FeedbackError extends Error {
  constructor(
    readonly reason: FeedbackFailureReason,
    /** For `too-soon`: how long until another submission is accepted. */
    readonly retryAfterMs?: number,
  ) {
    super(`Feedback not sent: ${reason}`);
    this.name = 'FeedbackError';
  }
}
