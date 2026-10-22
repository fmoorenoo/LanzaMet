import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DATA_MODE } from '../../core/data/http/data-config';
import { msg, MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { OfficialStore } from '../../core/state/official.store';
import { SectionStatus } from '../../core/state/section-state';
import { ThemePreference, ThemeStore } from '../../core/state/theme.store';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { LanguageSelector } from '../language-selector/language-selector';
import { UiStore } from '../ui.store';
import { DEMO_CONTROLS } from './demo-controls.token';

const STATUS: Readonly<Record<Exclude<SectionStatus, 'empty'>, MessageKey>> = {
  ready: 'settings.status.ready',
  error: 'settings.status.error',
  loading: 'settings.status.checking',
};

/** Language, appearance, where the data comes from and — in the demo build — the demo's controls. */
@Component({
  selector: 'qth-settings-panel',
  imports: [Sheet, NgComponentOutlet, TranslatePipe, LanguageSelector],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  protected readonly ui = inject(UiStore);
  protected readonly theme = inject(ThemeStore);
  private readonly official = inject(OfficialStore);

  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  protected readonly demoControls = inject(DEMO_CONTROLS, { optional: true });

  protected readonly themeOptions: readonly {
    value: ThemePreference;
    label: MessageKey;
    hint: MessageKey | null;
  }[] = [
    { value: 'auto', label: 'settings.theme.auto', hint: 'settings.theme.auto.hint' },
    { value: 'light', label: 'settings.theme.light', hint: null },
    { value: 'dark', label: 'settings.theme.dark', hint: null },
  ];

  protected readonly warningsStatus = computed(() => {
    const status = this.official.bulletin().status;
    return msg(status === 'empty' ? 'settings.status.unavailable' : STATUS[status]);
  });

  protected readonly observationsStatus = computed(() => {
    const status = this.official.observations().status;
    return msg(status === 'empty' ? 'settings.status.noKey' : STATUS[status]);
  });

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }
}
