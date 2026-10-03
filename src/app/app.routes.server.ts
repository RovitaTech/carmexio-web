import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Public pages are server-rendered per request for SEO and fresh data (cars,
 * banners and texts change from /admin without a redeploy); signed-in areas
 * render on the client (the session lives in the browser).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'como-funciona', renderMode: RenderMode.Server },
  { path: 'contacto', renderMode: RenderMode.Server },
  { path: 'financiamiento', renderMode: RenderMode.Server },
  { path: 'nosotros', renderMode: RenderMode.Server },
  { path: 'ayuda', renderMode: RenderMode.Server },
  { path: 'autos', renderMode: RenderMode.Server },
  { path: 'ofertas', renderMode: RenderMode.Server },
  { path: 'autos/:slug', renderMode: RenderMode.Server },
  { path: 'autos/:slug/inspeccion', renderMode: RenderMode.Server },
  { path: 'entrar', renderMode: RenderMode.Client },
  { path: 'registro', renderMode: RenderMode.Client },
  { path: 'recuperar', renderMode: RenderMode.Client },
  { path: 'nueva-contrasena', renderMode: RenderMode.Client },
  { path: 'vender', renderMode: RenderMode.Client },
  { path: 'vender/:id/editar', renderMode: RenderMode.Client },
  { path: 'mis-anuncios', renderMode: RenderMode.Client },
  { path: 'favoritos', renderMode: RenderMode.Client },
  { path: 'mensajes', renderMode: RenderMode.Client },
  { path: 'mensajes/:id', renderMode: RenderMode.Client },
  { path: 'cuenta', renderMode: RenderMode.Client },
  { path: 'staff', renderMode: RenderMode.Client },
  { path: 'staff/**', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
