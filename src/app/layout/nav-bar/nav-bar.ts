import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icons';
import { BrandMark } from '../brand-mark/brand-mark';
import { UiStore } from '../ui.store';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}

/** Bottom tab bar on phones; a vertical rail with the brand on wide screens. */
@Component({
  selector: 'qth-nav-bar',
  imports: [RouterLink, RouterLinkActive, Icon, BrandMark],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  protected readonly ui = inject(UiStore);

  protected readonly items: readonly NavItem[] = [
    { path: '/', label: 'Hoy', icon: 'today' },
    { path: '/zonas', label: 'Zonas', icon: 'zones' },
    { path: '/mar', label: 'Mar', icon: 'sea' },
    { path: '/donde-ir', label: 'Dónde ir', icon: 'plans' },
  ];
}
