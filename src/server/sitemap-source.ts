// Active listings for sitemap.xml, read with the publishable key (RLS: public
// rows only) over PostgREST. Express-only: no Angular / supabase-js imports.
import { environment } from '../environments/environment';
import { SitemapCar } from './sitemap';

interface ListingRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  updated_at: string;
  inspection_score: number | null;
}

export async function activeListings(): Promise<SitemapCar[]> {
  const { url, publishableKey } = environment.supabase;
  if (!url || !publishableKey) return [];
  const query = new URLSearchParams({
    select: 'id,brand,model,year,updated_at,inspection_score',
    status: 'eq.active',
    order: 'updated_at.desc',
    limit: '50000', // sitemap protocol limit per file
  });
  const res = await fetch(`${url}/rest/v1/listings?${query}`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
  });
  if (!res.ok) throw new Error(`Sitemap listings: HTTP ${res.status}`);
  const rows = (await res.json()) as ListingRow[];
  return rows.map((l) => ({
    id: l.id,
    brand: l.brand,
    model: l.model,
    year: l.year,
    updatedAt: l.updated_at,
    hasInspection: l.inspection_score != null,
  }));
}
