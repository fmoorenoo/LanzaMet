import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DATA_MODE } from '../../core/data/http/data-config';
import { OfficialStore } from '../../core/state/official.store';
import { ThemePreference, ThemeStore } from '../../core/state/theme.store';
import { Sheet } from '../../shared/ui/sheet/sheet';
import { UiStore } from '../ui.store';
import { DEMO_CONTROLS } from './demo-controls.token';

/** Appearance, where the data comes from, and — in the demo build — the demo's controls. */
@Component({
  selector: 'qth-settings-panel',
  imports: [Sheet, NgComponentOutlet],
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
    label: string;
    hint: string;
  }[] = [
    {
      value: 'auto',
      label: 'Según la hora',
      hint: 'De día claro, de noche oscuro, con el sol de la zona.',
    },
    { value: 'light', label: 'Siempre claro', hint: '' },
    { value: 'dark', label: 'Siempre oscuro', hint: '' },
  ];

  protected readonly warningsStatus = computed(() => {
    const state = this.official.bulletin();
    if (state.status === 'ready') return 'Conectado';
    if (state.status === 'error') return 'Sin conexión ahora';
    if (state.status === 'empty') return 'No disponible en esta instalación';
    return 'Comprobando…';
  });

  protected readonly observationsStatus = computed(() => {
    const state = this.official.observations();
    if (state.status === 'ready') return 'Conectado';
    if (state.status === 'error') return 'Sin conexión ahora';
    if (state.status === 'empty') return 'Pendiente de credenciales de AEMET';
    return 'Comprobando…';
  });

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }
}
