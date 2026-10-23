import {
  assertCanSend,
  COOLDOWN_MS,
  EMPTY_HISTORY,
  fingerprint,
  HOURLY_LIMIT,
  isSendHistory,
  MIN_FILL_MS,
  recordSent,
} from './feedback-guard';
import { FeedbackError } from './feedback.model';

const NOW = Date.UTC(2026, 9, 23, 12);
const MINUTE = 60_000;
const OPENED = NOW - MINUTE;

function refusal(run: () => void): FeedbackError | null {
  try {
    run();
    return null;
  } catch (error) {
    return error instanceof FeedbackError ? error : null;
  }
}

describe('feedback guard', () => {
  it('fingerprints ignore case and spacing, and never contain the text', () => {
    expect(fingerprint('La  marea\nno cuadra')).toBe(fingerprint('la marea no cuadra '));
    expect(fingerprint('La marea no cuadra')).not.toBe(fingerprint('La marea sí cuadra'));
    expect(fingerprint('La marea no cuadra')).not.toContain('marea');
  });

  it('lets a first message through', () => {
    expect(refusal(() => assertCanSend(EMPTY_HISTORY, 'Hola, una idea', OPENED, NOW))).toBeNull();
  });

  it('holds back a send faster than a person could write it', () => {
    const error = refusal(() => assertCanSend(EMPTY_HISTORY, 'Hola', NOW - 1000, NOW));
    expect(error?.reason).toBe('too-soon');
    expect(error?.retryAfterMs).toBe(MIN_FILL_MS - 1000);
  });

  it('refuses the same message again, even after the cooldown', () => {
    const history = recordSent(EMPTY_HISTORY, 'La marea no cuadra', NOW - 10 * MINUTE);
    const error = refusal(() => assertCanSend(history, 'la marea  no cuadra', OPENED, NOW));
    expect(error?.reason).toBe('duplicate');
  });

  it('asks for a pause right after a delivered message', () => {
    const history = recordSent(EMPTY_HISTORY, 'Primero', NOW - 10_000);
    const error = refusal(() => assertCanSend(history, 'Segundo', OPENED, NOW));
    expect(error?.reason).toBe('too-soon');
    expect(error?.retryAfterMs).toBe(COOLDOWN_MS - 10_000);
  });

  it('caps the messages per hour and says when the next one fits', () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < HOURLY_LIMIT; i++) {
      history = recordSent(history, `Mensaje ${i}`, NOW - (50 - i * 5) * MINUTE);
    }
    const error = refusal(() => assertCanSend(history, 'Uno más', OPENED, NOW));
    expect(error?.reason).toBe('too-soon');
    expect(error?.retryAfterMs).toBe(10 * MINUTE);
    // An hour after the oldest, there is room again.
    expect(refusal(() => assertCanSend(history, 'Uno más', OPENED, NOW + 11 * MINUTE))).toBeNull();
  });

  it('forgets what the rules no longer need', () => {
    const old = recordSent(EMPTY_HISTORY, 'Viejo', NOW - 25 * 60 * MINUTE);
    const history = recordSent(old, 'Nuevo', NOW);
    expect(history.sentAt).toEqual([NOW]);
    expect(history.lastFingerprint).toBe(fingerprint('Nuevo'));
  });

  it('only trusts a well-formed stored history', () => {
    expect(isSendHistory({ sentAt: [NOW], lastFingerprint: 'abc' })).toBe(true);
    expect(isSendHistory({ sentAt: ['x'], lastFingerprint: null })).toBe(false);
    expect(isSendHistory(null)).toBe(false);
  });
});
