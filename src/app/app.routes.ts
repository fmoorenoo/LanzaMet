import { Routes } from '@angular/router';

const BRAND = '¿Qué tal hoy?';

export const routes: Routes = [
  {
    path: '',
    title: `Hoy en Lanzarote · ${BRAND}`,
    loadComponent: () => import('./features/today/today.page').then((m) => m.TodayPage),
  },
  {
    path: 'zonas',
    title: `Zonas · ${BRAND}`,
    loadComponent: () => import('./features/zones/zones.page').then((m) => m.ZonesPage),
  },
  {
    path: 'mar',
    title: `Mar y mareas · ${BRAND}`,
    loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
  },
  {
    path: 'donde-ir',
    title: `¿Dónde ir hoy? · ${BRAND}`,
    loadComponent: () => import('./features/plans/plans.page').then((m) => m.PlansPage),
  },
  { path: '**', redirectTo: '' },
];
