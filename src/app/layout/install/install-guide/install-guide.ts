import { Component, computed, inject, linkedSignal } from '@angular/core';
import { MessageKey } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { DeviceKind } from '../../../core/pwa/device';
import { InstallStore } from '../../../core/pwa/install.store';
import { Icon } from '../../../shared/ui/icon/icon';
import { Sheet } from '../../../shared/ui/sheet/sheet';
import { UiStore } from '../../ui.store';
import { AppTile } from '../app-tile';
import { bookmarkShortcuts, desktopAppStep, GUIDE_VIEWS, phoneSteps } from '../guide-content';

/**
 * How to keep the web at hand on this device: the browser's own steps where
 * it can't be installed from a button (Safari, browser menus), a button where
 * it can, and on computers the difference between an app and a bookmark.
 * Opens on the visitor's device; they can switch if the guess is wrong.
 */
@Component({
  selector: 'lm-install-guide',
  imports: [Sheet, AppTile, Icon, TranslatePipe],
  templateUrl: './install-guide.html',
  styleUrl: './install-guide.scss',
})
export class InstallGuide {
  protected readonly ui = inject(UiStore);
  protected readonly store = inject(InstallStore);
  protected readonly device = this.store.device;
  protected readonly views = GUIDE_VIEWS;

  /** Back to the visitor's own device every time the guide opens. */
  protected readonly view = linkedSignal<boolean, DeviceKind>({
    source: this.ui.installGuideOpen,
    computation: () => this.device.kind,
  });

  /** Looking at their own kind of device: what we know about it applies. */
  protected readonly own = computed(() => this.view() === this.device.kind);
  protected readonly canPrompt = computed(() => this.own() && this.store.route() === 'prompt');
  protected readonly installedHere = computed(
    () => this.own() && this.store.route() === 'installed',
  );
  protected readonly inApp = computed(() => this.own() && this.device.inApp);

  protected readonly heading = computed<MessageKey>(() =>
    this.view() === 'desktop' ? 'install.guide.title.desktop' : 'install.guide.title.mobile',
  );
  protected readonly previewCaption = computed<MessageKey>(() =>
    this.view() === 'desktop' ? 'install.guide.preview.desktop' : 'install.guide.preview.mobile',
  );

  protected readonly steps = computed(() => {
    const view = this.view();
    return view === 'desktop' ? [] : phoneSteps(view, this.own() ? this.device : null);
  });
  protected readonly appStep = computed(() => desktopAppStep(this.own() ? this.device : null));
  protected readonly shortcuts = bookmarkShortcuts(this.device);

  protected select(view: DeviceKind): void {
    this.view.set(view);
  }

  protected install(): void {
    void this.store.install();
  }
}
