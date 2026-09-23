import { ListingQuery, applyListingFilter } from './listing-query';

/** Records the PostgREST calls instead of sending them. */
class RecordingQuery implements ListingQuery<RecordingQuery> {
  readonly calls: string[] = [];
  private push(call: string) {
    this.calls.push(call);
    return this;
  }
  eq(c: string, v: unknown) {
    return this.push(`eq ${c} ${v}`);
  }
  gte(c: string, v: unknown) {
    return this.push(`gte ${c} ${v}`);
  }
  lte(c: string, v: unknown) {
    return this.push(`lte ${c} ${v}`);
  }
  or(f: string) {
    return this.push(`or ${f}`);
  }
  order(c: string, o: { ascending: boolean }) {
    return this.push(`order ${c} ${o.ascending ? 'asc' : 'desc'}`);
  }
}

describe('applyListingFilter', () => {
  it('maps every filter to the API_NEEDED.md columns', () => {
    const q = applyListingFilter(new RecordingQuery(), {
      query: 'hilux',
      brand: 'Toyota',
      bodyType: 'pickup',
      fuelType: 'diesel',
      transmission: 'manual',
      city: 'CDMX',
      minPrice: 100000,
      maxPrice: 900000,
      minYear: 2018,
      maxYear: 2024,
      maxMileage: 80000,
      verifiedOnly: true,
      featuredOnly: true,
      sort: 'priceLow',
    });
    expect(q.calls).toEqual([
      'or brand.ilike.%hilux%,model.ilike.%hilux%,version.ilike.%hilux%',
      'eq brand Toyota',
      'eq body_type pickup',
      'eq fuel_type diesel',
      'eq transmission manual',
      'eq city CDMX',
      'gte price 100000',
      'lte price 900000',
      'gte year 2018',
      'lte year 2024',
      'lte mileage_km 80000',
      'eq is_verified true',
      'eq is_featured true',
      'order price asc',
      'order created_at desc',
    ]);
  });

  it('defaults to newest and strips PostgREST syntax from free text', () => {
    const q = applyListingFilter(new RecordingQuery(), { query: 'a,b)(c%' });
    expect(q.calls).toEqual([
      'or brand.ilike.%a b  c%,model.ilike.%a b  c%,version.ilike.%a b  c%',
      'order created_at desc',
    ]);
    expect(applyListingFilter(new RecordingQuery(), { query: ' ,() ' }).calls).toEqual([
      'order created_at desc',
    ]);
  });
});
