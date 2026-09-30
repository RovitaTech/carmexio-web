// DELETE WHEN LIVE — in-memory staff operations (mirrors RLS `is_staff()`).
import {
  AppError,
  Car,
  InspectionReport,
  InventoryFilter,
  ListingFlags,
  StaffConversation,
  StaffListingFilter,
  StaffStats,
} from '../../domain/models';
import { StaffRepository } from '../../domain/repositories';
import { Row, inspectionToRow, toCar, toStaffConversation } from '../mappers';
import { DummyDb, requireUser } from './dummy-db';
import { SORTS } from './dummy-listing.repository';

export class DummyStaffRepository implements StaffRepository {
  constructor(private readonly db: DummyDb) {}

  async reviewQueue(locationId?: string): Promise<Car[]> {
    await this.db.delay();
    this.requireStaff(locationId);
    return this.cars(
      this.db.listings
        .filter((l) => l['status'] === 'pending' && this.inBranch(l, locationId))
        .sort((a, b) => a['updated_at'].localeCompare(b['updated_at'])),
    );
  }

  async listings(filter: StaffListingFilter): Promise<Car[]> {
    await this.db.delay();
    this.requireStaff(filter.locationId);
    const q = filter.query?.trim().toLowerCase() ?? '';
    return this.cars(
      this.db.listings
        .filter(
          (l) =>
            this.inBranch(l, filter.locationId) &&
            (!filter.status || l['status'] === filter.status) &&
            (!q || `${l['brand']} ${l['model']} ${l['id']}`.toLowerCase().includes(q)),
        )
        .sort(SORTS['newest']),
    );
  }

  async approve(listingId: string): Promise<void> {
    await this.db.delay(0.6);
    Object.assign(this.reviewable(listingId), {
      status: 'active',
      rejection_reason: null,
      ...this.reviewStamp(),
    });
  }

  async reject(listingId: string, reason: string): Promise<void> {
    await this.db.delay(0.6);
    if (!reason.trim()) throw new AppError('Escribe el motivo del rechazo.', 'validation');
    Object.assign(this.reviewable(listingId), {
      status: 'rejected',
      rejection_reason: reason.trim(),
      ...this.reviewStamp(),
    });
  }

  async setFlags(listingId: string, flags: ListingFlags): Promise<void> {
    await this.db.delay(0.4);
    const row = this.reviewable(listingId);
    if (flags.isFeatured !== undefined) row['is_featured'] = flags.isFeatured;
    if (flags.isVerified !== undefined) row['is_verified'] = flags.isVerified;
  }

  async saveInspection(report: InspectionReport): Promise<void> {
    await this.db.delay();
    const listing = this.reviewable(report.listingId);
    const row = inspectionToRow(report);
    const i = this.db.inspections.findIndex((r) => r['listing_id'] === report.listingId);
    if (i >= 0) this.db.inspections[i] = row;
    else this.db.inspections.push(row);
    // Trigger `sync_inspection_score`.
    listing['inspection_score'] = report.overallScore;
  }

  async stats(locationId?: string): Promise<StaffStats> {
    await this.db.delay(0.5);
    this.requireStaff(locationId);
    const rows = this.db.listings.filter((l) => this.inBranch(l, locationId));
    const count = (status: string) => rows.filter((l) => l['status'] === status).length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const reported = new Set(this.db.inspections.map((r) => r['listing_id']));
    return {
      pending: count('pending'),
      active: count('active'),
      rejected: count('rejected'),
      soldThisMonth: rows.filter(
        (l) => l['status'] === 'sold' && Date.parse(l['updated_at']) >= monthStart.getTime(),
      ).length,
      unreadChats: this.db.conversations
        .filter((c) => !locationId || c['location_id'] === locationId)
        .reduce((sum, c) => sum + (c['staff_unread_count'] ?? 0), 0),
      withoutInspection: rows.filter((l) => l['status'] !== 'sold' && !reported.has(l['id']))
        .length,
    };
  }

  async inbox(locationId?: string): Promise<StaffConversation[]> {
    await this.db.delay(0.5);
    this.requireStaff(locationId);
    return this.db.conversations
      .filter((c) => this.inBranch(c, locationId))
      .sort((a, b) => b['last_message_at'].localeCompare(a['last_message_at']))
      .map((c) => {
        const listing = c['listing_id'] ? this.db.listing(c['listing_id']) : null;
        const customer = this.db.profiles.find((p) => p['id'] === c['user_id']);
        return toStaffConversation({
          ...c,
          location: this.db.location(c['location_id']),
          listing,
          customer: customer
            ? { full_name: customer['full_name'], phone: customer['phone'] }
            : null,
        });
      })
      .sort((a, b) => Number(b.unreadCount > 0) - Number(a.unreadCount > 0));
  }

  async reply(conversationId: string, body: string): Promise<void> {
    await this.db.delay(0.3);
    const conv = this.db.conversations.find((c) => c['id'] === conversationId);
    if (!conv) throw new AppError('Conversación no encontrada.', 'notFound');
    const sender = this.requireStaff(conv['location_id']);
    const text = body.trim();
    if (!text) throw new AppError('El mensaje está vacío.', 'validation');
    const now = new Date().toISOString();
    this.db.messages.push({
      id: this.db.nextId('msg'),
      conversation_id: conversationId,
      sender_id: sender,
      sender_role: 'staff',
      body: text,
      created_at: now,
      read_at: null,
    });
    Object.assign(conv, {
      last_message: text,
      last_message_at: now,
      user_unread_count: (conv['user_unread_count'] ?? 0) + 1,
    });
  }

  async markRead(conversationId: string): Promise<void> {
    const conv = this.db.conversations.find((c) => c['id'] === conversationId);
    if (conv) conv['staff_unread_count'] = 0;
  }

  async inventory(filter: InventoryFilter): Promise<Car[]> {
    await this.db.delay();
    this.requireStaff();
    const q = filter.query?.trim().toLowerCase() ?? '';
    return this.cars(
      this.db.listings
        .filter(
          (l) =>
            (filter.status
              ? l['status'] === filter.status
              : ['active', 'sold'].includes(l['status'])) &&
            this.inBranch(l, filter.locationId) &&
            (!q || `${l['brand']} ${l['model']}`.toLowerCase().includes(q)),
        )
        .sort(SORTS['newest']),
    );
  }

  private cars(rows: Row[]): Car[] {
    return rows.map((r) => toCar(this.db.withLocation(r)));
  }

  private inBranch(row: Row, locationId?: string): boolean {
    return !locationId || row['location_id'] === locationId;
  }

  private reviewable(listingId: string): Row {
    const row = this.db.listing(listingId);
    if (!row) throw new AppError('Anuncio no encontrado.', 'notFound');
    this.requireStaff(row['location_id']);
    return row;
  }

  private reviewStamp(): Row {
    const now = new Date().toISOString();
    return { reviewed_by: this.db.currentUserId, reviewed_at: now, updated_at: now };
  }

  /** `is_staff(p_location)`: admins everywhere, staff only in their branch. */
  /** Mirrors RLS `is_staff(location)`; returns the staff user's id. */
  private requireStaff(locationId?: string): string {
    const id = requireUser(this.db);
    const profile = this.db.profiles.find((p) => p['id'] === id);
    const role = profile?.['role'];
    const allowed =
      role === 'admin' ||
      (role === 'staff' && (!locationId || profile?.['location_id'] === locationId));
    if (!allowed) throw new AppError('No tienes permiso para esta sucursal.', 'auth');
    return id;
  }
}
