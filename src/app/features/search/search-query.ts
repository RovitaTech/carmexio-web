import { ParamMap, Params } from '@angular/router';
import { BodyType, CarFilter, FuelType, SortOption, Transmission } from '../../domain/models';

/**
 * Same query keys as the Flutter deep links (SearchQueryParser):
 * q, brand, body, fuel, transmission, city, minPrice, maxPrice, minYear,
 * maxYear, maxKm, verified, featured, sort.
 *
 * Web only: `stock=local|pickup` splits the catalog by this site's branch — cars at
 * the branch, or cars at the other branches that can be picked up here.
 */
export type Stock = 'local' | 'pickup';

export function stockOf(f: CarFilter, branchId?: string): Stock | undefined {
  if (!branchId) return undefined;
  if (f.locationId === branchId) return 'local';
  return f.excludeLocationId === branchId ? 'pickup' : undefined;
}

export function parseFilter(params: ParamMap, branchId?: string): CarFilter {
  const num = (key: string) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isFinite(value) ? value : undefined;
  };
  return {
    query: params.get('q') ?? undefined,
    brand: params.get('brand') ?? undefined,
    bodyType: (params.get('body') as BodyType) ?? undefined,
    fuelType: (params.get('fuel') as FuelType) ?? undefined,
    transmission: (params.get('transmission') as Transmission) ?? undefined,
    city: params.get('city') ?? undefined,
    locationId: params.get('stock') === 'local' ? branchId : undefined,
    excludeLocationId: params.get('stock') === 'pickup' ? branchId : undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    minYear: num('minYear'),
    maxYear: num('maxYear'),
    maxMileage: num('maxKm'),
    verifiedOnly: params.get('verified') === 'true',
    featuredOnly: params.get('featured') === 'true',
    sort: (params.get('sort') as SortOption) ?? 'newest',
  };
}

export function filterToParams(f: CarFilter, branchId?: string): Params {
  const params: Params = {
    stock: stockOf(f, branchId) ?? null,
    q: f.query || null,
    brand: f.brand ?? null,
    body: f.bodyType ?? null,
    fuel: f.fuelType ?? null,
    transmission: f.transmission ?? null,
    city: f.city ?? null,
    minPrice: f.minPrice ?? null,
    maxPrice: f.maxPrice ?? null,
    minYear: f.minYear ?? null,
    maxYear: f.maxYear ?? null,
    maxKm: f.maxMileage ?? null,
    verified: f.verifiedOnly ? 'true' : null,
    featured: f.featuredOnly ? 'true' : null,
    sort: f.sort && f.sort !== 'newest' ? f.sort : null,
  };
  return params;
}

/** Number of active refinements (excludes text query and sort). */
export function activeFilterCount(f: CarFilter): number {
  return [
    f.brand,
    f.bodyType,
    f.fuelType,
    f.transmission,
    f.city,
    f.minPrice ?? f.maxPrice,
    f.minYear ?? f.maxYear,
    f.maxMileage,
    f.verifiedOnly || undefined,
    f.featuredOnly || undefined,
  ].filter((v) => v !== undefined && v !== null).length;
}
