// DUMMY: active listings from the demo seed. When live, replace with a REST call:
// GET {SUPABASE_URL}/rest/v1/listings?status=eq.active&select=id,brand,model,year,updated_at,inspection_score
import seed from '../app/data/dummy/seed.json';
import { SitemapCar } from './sitemap';

interface SeedListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  updated_at?: string;
  inspection_score?: number | null;
}

export async function activeListings(): Promise<SitemapCar[]> {
  return (seed.listings as SeedListing[])
    .filter((l) => l.status === 'active')
    .map((l) => ({
      id: l.id,
      brand: l.brand,
      model: l.model,
      year: l.year,
      updatedAt: l.updated_at ?? l.created_at,
      hasInspection: l.inspection_score != null,
    }));
}
