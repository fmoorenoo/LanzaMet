import { TestBed } from '@angular/core/testing';
import { EMPTY_INSTALL_RECORD, InstallRecord } from './install-record';
import { BeforeInstallPromptEvent, InstallStore } from './install.store';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const IPHONE_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 401.0.0.39.82';

/** A returning visitor: yesterday was their first day here. */
const RETURNING: InstallRecord = {
  ...EMPTY_INSTALL_RECORD,
  visitDays: 1,
  lastVisitDay: '2000-01-01',
};

function store(saved: InstallRecord | null = null, userAgent?: string): InstallStore {
  localStorage.clear();
  if (saved) localStorage.setItem('qth.install', JSON.stringify(saved));
  if (userAgent) vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  return TestBed.inject(InstallStore);
}

function offer(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  return { event, prompt };
}

const saved = (): InstallRecord => JSON.parse(localStorage.getItem('qth.install') ?? 'null');

describe('InstallStore', () => {
  afterEach(() => {
    localStorage.clear();
    delete window.qthInstallPrompt;
    vi.restoreAllMocks();
  });

  it('explains how when the browser makes no offer', () => {
    expect(store().route()).toBe('guide');
  });

  it("installs through the browser's own dialog and remembers it", async () => {
    const installs = store();
    const { event, prompt } = offer('accepted');
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(installs.route()).toBe('prompt');

    await expect(installs.install()).resolves.toBe('accepted');
    expect(prompt).toHaveBeenCalledOnce();
    expect(installs.route()).toBe('installed');
    expect(installs.justInstalled()).toBe(true);
    expect(saved()).toMatchObject({ installed: true, settled: true });
  });

  it('goes back to the guide when the visitor says no: an offer is used once', async () => {
    const installs = store();
    window.dispatchEvent(offer('dismissed').event);
    await expect(installs.install()).resolves.toBe('dismissed');
    expect(installs.route()).toBe('guide');
    await expect(installs.install()).resolves.toBe('unavailable');
  });

  it('keeps an offer that came before the app started', () => {
    window.qthInstallPrompt = offer('accepted').event;
    expect(store().route()).toBe('prompt');
  });

  it('forgets an old install when the browser offers it again (it was uninstalled)', () => {
    const installs = store({ ...RETURNING, installed: true });
    expect(installs.route()).toBe('installed');
    window.dispatchEvent(offer('accepted').event);
    expect(installs.route()).toBe('prompt');
    expect(saved().installed).toBe(false);
  });

  it('notices an install made from the browser menu', () => {
    const installs = store();
    window.dispatchEvent(new Event('appinstalled'));
    expect(installs.route()).toBe('installed');
  });

  describe('invite', () => {
    it('waits for a return visit, even with an offer', () => {
      const installs = store();
      window.dispatchEvent(offer('accepted').event);
      expect(installs.canInvite()).toBe(false);
      expect(saved().visitDays).toBe(1);
    });

    it('appears once per visit, is counted, and stops for good when closed', () => {
      const installs = store(RETURNING);
      window.dispatchEvent(offer('accepted').event);
      expect(installs.canInvite()).toBe(true);

      installs.showInvite();
      expect(installs.inviteOpen()).toBe(true);
      expect(installs.canInvite()).toBe(false);
      expect(saved()).toMatchObject({ visitDays: 2, invites: 1 });

      installs.settle();
      expect(installs.inviteOpen()).toBe(false);
      expect(saved().settled).toBe(true);
    });

    it('needs the browser offer on a computer: no invite to read steps', () => {
      expect(store(RETURNING).canInvite()).toBe(false);
    });

    it("invites on an iPhone, where Safari's steps are short and sure", () => {
      expect(store(RETURNING, IPHONE_SAFARI).canInvite()).toBe(true);
    });

    it("doesn't invite inside another app's browser, which can't add it", () => {
      const installs = store(RETURNING, IPHONE_INSTAGRAM);
      expect(installs.device.inApp).toBe(true);
      expect(installs.canInvite()).toBe(false);
    });
  });
});
