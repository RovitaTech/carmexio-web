import { Routes } from '@angular/router';
import { StaffScope } from './staff-scope.store';

/** `/staff/**` — guarded by `staffGuard` in app.routes.ts; rendered on the client. */
export const STAFF_ROUTES: Routes = [
  {
    path: '',
    providers: [StaffScope],
    loadComponent: () => import('./staff-shell').then((m) => m.StaffShell),
    children: [
      {
        path: '',
        title: 'Panel · Staff Carmexio',
        loadComponent: () => import('./dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'revision',
        title: 'Revisión · Staff Carmexio',
        loadComponent: () => import('./review-queue.page').then((m) => m.ReviewQueuePage),
      },
      {
        path: 'revision/:id',
        title: 'Revisar anuncio · Staff Carmexio',
        loadComponent: () => import('./review-detail.page').then((m) => m.ReviewDetailPage),
      },
      {
        path: 'anuncios',
        title: 'Anuncios · Staff Carmexio',
        loadComponent: () => import('./listings.page').then((m) => m.StaffListingsPage),
      },
      {
        path: 'inspecciones/:id',
        title: 'Inspección · Staff Carmexio',
        loadComponent: () =>
          import('./inspection-editor/inspection-editor.page').then((m) => m.InspectionEditorPage),
      },
    ],
  },
];
