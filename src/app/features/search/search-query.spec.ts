import { convertToParamMap } from '@angular/router';
import { CarFilter } from '../../domain/models';
import { activeFilterCount, filterToParams, parseFilter } from './search-query';

describe('search query', () => {
  it('uses the same keys as the app deep links', () => {
    const filter = parseFilter(
      convertToParamMap({
        q: 'tacoma',
        body: 'pickup',
        city: 'Tijuana',
        maxPrice: '800000',
        verified: 'true',
        sort: 'priceLow',
      }),
    );
    expect(filter).toMatchObject({
      query: 'tacoma',
      bodyType: 'pickup',
      city: 'Tijuana',
      maxPrice: 800000,
      verifiedOnly: true,
      sort: 'priceLow',
    });
  });

  it('round-trips through query params and drops empty values', () => {
    const filter: CarFilter = { brand: 'Toyota', minYear: 2018, sort: 'newest' };
    const params = filterToParams(filter);
    expect(params['brand']).toBe('Toyota');
    expect(params['sort']).toBeNull();
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
    expect(parseFilter(convertToParamMap(clean))).toMatchObject({ brand: 'Toyota', minYear: 2018 });
  });

  it('counts refinements but not the text query or sort', () => {
    expect(activeFilterCount({ query: 'x', sort: 'priceHigh' })).toBe(0);
    expect(activeFilterCount({ brand: 'RAM', minPrice: 1, maxPrice: 2, verifiedOnly: true })).toBe(
      3,
    );
  });

  it("maps ?stock=local|pickup to this site's branch and back", () => {
    const local = parseFilter(convertToParamMap({ stock: 'local' }), 'loc-gto');
    expect(local).toMatchObject({ locationId: 'loc-gto', excludeLocationId: undefined });
    const pickup = parseFilter(convertToParamMap({ stock: 'pickup', body: 'suv' }), 'loc-gto');
    expect(pickup).toMatchObject({ excludeLocationId: 'loc-gto', bodyType: 'suv' });
    expect(filterToParams(pickup, 'loc-gto')['stock']).toBe('pickup');
    expect(filterToParams(local, 'loc-gto')['stock']).toBe('local');
    expect(filterToParams({ sort: 'newest' }, 'loc-gto')['stock']).toBeNull();
  });
});
