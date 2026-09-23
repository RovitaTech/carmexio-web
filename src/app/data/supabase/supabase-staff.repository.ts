import { SupabaseClient } from '@supabase/supabase-js';
import {
  AppError,
  InspectionReport,
  ListingFlags,
  ListingStatus,
  StaffListingFilter,
  StaffStats,
} from '../../domain/models';
import { StaffRepository } from '../../domain/repositories';
import { Row, inspectionToRow, toCar } from '../mappers';
import { LISTING_SELECT } from './supabase-constants';
import { check, toAppError, unwrap } from './supabase-errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Staff writes rely on RLS `is_staff(location_id)`; the UI only mirrors it. */
export class SupabaseStaffRepository implements StaffRepository {
  constructor(private readonly db: SupabaseClient) {}

  async reviewQueue(locationId?: string) {
    let q = this.db.from('listings').select(LISTING_SELECT).eq('status', 'pending');
    if (locationId) q = q.eq('location_id', locationId);
    const rows = unwrap(await q.order('updated_at', { ascending: true }));
    return rows.map(toCar);
  }

  async listings(filter: StaffListingFilter) {
    let q = this.db.from('listings').select(LISTING_SELECT);
    if (filter.locationId) q = q.eq('location_id', filter.locationId);
    if (filter.status) q = q.eq('status', filter.status);
    const text = filter.query?.replace(/[,()"'\\%*:.]/g, ' ').trim();
    if (text) {
      // `id` is a uuid: match it exactly, never with ilike.
      const byId = UUID.test(text) ? `,id.eq.${text}` : '';
      q = q.or(`brand.ilike.%${text}%,model.ilike.%${text}%${byId}`);
    }
    const rows = unwrap(await q.order('created_at', { ascending: false }).limit(200));
    return rows.map(toCar);
  }

  approve(listingId: string) {
    return this.review(listingId, 'active', null);
  }

  reject(listingId: string, reason: string) {
    if (!reason.trim()) {
      return Promise.reject(new AppError('Escribe el motivo del rechazo.', 'validation'));
    }
    return this.review(listingId, 'rejected', reason.trim());
  }

  async setFlags(listingId: string, flags: ListingFlags) {
    const row: Row = {};
    if (flags.isFeatured !== undefined) row['is_featured'] = flags.isFeatured;
    if (flags.isVerified !== undefined) row['is_verified'] = flags.isVerified;
    check(await this.db.from('listings').update(row).eq('id', listingId));
  }

  async saveInspection(report: InspectionReport) {
    // `sync_inspection_score` copies overall_score onto the listing.
    check(
      await this.db
        .from('inspection_reports')
        .upsert(inspectionToRow(report), { onConflict: 'listing_id' }),
    );
  }

  async stats(locationId?: string): Promise<StaffStats> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [pending, active, rejected, soldThisMonth, unreadChats, withoutInspection] =
      await Promise.all([
        this.count('pending', locationId),
        this.count('active', locationId),
        this.count('rejected', locationId),
        this.count('sold', locationId, monthStart.toISOString()),
        this.unreadChats(locationId),
        this.countWithoutInspection(locationId),
      ]);
    return { pending, active, rejected, soldThisMonth, unreadChats, withoutInspection };
  }

  private async review(listingId: string, status: ListingStatus, reason: string | null) {
    const { data } = await this.db.auth.getSession();
    const reviewer = data.session?.user.id;
    if (!reviewer) throw new AppError('Inicia sesión para continuar.', 'auth');
    check(
      await this.db
        .from('listings')
        .update({
          status,
          rejection_reason: reason,
          reviewed_by: reviewer,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', listingId),
    );
  }

  private async count(status: ListingStatus, locationId?: string, since?: string) {
    let q = this.db
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);
    if (locationId) q = q.eq('location_id', locationId);
    if (since) q = q.gte('updated_at', since);
    const { count, error } = await q;
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  private async unreadChats(locationId?: string) {
    let q = this.db.from('conversations').select('staff_unread_count').gt('staff_unread_count', 0);
    if (locationId) q = q.eq('location_id', locationId);
    const rows = unwrap(await q);
    return rows.reduce((sum: number, r: Row) => sum + (r['staff_unread_count'] as number), 0);
  }

  private async countWithoutInspection(locationId?: string) {
    let q = this.db
      .from('listings')
      .select('id, inspection_reports(listing_id)')
      .neq('status', 'sold')
      .is('inspection_reports', null);
    if (locationId) q = q.eq('location_id', locationId);
    return unwrap(await q).length;
  }
}
