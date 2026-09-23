import { carSlug } from '../app/core/utils/format';
import { Car } from '../app/domain/models';
import { ListingRepository } from '../app/domain/repositories';

/** Public, indexable pages that don't depend on data. */
const STATIC_PATHS = ['', '/autos', '/sucursales', '/como-funciona'];
const PAGE_SIZE = 100;
const MAX_PAGES = 500; // 50k URLs — the sitemap protocol's limit per file.

interface SitemapEntry {
  path: string;
  lastmod?: string;
}

/** Every active listing (and its inspection report when it has one). */
export async function listingEntries(repo: Pick<ListingRepository, 'search'>) {
  const entries: SitemapEntry[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await repo.search({ sort: 'newest' }, page, PAGE_SIZE);
    entries.push(...result.items.flatMap(carEntries));
    if (!result.hasMore) break;
  }
  return entries;
}

function carEntries(car: Car): SitemapEntry[] {
  const path = `/autos/${carSlug(car)}`;
  const lastmod = car.updatedAt.slice(0, 10);
  return car.inspectionScore !== undefined
    ? [
        { path, lastmod },
        { path: `${path}/inspeccion`, lastmod },
      ]
    : [{ path, lastmod }];
}

export function renderSitemap(siteUrl: string, listings: SitemapEntry[]): string {
  const urls = [...STATIC_PATHS.map((path) => ({ path })), ...listings]
    .map(
      (e: SitemapEntry) =>
        `  <url><loc>${escapeXml(siteUrl + e.path)}</loc>${
          e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''
        }</url>`,
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
