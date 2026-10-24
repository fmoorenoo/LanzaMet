import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { readStored, writeStored } from '../utils/storage';
import { islandDateKey } from '../utils/time';
import { Device, detectDevice } from './device';
import {
  EMPTY_INSTALL_RECORD,
  InstallRecord,
  inviteDue,
  isInstallRecord,
  recordVisit,
} from './install-record';

/** Chromium's offer to install the web (not in the DOM typings yet). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Kept by the inline script in index.html when the offer comes before the app starts. */
    lmInstallPrompt?: BeforeInstallPromptEvent;
  }
}

/**
 * How this visitor can keep the web at hand:
 *  · standalone — it is already running as an installed app: nothing to offer;
 *  · prompt — the browser can install it from our button (Chromium);
 *  · installed — installed before, now opened in a tab;
 *  · guide — the browser does it from its own menu (Safari's Share, the
 *    browser menu) or not at all (bookmarks), so we explain how.
 */
export type InstallRoute = 'standalone' | 'prompt' | 'installed' | 'guide';

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/** Any of the display modes an installed web app can run in. */
const STANDALONE_QUERY = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay']
  .map((mode) => `(display-mode: ${mode})`)
  .join(', ');

const STORAGE_KEY = 'install';

/**
 * Installing the web as an app. Listens for the browser's install offer and
 * for the install itself, knows when it is already running as an app, and
 * decides — once per visit — whether the invite may appear.
 */
@Service()
export class InstallStore {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly navigator = this.window?.navigator;

  readonly device: Device = detectDevice(
    this.navigator?.userAgent ?? '',
    this.navigator?.maxTouchPoints ?? 0,
  );

  readonly standalone = signal(false);
  private readonly offer = signal<BeforeInstallPromptEvent | null>(null);
  private readonly record = signal<InstallRecord>(
    readStored(STORAGE_KEY, isInstallRecord) ?? EMPTY_INSTALL_RECORD,
  );

  /** True right after installing from our button, for the confirmation. */
  readonly justInstalled = signal(false);

  readonly route = computed<InstallRoute>(() => {
    if (this.standalone()) return 'standalone';
    if (this.offer()) return 'prompt';
    if (this.record().installed) return 'installed';
    return 'guide';
  });

  /** The invite is on screen. */
  readonly inviteOpen = signal(false);

  /** Worked out once, when the visit starts. */
  private readonly due: boolean;
  private readonly invitedThisVisit = signal(false);

  /** The invite may appear now (the component still waits for a quiet moment). */
  readonly canInvite = computed(() => {
    if (!this.due || this.invitedThisVisit()) return false;
    const route = this.route();
    if (route === 'prompt') return true;
    // Without a button, only where the browser's own steps are short and sure.
    return route === 'guide' && invitesWithSteps(this.device);
  });

  constructor() {
    const win = this.window;
    const listening = new AbortController();
    inject(DestroyRef).onDestroy(() => listening.abort());
    const options = { signal: listening.signal };
    const standaloneQuery = win?.matchMedia?.(STANDALONE_QUERY);
    const isStandalone = () =>
      !!standaloneQuery?.matches ||
      (win?.navigator as { standalone?: boolean } | undefined)?.standalone === true;
    this.standalone.set(isStandalone());
    standaloneQuery?.addEventListener('change', () => this.standalone.set(isStandalone()), options);

    if (this.standalone()) this.save({ installed: true });
    this.save(recordVisit(this.record(), islandDateKey(new Date())));
    this.due = inviteDue(this.record(), Date.now());

    if (win?.lmInstallPrompt) this.receiveOffer(win.lmInstallPrompt);
    win?.addEventListener(
      'beforeinstallprompt',
      (event) => {
        event.preventDefault();
        this.receiveOffer(event as BeforeInstallPromptEvent);
      },
      options,
    );
    win?.addEventListener('appinstalled', () => this.markInstalled(), options);
  }

  /** Opens the browser's own install dialog. Each offer can be used once. */
  async install(): Promise<InstallOutcome> {
    const offer = this.offer();
    if (!offer) return 'unavailable';
    this.settle();
    this.offer.set(null);
    if (this.window) this.window.lmInstallPrompt = undefined;
    try {
      await offer.prompt();
      const { outcome } = await offer.userChoice;
      if (outcome === 'accepted') {
        this.justInstalled.set(true);
        this.markInstalled();
      }
      return outcome;
    } catch {
      return 'unavailable';
    }
  }

  showInvite(): void {
    if (!this.canInvite()) return;
    this.invitedThisVisit.set(true);
    this.inviteOpen.set(true);
    const record = this.record();
    this.save({ invites: record.invites + 1, lastInviteAt: Date.now() });
  }

  /** Closed or acted on: the invite won't come back. */
  settle(): void {
    this.inviteOpen.set(false);
    if (!this.record().settled) this.save({ settled: true });
  }

  private receiveOffer(event: BeforeInstallPromptEvent): void {
    this.offer.set(event);
    // The browser only offers what isn't installed: an old "installed" was uninstalled since.
    if (this.record().installed) this.save({ installed: false });
  }

  private markInstalled(): void {
    this.offer.set(null);
    this.inviteOpen.set(false);
    this.save({ installed: true, settled: true });
  }

  private save(change: Partial<InstallRecord>): void {
    const next = { ...this.record(), ...change };
    this.record.set(next);
    writeStored(STORAGE_KEY, next);
  }
}

/**
 * Phones whose browsers add to the home screen in three clear steps: Safari
 * and the other iPhone browsers through Share, Firefox through its menu.
 * Chromium browsers wait for their own install offer instead.
 */
function invitesWithSteps(device: Device): boolean {
  if (device.inApp) return false;
  return device.kind === 'ios' || (device.kind === 'android' && device.browser === 'firefox');
}
