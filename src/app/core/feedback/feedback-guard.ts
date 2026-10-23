import { FeedbackError } from './feedback.model';

/*
 * Basic protection against repeated and automated submissions, kept on the
 * device. It complements the provider's own spam filter; it never replaces
 * it, and it only remembers times and a fingerprint, never what was written.
 */

const SECOND = 1000;
const HOUR = 3600 * SECOND;

/** A person needs a few seconds to choose and write; a script does not. */
export const MIN_FILL_MS = 3 * SECOND;
/** Pause after each delivered message. */
export const COOLDOWN_MS = 30 * SECOND;
/** At most this many messages per device in any rolling hour. */
export const HOURLY_LIMIT = 5;
/** The same text is not delivered twice within this window. */
export const DUPLICATE_WINDOW_MS = 24 * HOUR;

export interface SendHistory {
  /** When each recent message was delivered (ms since epoch), oldest first. */
  readonly sentAt: readonly number[];
  /** Fingerprint of the last delivered message. */
  readonly lastFingerprint: string | null;
}

export const EMPTY_HISTORY: SendHistory = { sentAt: [], lastFingerprint: null };

export const isSendHistory = (value: unknown): value is SendHistory => {
  if (typeof value !== 'object' || value === null) return false;
  const { sentAt, lastFingerprint } = value as Record<string, unknown>;
  return (
    Array.isArray(sentAt) &&
    sentAt.every((t) => typeof t === 'number' && Number.isFinite(t)) &&
    (lastFingerprint === null || typeof lastFingerprint === 'string')
  );
};

/**
 * A short, one-way fingerprint of a message (FNV-1a over the text with case
 * and spacing normalised), so "the same message again" can be recognised
 * without keeping the message.
 */
export function fingerprint(message: string): string {
  const text = message.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Throws a FeedbackError when this message should not be sent now. */
export function assertCanSend(
  history: SendHistory,
  message: string,
  startedAt: number,
  now: number,
): void {
  const filling = now - startedAt;
  if (filling < MIN_FILL_MS) throw new FeedbackError('too-soon', MIN_FILL_MS - filling);

  const past = history.sentAt.filter((t) => t <= now);
  const recent = past.filter((t) => now - t < HOUR);
  const last = past.at(-1);

  if (
    last !== undefined &&
    now - last < DUPLICATE_WINDOW_MS &&
    history.lastFingerprint === fingerprint(message)
  ) {
    throw new FeedbackError('duplicate');
  }
  if (last !== undefined && now - last < COOLDOWN_MS) {
    throw new FeedbackError('too-soon', COOLDOWN_MS - (now - last));
  }
  if (recent.length >= HOURLY_LIMIT) {
    throw new FeedbackError('too-soon', HOUR - (now - recent[0]));
  }
}

/** The history after a delivered message, keeping only what the rules still need. */
export function recordSent(history: SendHistory, message: string, now: number): SendHistory {
  return {
    sentAt: [...history.sentAt.filter((t) => now - t < DUPLICATE_WINDOW_MS && t <= now), now],
    lastFingerprint: fingerprint(message),
  };
}
