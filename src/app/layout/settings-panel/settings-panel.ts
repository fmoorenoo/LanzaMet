import { NgComponentOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DATA_MODE } from '../../core/data/http/data-config';
import { MessageKey } from '../../core/i18n/i18n.model';
import { PathPipe } from '../../core/i18n/path.pipe';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { InstallStore } from '../../core/pwa/install.store';
import { ThemePreference, ThemeStore } from '../../core/state/theme.store';
import { Icon } from '../../shared/ui/icon/icon';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { InstallOption } from '../install/install-option';
import { LanguageSelector } from '../language-selector/language-selector';
import { UiStore } from '../ui.store';
import { DEMO_CONTROLS } from './demo-controls.token';

/** Language, appearance, installing the web, the way to the legal page and — in the demo build — the demo's controls. */
@Component({
  selector: 'lm-settings-panel',
  imports: [
    Sheet,
    NgComponentOutlet,
    RouterLink,
    Icon,
    TranslatePipe,
    PathPipe,
    LanguageSelector,
    InstallOption,
  ],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  protected readonly ui = inject(UiStore);
  protected readonly theme = inject(ThemeStore);
  protected readonly install = inject(InstallStore);

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

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }
}
