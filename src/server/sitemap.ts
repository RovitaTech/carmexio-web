// Express-only: keep this file free of app/domain imports (they need $localize).
import { carSlug } from '../app/core/utils/format';

/** Public, indexable pages that don't depend on data. */
const STATIC_PATHS = ['', '/autos', '/ofertas', '/sucursales', '/como-funciona'];
/** Every page exists in Spanish (`/…`) and English (`/en/…`). */
const LANG_PREFIXES = ['', '/en'];

/** The few listing fields the sitemap needs (active listings only). */
export interface SitemapCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  updatedAt: string;
  hasInspection: boolean;
}

interface SitemapEntry {
  path: string;
  lastmod?: string;
}

export function listingEntries(cars: readonly SitemapCar[]): SitemapEntry[] {
  return cars.flatMap((car) => {
    const path = `/autos/${carSlug(car)}`;
    const lastmod = car.updatedAt.slice(0, 10);
    return car.hasInspection
      ? [
          { path, lastmod },
          { path: `${path}/inspeccion`, lastmod },
        ]
      : [{ path, lastmod }];
  });
}

export function renderSitemap(siteUrl: string, listings: readonly SitemapEntry[]): string {
  const entries = [...STATIC_PATHS.map((path) => ({ path }) as SitemapEntry), ...listings];
  const urls = entries
    .flatMap((e) =>
      LANG_PREFIXES.map((prefix) => {
        const loc = siteUrl + prefix + e.path;
        return `  <url><loc>${escapeXml(loc || siteUrl)}</loc>${
          e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''
        }</url>`;
      }),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(text: string): string {
  return text.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!,
  );
}
