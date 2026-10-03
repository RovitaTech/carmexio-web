import { activeListings } from './sitemap-source';
import { SitemapCar, listingEntries, renderSitemap } from './sitemap';

const cars: SitemapCar[] = [
  {
    id: 'car-1',
    brand: 'RAM',
    model: '1500',
    year: 2022,
    updatedAt: '2026-09-23T08:08:58Z',
    hasInspection: true,
  },
  {
    id: 'car-2',
    brand: 'Ford',
    model: 'Lobo',
    year: 2021,
    updatedAt: '2026-09-22T08:08:58Z',
    hasInspection: false,
  },
];

describe('sitemap', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists static pages and every active car, in Spanish and English', () => {
    const entries = listingEntries(cars);
    const xml = renderSitemap('https://carmexio.mx', entries);
    expect(xml).toContain('<loc>https://carmexio.mx</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/en</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/ofertas</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/en/contacto</loc>');
    expect(xml).toMatch(/<loc>https:\/\/carmexio\.mx\/autos\/car-1--[a-z0-9-]+<\/loc>/);
    expect(xml).toMatch(
      /<loc>https:\/\/carmexio\.mx\/en\/autos\/car-1--[a-z0-9-]+\/inspeccion<\/loc>/,
    );
    expect(xml).not.toMatch(/car-2--[a-z0-9-]+\/inspeccion/); // no report, no report page
    expect(entries).toHaveLength(3);
  });

  it('reads active listings from Supabase with the publishable key', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'car-1',
            brand: 'RAM',
            model: '1500',
            year: 2022,
            updated_at: '2026-09-23',
            inspection_score: 9.2,
          },
          {
            id: 'car-2',
            brand: 'Ford',
            model: 'Lobo',
            year: 2021,
            updated_at: '2026-09-22',
            inspection_score: null,
          },
        ]),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const result = await activeListings();
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('/rest/v1/listings?');
    expect(String(url)).toContain('status=eq.active');
    expect(init.headers.apikey).toMatch(/^sb_publishable_/);
    expect(result.map((c) => [c.id, c.hasInspection])).toEqual([
      ['car-1', true],
      ['car-2', false],
    ]);
  });

  it('escapes XML', () => {
    expect(renderSitemap('https://x.mx?a=1&b=2', [])).toContain('https://x.mx?a=1&amp;b=2');
  });
});
