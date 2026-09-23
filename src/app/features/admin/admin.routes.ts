import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/guards';

/** `/admin/**` — site content management. Client-rendered, role `admin` only. */
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
        path: 'textos',
        title: 'Textos del sitio · Admin Carmexio',
        loadComponent: () => import('./texts/texts.page').then((m) => m.TextsPage),
      },
    ],
  },
];
