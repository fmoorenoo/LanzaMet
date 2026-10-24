import { Routes } from '@angular/router';
import { MessageKey } from './core/i18n/i18n.model';

/** Titles are message keys; I18nTitleStrategy writes them in the visitor's language. */
const title = (key: MessageKey) => key;

export const routes: Routes = [
  {
    path: '',
    title: title('route.today'),
    loadComponent: () => import('./features/today/today.page').then((m) => m.TodayPage),
  },
  {
    path: 'zonas',
    title: title('route.zones'),
    loadComponent: () => import('./features/zones/zones.page').then((m) => m.ZonesPage),
  },
  {
    path: 'mar',
    title: title('route.sea'),
    loadComponent: () => import('./features/sea/sea.page').then((m) => m.SeaPage),
  },
  {
    path: 'donde-ir',
    title: title('route.plans'),
    loadComponent: () => import('./features/plans/plans.page').then((m) => m.PlansPage),
  },
  {
    path: 'mejorar',
    title: title('route.feedback'),
    loadComponent: () => import('./features/feedback/feedback.page').then((m) => m.FeedbackPage),
  },
  {
    path: 'legal',
    title: title('route.legal'),
    loadComponent: () => import('./features/legal/legal.page').then((m) => m.LegalPage),
  },
  { path: '**', redirectTo: '' },
];
