import { TIME } from '../utils/time';

/*
 * What this device remembers about installing the web, and when the invite
 * may appear. The invite is for people who come back: never on a first
 * visit, at most twice, a week apart, and never again once closed or acted on.
 * Settings always keeps the option, so nothing is lost by not insisting.
 */

export interface InstallRecord {
  /**
   * Seen running as an installed app, or installed from here. Only a hint:
   * uninstalling leaves no trace, so a fresh offer from the browser clears it.
   */
  readonly installed: boolean;
  /** Distinct island days with a visit. */
  readonly visitDays: number;
  readonly lastVisitDay: string | null;
  /** Times the invite has been shown, and when last (ms since epoch). */
  readonly invites: number;
  readonly lastInviteAt: number | null;
  /** The visitor closed the invite or already acted on it: it doesn't come back. */
  readonly settled: boolean;
}

export const EMPTY_INSTALL_RECORD: InstallRecord = {
  installed: false,
  visitDays: 0,
  lastVisitDay: null,
  invites: 0,
  lastInviteAt: null,
  settled: false,
};

export const INVITE_RULES = {
  /** The second day with a visit is the first that can show it. */
  minVisitDays: 2,
  maxInvites: 2,
  gapMs: 7 * 24 * TIME.HOUR,
} as const;

export function isInstallRecord(value: unknown): value is InstallRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r['installed'] === 'boolean' &&
    typeof r['visitDays'] === 'number' &&
    (r['lastVisitDay'] === null || typeof r['lastVisitDay'] === 'string') &&
    typeof r['invites'] === 'number' &&
    (r['lastInviteAt'] === null || typeof r['lastInviteAt'] === 'number') &&
    typeof r['settled'] === 'boolean'
  );
}

/** Counts today once, however many times the page is opened. */
export function recordVisit(record: InstallRecord, day: string): InstallRecord {
  if (record.lastVisitDay === day) return record;
  return { ...record, visitDays: record.visitDays + 1, lastVisitDay: day };
}

export function inviteDue(record: InstallRecord, now: number): boolean {
  if (record.installed || record.settled) return false;
  if (record.visitDays < INVITE_RULES.minVisitDays) return false;
  if (record.invites >= INVITE_RULES.maxInvites) return false;
  return record.lastInviteAt === null || now - record.lastInviteAt >= INVITE_RULES.gapMs;
}
