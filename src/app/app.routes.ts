import { Routes } from '@angular/router';
import { authGuard, staffGuard } from './core/auth/guards';

/** Spanish public URLs; every feature is lazy-loaded. */
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage) },
  {
    path: 'autos',
    loadComponent: () => import('./features/search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'autos/:slug',
    loadComponent: () =>
      import('./features/car-details/car-details.page').then((m) => m.CarDetailsPage),
  },
  {
    path: 'autos/:slug/inspeccion',
    loadComponent: () =>
      import('./features/inspection/inspection.page').then((m) => m.InspectionPage),
  },
  {
    path: 'sucursales',
    loadComponent: () => import('./features/showrooms/showrooms.page').then((m) => m.ShowroomsPage),
  },
  {
    path: 'como-funciona',
    loadComponent: () => import('./features/static/static.pages').then((m) => m.HowItWorksPage),
  },
  {
    path: 'entrar',
    loadComponent: () => import('./features/auth/auth.pages').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/auth.pages').then((m) => m.RegisterPage),
  },
  {
    path: 'recuperar',
    loadComponent: () => import('./features/auth/auth.pages').then((m) => m.ResetPage),
  },
  {
    path: 'vender',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sell/sell.page').then((m) => m.SellPage),
  },
  {
    path: 'vender/:id/editar',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sell/sell.page').then((m) => m.SellPage),
  },
  {
    path: 'mis-anuncios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/my-ads/my-ads.page').then((m) => m.MyAdsPage),
  },
  {
    path: 'favoritos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/favorites/favorites.page').then((m) => m.FavoritesPage),
  },
  {
    path: 'mensajes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chats.page').then((m) => m.ChatsPage),
  },
  {
    path: 'mensajes/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chats.page').then((m) => m.ChatsPage),
  },
  {
    path: 'cuenta',
    loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'staff',
    canActivate: [staffGuard],
    loadComponent: () => import('./features/staff/staff.page').then((m) => m.StaffPage),
  },
  {
    path: '**',
    loadComponent: () => import('./features/static/static.pages').then((m) => m.NotFoundPage),
  },
];
