import { Routes } from '@angular/router';
import { adminGuard, superAdminGuard } from '../../core/auth/guards';

/**
 * `/admin/**` — site content (super admins + branch admins); users and stock import are
 * super-admin only. Client-rendered.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'entrar',
    title: 'Acceso administrador · Carmexio',
    loadComponent: () => import('./admin-login.page').then((m) => m.AdminLoginPage),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        title: 'Resumen · Admin Carmexio',
        loadComponent: () => import('./dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'medios',
        title: 'Medios · Admin Carmexio',
        loadComponent: () => import('./media/media.page').then((m) => m.MediaPage),
      },
      {
        path: 'anuncios',
        title: 'Anuncios · Admin Carmexio',
        loadComponent: () => import('./ads/ads.page').then((m) => m.AdsPage),
      },
      {
        path: 'anuncios/:id',
        title: 'Editar anuncio · Admin Carmexio',
        loadComponent: () => import('./ads/ad-editor.page').then((m) => m.AdEditorPage),
      },
      {
        path: 'avisos',
        title: 'Avisos · Admin Carmexio',
        loadComponent: () => import('./alerts/alerts.page').then((m) => m.AlertsPage),
      },
      {
        path: 'ofertas',
        title: 'Ofertas · Admin Carmexio',
        loadComponent: () => import('./offers/offers.page').then((m) => m.OffersPage),
      },
      {
        path: 'ofertas/:id',
        title: 'Editar oferta · Admin Carmexio',
        loadComponent: () => import('./offers/offer-editor.page').then((m) => m.OfferEditorPage),
      },
      {
        path: 'importar',
        canActivate: [superAdminGuard],
        title: 'Importar autos · Admin Carmexio',
        loadComponent: () => import('./import/import.page').then((m) => m.ImportPage),
      },
      {
        path: 'usuarios',
        canActivate: [superAdminGuard],
        title: 'Usuarios · Admin Carmexio',
        loadComponent: () => import('./users/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'textos',
        title: 'Textos del sitio · Admin Carmexio',
        loadComponent: () => import('./texts/texts.page').then((m) => m.TextsPage),
      },
    ],
  },
];
