import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/cards', pathMatch: 'full' },
  { path: 'cards', loadComponent: () => import('./pages/cards/cards.component').then(m => m.CardsComponent) }
];
