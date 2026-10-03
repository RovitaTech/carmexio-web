/**
 * Deep links from the mobile app → web routes (`/search?x` → `/autos?x`). The website
 * only sells, so links to the sell flow (app or old site content) go to the contact page.
 */
const APP_ROUTES: Record<string, string> = {
  '/search': '/autos',
  '/sell': '/contacto',
  '/vender': '/contacto',
  '/sucursales': '/contacto',
};

export interface WebLink {
  /** Set for links inside the site (use with routerLink + queryParams). */
  path?: string;
  query?: Record<string, string>;
  /** Set for absolute URLs (open with a plain href). */
  href?: string;
}

export function webLink(link: string | undefined): WebLink | null {
  if (!link?.trim()) return null;
  if (/^https?:\/\//i.test(link)) return { href: link };
  const [rawPath, qs = ''] = link.split('?');
  const path = APP_ROUTES[rawPath] ?? rawPath;
  return {
    path: path.startsWith('/') ? path : `/${path}`,
    query: Object.fromEntries(new URLSearchParams(qs)),
  };
}
