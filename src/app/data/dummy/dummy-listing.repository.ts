// DELETE WHEN LIVE — in-memory catalog + listings (mirrors the Flutter mocks).
import {
  AppError,
  Car,
  CarFilter,
  InspectionReport,
  ListingDraft,
  OwnerStatusChange,
  Page,
} from '../../domain/models';
import { CatalogRepository, ListingRepository } from '../../domain/repositories';
import { Row, draftToRow, toBanner, toBrand, toCar, toInspection, toLocation } from '../mappers';
import { DummyDb, requireUser } from './dummy-db';

export const SORTS: Record<string, (a: Row, b: Row) => number> = {
  newest: (a, b) => b['created_at'].localeCompare(a['created_at']),
  priceLow: (a, b) => a['price'] - b['price'],
  priceHigh: (a, b) => b['price'] - a['price'],
  mileageLow: (a, b) => a['mileage_km'] - b['mileage_km'],
  yearNew: (a, b) => b['year'] - a['year'],
};

export class DummyCatalogRepository implements CatalogRepository {
  constructor(private readonly db: DummyDb) {}

  async banners() {
    await this.db.delay(0.5);
    return this.db.banners.map(toBanner);
  }

  async brands() {
    await this.db.delay(0.5);
    const active = this.db.listings.filter((l) => l['status'] === 'active');
    return this.db.brands.map((b) =>
      toBrand({ ...b, listings_count: active.filter((l) => l['brand'] === b['name']).length }),
    );
  }

  async locations() {
    await this.db.delay(0.4);
    return this.db.locations.map(toLocation);
  }
}

export class DummyListingRepository implements ListingRepository {
  constructor(private readonly db: DummyDb) {}

  private cars(rows: Row[]): Car[] {
    return rows.map((r) => toCar(this.db.withLocation(r)));
  }

  private get active(): Row[] {
    return this.db.listings.filter((l) => l['status'] === 'active');
  }

  async featured(limit = 10) {
    await this.db.delay();
    return this.cars(this.active.filter((l) => l['is_featured']).slice(0, limit));
  }

  async recent(limit = 10) {
    await this.db.delay();
    return this.cars([...this.active].sort(SORTS['newest']).slice(0, limit));
  }

  async search(f: CarFilter, page: number, pageSize: number): Promise<Page<Car>> {
    await this.db.delay();
    const q = f.query?.trim().toLowerCase() ?? '';
    const rows = this.active
      .filter((l) => {
        const text = `${l['brand']} ${l['model']} ${l['version'] ?? ''}`.toLowerCase();
        return (
          (!q || text.includes(q)) &&
          (!f.brand || l['brand'] === f.brand) &&
          (!f.bodyType || l['body_type'] === f.bodyType) &&
          (!f.fuelType || l['fuel_type'] === f.fuelType) &&
          (!f.transmission || l['transmission'] === f.transmission) &&
          (!f.city || l['city'] === f.city) &&
          (f.minPrice == null || l['price'] >= f.minPrice) &&
          (f.maxPrice == null || l['price'] <= f.maxPrice) &&
          (f.minYear == null || l['year'] >= f.minYear) &&
          (f.maxYear == null || l['year'] <= f.maxYear) &&
          (f.maxMileage == null || l['mileage_km'] <= f.maxMileage) &&
          (!f.verifiedOnly || l['is_verified']) &&
          (!f.featuredOnly || l['is_featured'])
        );
      })
      .sort(SORTS[f.sort ?? 'newest']);
    const items = this.cars(rows.slice(page * pageSize, (page + 1) * pageSize));
    return { items, page, hasMore: (page + 1) * pageSize < rows.length };
  }

  async byId(id: string) {
    await this.db.delay(0.6);
    const row = this.db.listing(id);
    if (!row) throw new AppError('Este auto ya no está publicado.', 'notFound');
    return toCar(this.db.withLocation(row));
  }

  async recordView(id: string) {
    const row = this.db.listing(id);
    if (row?.['status'] === 'active') row['views_count'] = (row['views_count'] ?? 0) + 1;
  }

  async similar(car: Car, limit = 8) {
    await this.db.delay();
    return this.cars(
      this.active
        .filter(
          (l) =>
            l['id'] !== car.id && (l['body_type'] === car.bodyType || l['brand'] === car.brand),
        )
        .slice(0, limit),
    );
  }

  async inspection(listingId: string): Promise<InspectionReport | null> {
    await this.db.delay(0.6);
    const row = this.db.inspections.find((r) => r['listing_id'] === listingId);
    return row ? toInspection(row) : null;
  }

  async mine() {
    await this.db.delay();
    const user = requireUser(this.db);
    return this.cars(this.db.listings.filter((l) => l['seller_id'] === user).sort(SORTS['newest']));
  }

  async uploadPhoto(_file: Blob, fileName: string) {
    await this.db.delay(2);
    // Dummy mode can't host files: keep the UI's local preview and store a stock photo.
    const pool = this.db.listings.flatMap((l) => l['images'] as string[]);
    return pool[Math.abs(hash(fileName)) % pool.length];
  }

  async create(draft: ListingDraft) {
    await this.db.delay(2);
    const now = new Date().toISOString();
    const location = this.db.location(draft.locationId);
    const row: Row = {
      ...draftToRow(draft),
      id: this.db.nextId('car'),
      seller_id: requireUser(this.db),
      city: location?.['city'] ?? '',
      status: 'pending',
      is_featured: false,
      is_verified: false,
      views_count: 0,
      favorites_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.db.listings.unshift(row);
    return toCar(this.db.withLocation(row));
  }

  async update(id: string, draft: ListingDraft) {
    await this.db.delay(1.5);
    const row = this.owned(id);
    Object.assign(row, draftToRow(draft), {
      status: 'pending',
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    });
    return toCar(this.db.withLocation(row));
  }

  /** Mirrors `guard_listing_fields`: only active → sold, or relist → pending. */
  async setStatus(id: string, status: OwnerStatusChange) {
    await this.db.delay(0.6);
    const row = this.owned(id);
    if (status === 'sold' && row['status'] !== 'active') {
      throw new AppError('Solo un anuncio publicado se puede marcar como vendido.', 'validation');
    }
    row['status'] = status;
    row['rejection_reason'] = null;
    row['updated_at'] = new Date().toISOString();
  }

  async remove(id: string) {
    await this.db.delay(0.6);
    const row = this.owned(id);
    this.db.listings.splice(this.db.listings.indexOf(row), 1);
  }

  private owned(id: string): Row {
    const row = this.db.listing(id);
    if (!row) throw new AppError('Anuncio no encontrado.', 'notFound');
    if (row['seller_id'] !== requireUser(this.db)) {
      throw new AppError('Solo puedes editar tus anuncios.', 'auth');
    }
    return row;
  }
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}
