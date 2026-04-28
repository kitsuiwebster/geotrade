import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/quizzes', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'quizzes', loadComponent: () => import('./pages/quizzes/quizzes.component').then(m => m.QuizzesComponent) },
  { path: 'all-cards', canActivate: [adminGuard], loadComponent: () => import('./pages/all-cards/all-cards.component').then(m => m.AllCardsComponent) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'my-cards', canActivate: [authGuard], loadComponent: () => import('./pages/my-cards/my-cards.component').then(m => m.MyCardsComponent) },
  { path: 'exchange', canActivate: [authGuard], loadComponent: () => import('./pages/exchange/exchange.component').then(m => m.ExchangeComponent) },
  { path: 'market', canActivate: [authGuard], loadComponent: () => import('./pages/market/market.component').then(m => m.MarketComponent) },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent) },
  { path: 'friends', canActivate: [authGuard], loadComponent: () => import('./pages/friends/friends.component').then(m => m.FriendsComponent) },
  { path: 'user/:id', loadComponent: () => import('./pages/user-profile/user-profile.component').then(m => m.UserProfileComponent) },
  { path: 'cards', redirectTo: '/all-cards', pathMatch: 'full' }
];
