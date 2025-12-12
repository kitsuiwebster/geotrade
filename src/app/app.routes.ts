import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/quizzes', pathMatch: 'full' },
  { path: 'quizzes', loadComponent: () => import('./pages/quizzes/quizzes.component').then(m => m.QuizzesComponent) },
  { path: 'my-cards', loadComponent: () => import('./pages/my-cards/my-cards.component').then(m => m.MyCardsComponent) },
  { path: 'all-cards', loadComponent: () => import('./pages/all-cards/all-cards.component').then(m => m.AllCardsComponent) },
  { path: 'exchange', loadComponent: () => import('./pages/exchange/exchange.component').then(m => m.ExchangeComponent) },
  { path: 'market', loadComponent: () => import('./pages/market/market.component').then(m => m.MarketComponent) },
  { path: 'account', loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent) },
  { path: 'friends', loadComponent: () => import('./pages/friends/friends.component').then(m => m.FriendsComponent) },
  { path: 'user/:id', loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent) },
  // Legacy route redirect
  { path: 'cards', redirectTo: '/all-cards', pathMatch: 'full' }
];
