import { ParamMap, Params } from '@angular/router';
import { BodyType, CarFilter, FuelType, SortOption, Transmission } from '../../domain/models';

/**
 * Same query keys as the Flutter deep links (SearchQueryParser):
 * q, brand, body, fuel, transmission, city, minPrice, maxPrice, minYear,
 * maxYear, maxKm, verified, featured, sort.
 */
export function parseFilter(params: ParamMap): CarFilter {
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

export function filterToParams(f: CarFilter): Params {
  const params: Params = {
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
