import { webLink } from './links';

describe('webLink', () => {
  it('maps app deep links and keeps the query', () => {
    expect(webLink('/search?body=pickup')).toEqual({ path: '/autos', query: { body: 'pickup' } });
    expect(webLink('/sell')).toEqual({ path: '/vender', query: {} });
    expect(webLink('/ofertas')).toEqual({ path: '/ofertas', query: {} });
  });

  it('keeps absolute URLs as plain hrefs and ignores empty links', () => {
    expect(webLink('https://wa.me/52')).toEqual({ href: 'https://wa.me/52' });
    expect(webLink('  ')).toBeNull();
    expect(webLink(undefined)).toBeNull();
  });
});
