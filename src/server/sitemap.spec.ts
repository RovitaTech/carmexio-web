import { activeListings } from './sitemap-source';
import { listingEntries, renderSitemap } from './sitemap';

describe('sitemap', () => {
  it('lists static pages and every active car, in Spanish and English', async () => {
    const entries = listingEntries(await activeListings());
    const xml = renderSitemap('https://carmexio.mx', entries);
    expect(xml).toContain('<loc>https://carmexio.mx</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/en</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/ofertas</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/en/sucursales</loc>');
    expect(xml).toMatch(/<loc>https:\/\/carmexio\.mx\/autos\/car-1--[a-z0-9-]+<\/loc>/);
    expect(xml).toMatch(/<loc>https:\/\/carmexio\.mx\/en\/autos\/car-1--[a-z0-9-]+\/inspeccion<\/loc>/);
    expect(entries.length).toBeGreaterThan(20);
    expect(xml).not.toContain('car-26'); // pending ad
  });

  it('escapes XML', () => {
    expect(renderSitemap('https://x.mx?a=1&b=2', [])).toContain('https://x.mx?a=1&amp;b=2');
  });
});
