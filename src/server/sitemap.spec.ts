import { DummyDb } from '../app/data/dummy/dummy-db';
import { DummyListingRepository } from '../app/data/dummy/dummy-listing.repository';
import { listingEntries, renderSitemap } from './sitemap';

describe('sitemap', () => {
  it('lists static pages plus every active car and its inspection report', async () => {
    const entries = await listingEntries(new DummyListingRepository(new DummyDb(0)));
    const xml = renderSitemap('https://carmexio.mx', entries);
    expect(xml).toContain('<loc>https://carmexio.mx</loc>');
    expect(xml).toContain('<loc>https://carmexio.mx/sucursales</loc>');
    expect(xml).toMatch(/<loc>https:\/\/carmexio\.mx\/autos\/car-1--[a-z0-9-]+<\/loc>/);
    expect(xml).toContain('/inspeccion</loc>');
    expect(entries.length).toBeGreaterThan(20);
  });

  it('escapes XML', () => {
    expect(renderSitemap('https://x.mx?a=1&b=2', [])).toContain('https://x.mx?a=1&amp;b=2');
  });
});
