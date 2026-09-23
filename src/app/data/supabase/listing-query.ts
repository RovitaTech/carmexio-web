import { CarFilter, SortOption } from '../../domain/models';

/** The subset of PostgREST's filter builder the listing search uses. */
export interface ListingQuery<Q> {
  eq(column: string, value: unknown): Q;
  gte(column: string, value: unknown): Q;
  lte(column: string, value: unknown): Q;
  or(filters: string): Q;
  order(column: string, options: { ascending: boolean }): Q;
}

const SORT_COLUMNS: Record<SortOption, [column: string, ascending: boolean]> = {
  newest: ['created_at', false],
  priceLow: ['price', true],
  priceHigh: ['price', false],
  mileageLow: ['mileage_km', true],
  yearNew: ['year', false],
};

/** Characters with meaning in PostgREST's `or=(…)` / `ilike` syntax. */
const RESERVED = /[,()"'\\%*:.]/g;

/**
 * Applies the search filter exactly as API_NEEDED.md §7 "Search" describes
 * (`ilike` brand/model/version, `eq` enums/city/flags, `gte/lte` ranges).
 * The caller adds `status = active` and the page range.
 */
export function applyListingFilter<Q extends ListingQuery<Q>>(query: Q, f: CarFilter): Q {
  let q = query;
  const text = f.query?.replace(RESERVED, ' ').trim();
  if (text) {
    q = q.or(['brand', 'model', 'version'].map((c) => `${c}.ilike.%${text}%`).join(','));
  }
  if (f.brand) q = q.eq('brand', f.brand);
  if (f.bodyType) q = q.eq('body_type', f.bodyType);
  if (f.fuelType) q = q.eq('fuel_type', f.fuelType);
  if (f.transmission) q = q.eq('transmission', f.transmission);
  if (f.city) q = q.eq('city', f.city);
  if (f.minPrice != null) q = q.gte('price', f.minPrice);
  if (f.maxPrice != null) q = q.lte('price', f.maxPrice);
  if (f.minYear != null) q = q.gte('year', f.minYear);
  if (f.maxYear != null) q = q.lte('year', f.maxYear);
  if (f.maxMileage != null) q = q.lte('mileage_km', f.maxMileage);
  if (f.verifiedOnly) q = q.eq('is_verified', true);
  if (f.featuredOnly) q = q.eq('is_featured', true);
  const [column, ascending] = SORT_COLUMNS[f.sort ?? 'newest'];
  q = q.order(column, { ascending });
  // Stable pagination when many rows share the sort value.
  return column === 'created_at' ? q : q.order('created_at', { ascending: false });
}
