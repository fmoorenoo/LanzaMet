import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { InstallStore } from '../../core/pwa/install.store';
import { Icon } from '../../shared/ui/icon/icon';
import { Tooltip } from '../../shared/ui/tooltip/tooltip';
import { UiStore } from '../ui.store';
import { AppTile } from './app-tile';

/** Long enough to have looked at the day first. */
const QUIET_MS = 8000;

/**
 * A small card that offers, to a returning visitor, to keep the web at hand.
 * InstallStore decides whether it may appear (never on a first visit, at most
 * twice, never again once closed); this waits for a quiet moment — the page
 * visible, no sheet open — and never takes the focus. The cross, or Escape
 * from either button, closes it for good; Settings keeps the option.
 */
@Component({
  selector: 'qth-install-invite',
  imports: [AppTile, Icon, Tooltip, TranslatePipe],
  template: `
    @if (store.inviteOpen()) {
      <aside
        id="install-invite"
        class="invite"
        [attr.aria-label]="'install.invite.label' | t"
        animate.leave="is-leaving"
      >
        <qth-app-tile />
        <div class="text">
          <p class="title">{{ 'install.invite.title' | t }}</p>
          <p class="sub">{{ text() | t }}</p>
          <button
            id="install-invite-button"
            type="button"
            class="btn btn--primary action"
            (click)="accept()"
            (keydown.escape)="dismiss()"
          >
            {{ (store.route() === 'prompt' ? 'install.action.install' : 'install.action.how') | t }}
          </button>
        </div>
        <button
          type="button"
          class="icon-btn close"
          [attr.aria-label]="'install.invite.dismiss' | t"
          [qthTooltip]="'install.invite.dismiss' | t"
          (click)="dismiss()"
          (keydown.escape)="dismiss()"
        >
          <qth-icon name="close" />
        </button>
      </aside>
    }
  `,
  styleUrl: './install-invite.scss',
})
export class InstallInvite {
  protected readonly store = inject(InstallStore);
  private readonly ui = inject(UiStore);
  private readonly document = inject(DOCUMENT);

  protected readonly text = computed<MessageKey>(() =>
    this.store.device.kind === 'desktop'
      ? 'install.invite.text.desktop'
      : 'install.invite.text.mobile',
  );

  /** Bumped to wait again when the moment wasn't quiet. */
  private readonly attempt = signal(0);

  constructor() {
    effect((onCleanup) => {
      this.attempt();
      if (!this.store.canInvite()) return;
      const timer = setTimeout(() => this.showWhenQuiet(), QUIET_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected accept(): void {
    if (this.store.route() === 'prompt') {
      void this.store.install();
    } else {
      this.ui.openInstallGuide();
    }
    this.store.settle();
  }

  protected dismiss(): void {
    // Closed from the keyboard: the focus goes back to the page, not to nowhere.
    const active = this.document.activeElement;
    if (active?.closest('#install-invite')) {
      this.document.getElementById('main-content')?.focus({ preventScroll: true });
    }
    this.store.settle();
  }

  private showWhenQuiet(): void {
    const busy = this.document.hidden || !!this.document.querySelector('dialog[open]');
    if (busy) this.attempt.update((n) => n + 1);
    else this.store.showInvite();
  }
}
