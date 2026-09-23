import { SupabaseClient } from '@supabase/supabase-js';
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
import { applyListingFilter } from './listing-query';
import { LISTING_IMAGES_BUCKET, LISTING_SELECT } from './supabase-constants';
import { check, toAppError, unwrap } from './supabase-errors';

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async banners() {
    const rows = unwrap(await this.db.from('banners').select('*').order('sort_order'));
    return rows.map(toBanner);
  }

  async brands() {
    const rows = unwrap(await this.db.from('brands').select('*').order('sort_order'));
    return rows.map(toBrand);
  }

  async locations() {
    const rows = unwrap(await this.db.from('locations').select('*').order('sort_order'));
    return rows.map(toLocation);
  }
}

export class SupabaseListingRepository implements ListingRepository {
  constructor(private readonly db: SupabaseClient) {}

  private get listings() {
    return this.db.from('listings');
  }

  private active() {
    return this.listings.select(LISTING_SELECT).eq('status', 'active');
  }

  async featured(limit = 10) {
    const rows = unwrap(
      await this.active()
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit),
    );
    return rows.map(toCar);
  }

  async recent(limit = 10) {
    const rows = unwrap(await this.active().order('created_at', { ascending: false }).limit(limit));
    return rows.map(toCar);
  }

  async search(filter: CarFilter, page: number, pageSize: number): Promise<Page<Car>> {
    const from = page * pageSize;
    // One extra row tells us whether another page exists without a count query.
    const rows = unwrap(
      await applyListingFilter(this.active(), filter).range(from, from + pageSize),
    );
    return {
      items: rows.slice(0, pageSize).map(toCar),
      page,
      hasMore: rows.length > pageSize,
    };
  }

  async byId(id: string) {
    const { data, error } = await this.listings.select(LISTING_SELECT).eq('id', id).maybeSingle();
    if (error) throw toAppError(error);
    if (!data) throw new AppError('Este auto ya no está publicado.', 'notFound');
    return toCar(data);
  }

  async recordView(id: string) {
    check(await this.db.rpc('increment_listing_views', { listing_id: id }));
  }

  async similar(car: Car, limit = 8) {
    const rows = unwrap(
      await this.active()
        .neq('id', car.id)
        .or(`body_type.eq.${car.bodyType},brand.eq."${car.brand.replace(/"/g, '')}"`)
        .order('created_at', { ascending: false })
        .limit(limit),
    );
    return rows.map(toCar);
  }

  async inspection(listingId: string): Promise<InspectionReport | null> {
    const { data, error } = await this.db
      .from('inspection_reports')
      .select('*')
      .eq('listing_id', listingId)
      .maybeSingle();
    if (error) throw toAppError(error);
    return data ? toInspection(data) : null;
  }

  async mine() {
    const userId = await this.userId();
    const rows = unwrap(
      await this.listings
        .select(LISTING_SELECT)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false }),
    );
    return rows.map(toCar);
  }

  /** `listing-images/<uid>/<timestamp>-<name>` — uploaded the moment it's captured. */
  async uploadPhoto(file: Blob, fileName: string) {
    const userId = await this.userId();
    const path = `${userId}/${Date.now()}-${fileName.replace(/[^\w.-]/g, '_')}`;
    const bucket = this.db.storage.from(LISTING_IMAGES_BUCKET);
    const { error } = await bucket.upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
    if (error) throw toAppError(error);
    return bucket.getPublicUrl(path).data.publicUrl;
  }

  async create(draft: ListingDraft) {
    const row: Row = { ...draftToRow(draft), seller_id: await this.userId() };
    // `guard_listing_fields` forces status = pending and clears staff-only fields.
    return toCar(unwrap(await this.listings.insert(row).select(LISTING_SELECT).single()));
  }

  async update(id: string, draft: ListingDraft) {
    // The trigger sends any content edit back to `pending`.
    return toCar(
      unwrap(
        await this.listings
          .update({ ...draftToRow(draft), status: 'pending' })
          .eq('id', id)
          .select(LISTING_SELECT)
          .single(),
      ),
    );
  }

  async setStatus(id: string, status: OwnerStatusChange) {
    check(await this.listings.update({ status }).eq('id', id));
  }

  async remove(id: string) {
    check(await this.listings.delete().eq('id', id));
  }

  private async userId(): Promise<string> {
    const { data } = await this.db.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new AppError('Inicia sesión para continuar.', 'auth');
    return id;
  }
}
