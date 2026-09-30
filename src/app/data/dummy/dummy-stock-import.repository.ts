// DELETE WHEN LIVE — in-memory stand-in for POST /v1/admin/listings/import.
import { StockImportRepository } from '../../domain/repositories';
import { StockImportOutcome, StockItem } from '../../domain/stock-import';
import { Row } from '../mappers';
import { DummyDb, requireAdmin } from './dummy-db';

/** Photos are used as-is (no copy); re-importing the same catalog id updates the car. */
export class DummyStockImportRepository implements StockImportRepository {
  constructor(private readonly db: DummyDb) {}

  async importBatch(items: readonly StockItem[]): Promise<StockImportOutcome[]> {
    await this.db.delay(0.5);
    const adminId = requireAdmin(this.db);
    return items.map((item) => {
      const location = this.db.location(item.locationId);
      if (!location) return failed(item, 'BRANCH_NOT_FOUND', 'Unknown branch (locationId).');
      const existing = this.db.listings.find(
        (l) => l['source'] === 'carmexio' && l['external_id'] === item.externalId,
      );
      const now = new Date().toISOString();
      const row: Row = {
        ...(existing ?? {
          id: this.db.nextId('stock'),
          seller_id: adminId,
          created_at: now,
          views_count: 0,
          favorites_count: 0,
          features: [],
          is_featured: false,
          is_verified: false,
        }),
        source: 'carmexio',
        external_id: item.externalId,
        location_id: item.locationId,
        city: location['city'],
        brand: item.brand,
        model: item.model,
        version: item.version,
        year: item.year,
        price: item.price,
        mileage_km: item.mileageKm,
        fuel_type: item.fuelType,
        transmission: item.transmission,
        body_type: item.bodyType,
        exterior_color: item.exteriorColor,
        description: item.description,
        images: item.imageUrls,
        image_angles: [],
        status: item.sold ? 'sold' : 'active',
        updated_at: now,
      };
      if (existing) Object.assign(existing, row);
      else this.db.listings.unshift(row);
      return {
        externalId: item.externalId,
        status: existing ? 'updated' : 'created',
        listingId: row['id'],
        photos: { copied: item.imageUrls.length, failed: 0, reused: 0 },
        error: null,
      };
    });
  }
}

const failed = (item: StockItem, code: string, message: string): StockImportOutcome => ({
  externalId: item.externalId,
  status: 'failed',
  listingId: null,
  photos: { copied: 0, failed: 0, reused: 0 },
  error: { code, message },
});
