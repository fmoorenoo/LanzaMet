import { Component, computed, inject } from '@angular/core';
import { MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { InstallStore } from '../../core/pwa/install.store';
import { UiStore } from '../ui.store';
import { AppTile } from './app-tile';

/**
 * The permanent home of installing, in Settings: one row that installs at
 * once where the browser allows it, opens the guide where it doesn't, and
 * says so once it's done. Not rendered when already running as the app.
 */
@Component({
  selector: 'qth-install-option',
  imports: [AppTile, TranslatePipe],
  template: `
    <section
      id="install-option"
      class="group"
      aria-labelledby="install-option-title"
      [attr.data-install-route]="store.route()"
    >
      <h3 id="install-option-title" class="legend">{{ 'install.group' | t }}</h3>
      <div class="row">
        <qth-app-tile [installed]="installed()" />
        <span class="text choice-text">
          <span class="choice-label">{{ title() | t }}</span>
          <span class="choice-hint">{{ hint() | t }}</span>
          <!-- A computer that installs from the button still has bookmarks: the guide compares both. -->
          @if (desktop && store.route() === 'prompt') {
            <button id="install-more-button" type="button" class="more" (click)="guide()">
              {{ 'install.action.more' | t }}
            </button>
          }
        </span>
        @switch (store.route()) {
          @case ('prompt') {
            <button
              id="install-button"
              type="button"
              class="btn btn--primary action"
              (click)="install()"
            >
              {{ 'install.action.install' | t }}
            </button>
          }
          @case ('guide') {
            <button id="install-guide-button" type="button" class="btn action" (click)="guide()">
              {{ 'install.action.how' | t }}
            </button>
          }
        }
      </div>
      <p class="visually-hidden" role="status">
        {{ store.justInstalled() ? ('install.done' | t) : '' }}
      </p>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    // Narrow sheets: the button sits under the text, aligned with it.
    .row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: var(--s-3) var(--s-4);
      padding: var(--s-1) var(--s-3) var(--s-1) var(--s-2);
    }

    .text {
      min-width: 0;
    }

    .more {
      justify-self: start;
      min-height: 1.5rem;
      margin-top: 0.125rem;
      font-size: var(--fs-small);
      font-weight: 560;
      color: var(--c-accent);
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }

    .action {
      grid-column: 2;
      justify-self: start;
    }

    // With room, one line: tile, words, button.
    @container (min-width: 25rem) {
      .row {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }

      .action {
        grid-column: 3;
      }
    }
  `,
})
export class InstallOption {
  protected readonly store = inject(InstallStore);
  private readonly ui = inject(UiStore);
  protected readonly desktop = this.store.device.kind === 'desktop';

  protected readonly installed = computed(() => this.store.route() === 'installed');

  protected readonly title = computed<MessageKey>(() => {
    if (this.installed()) return 'install.option.installed';
    return this.desktop ? 'install.option.title.desktop' : 'install.option.title.mobile';
  });

  protected readonly hint = computed<MessageKey>(() => {
    if (this.installed()) {
      return this.desktop ? 'install.option.installed.desktop' : 'install.option.installed.mobile';
    }
    if (!this.desktop) return 'install.option.hint.mobile';
    return this.store.route() === 'prompt'
      ? 'install.option.hint.desktop.prompt'
      : 'install.option.hint.desktop';
  });

  protected install(): void {
    void this.store.install();
  }

  protected guide(): void {
    this.store.settle();
    this.ui.openInstallGuide();
  }
}
