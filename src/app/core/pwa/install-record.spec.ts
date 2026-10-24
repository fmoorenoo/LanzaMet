import {
  EMPTY_INSTALL_RECORD,
  INVITE_RULES,
  InstallRecord,
  inviteDue,
  isInstallRecord,
  recordVisit,
} from './install-record';

const DAY = 24 * 3_600_000;
const NOW = Date.UTC(2026, 9, 24, 12);

const returning: InstallRecord = {
  ...EMPTY_INSTALL_RECORD,
  visitDays: 2,
  lastVisitDay: '2026-10-24',
};

describe('install record', () => {
  it('counts each island day once, however many times the page opens', () => {
    const first = recordVisit(EMPTY_INSTALL_RECORD, '2026-10-23');
    const again = recordVisit(first, '2026-10-23');
    const next = recordVisit(again, '2026-10-24');
    expect(first.visitDays).toBe(1);
    expect(again).toBe(first);
    expect(next).toMatchObject({ visitDays: 2, lastVisitDay: '2026-10-24' });
  });

  it('never invites on a first visit', () => {
    const first = recordVisit(EMPTY_INSTALL_RECORD, '2026-10-24');
    expect(inviteDue(first, NOW)).toBe(false);
    expect(inviteDue(returning, NOW)).toBe(true);
  });

  it('invites at most twice, a week apart', () => {
    const once = { ...returning, invites: 1, lastInviteAt: NOW - 3 * DAY };
    expect(inviteDue(once, NOW)).toBe(false);
    expect(inviteDue({ ...once, lastInviteAt: NOW - INVITE_RULES.gapMs }, NOW)).toBe(true);
    expect(inviteDue({ ...once, invites: 2, lastInviteAt: NOW - 30 * DAY }, NOW)).toBe(false);
  });

  it('stops for good once closed, acted on or installed', () => {
    expect(inviteDue({ ...returning, settled: true }, NOW)).toBe(false);
    expect(inviteDue({ ...returning, installed: true }, NOW)).toBe(false);
  });

  it('only accepts a well-formed stored record', () => {
    expect(isInstallRecord(EMPTY_INSTALL_RECORD)).toBe(true);
    expect(isInstallRecord({ ...returning, lastInviteAt: NOW })).toBe(true);
    expect(isInstallRecord({ installed: 'yes' })).toBe(false);
    expect(isInstallRecord(null)).toBe(false);
  });
});
