import { InjectionToken } from '@angular/core';
import type {
  AppUser,
  Brand,
  Car,
  CarFilter,
  ChatMessage,
  Conversation,
  DealerLocation,
  InspectionReport,
  ListingDraft,
  ListingFlags,
  OwnerStatusChange,
  Page,
  ProfileChanges,
  PromoBanner,
  StaffListingFilter,
  StaffStats,
} from './models';

/**
 * Repository contracts. Implementations: `data/dummy` (now) and
 * `data/supabase` (when the backend is live). Methods reject with `AppError`.
 */
export interface CatalogRepository {
  banners(): Promise<PromoBanner[]>;
  brands(): Promise<Brand[]>;
  locations(): Promise<DealerLocation[]>;
}

export interface ListingRepository {
  featured(limit?: number): Promise<Car[]>;
  recent(limit?: number): Promise<Car[]>;
  search(filter: CarFilter, page: number, pageSize: number): Promise<Page<Car>>;
  byId(id: string): Promise<Car>;
  /** Counts a real visitor view (browser only — never on server renders). */
  recordView(id: string): Promise<void>;
  similar(car: Car, limit?: number): Promise<Car[]>;
  inspection(listingId: string): Promise<InspectionReport | null>;
  mine(): Promise<Car[]>;
  uploadPhoto(file: Blob, fileName: string): Promise<string>;
  create(draft: ListingDraft): Promise<Car>;
  update(id: string, draft: ListingDraft): Promise<Car>;
  /** Owner actions only: mark sold, or relist (→ back to review). */
  setStatus(id: string, status: OwnerStatusChange): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface AuthRepository {
  current(): Promise<AppUser | null>;
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(fullName: string, email: string, phone: string, password: string): Promise<AppUser | null>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateProfile(changes: ProfileChanges): Promise<AppUser>;
  /** Session changes from outside the app (token expiry, other tabs). Returns unsubscribe. */
  onChange(listener: (user: AppUser | null) => void): () => void;
}

export interface FavoritesRepository {
  ids(): Promise<Set<string>>;
  cars(): Promise<Car[]>;
  add(listingId: string): Promise<void>;
  remove(listingId: string): Promise<void>;
}

export interface ChatRepository {
  conversations(): Promise<Conversation[]>;
  conversation(id: string): Promise<Conversation>;
  start(target: { listingId: string } | { locationId: string }): Promise<string>;
  messages(conversationId: string): Promise<ChatMessage[]>;
  /** Realtime subscription; returns an unsubscribe function. */
  watch(conversationId: string, onChange: (messages: ChatMessage[]) => void): () => void;
  send(conversationId: string, body: string): Promise<void>;
  markRead(conversationId: string): Promise<void>;
}

/** Carmexio staff operations (RLS: branch staff, or admins for every branch). */
export interface StaffRepository {
  /** Pending ads, oldest first; all branches when `locationId` is omitted. */
  reviewQueue(locationId?: string): Promise<Car[]>;
  listings(filter: StaffListingFilter): Promise<Car[]>;
  approve(listingId: string): Promise<void>;
  reject(listingId: string, reason: string): Promise<void>;
  setFlags(listingId: string, flags: ListingFlags): Promise<void>;
  /** Upserts the report; the DB mirrors `overall_score` onto the listing. */
  saveInspection(report: InspectionReport): Promise<void>;
  stats(locationId?: string): Promise<StaffStats>;
}

export const CATALOG_REPOSITORY = new InjectionToken<CatalogRepository>('CatalogRepository');
export const LISTING_REPOSITORY = new InjectionToken<ListingRepository>('ListingRepository');
export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
export const FAVORITES_REPOSITORY = new InjectionToken<FavoritesRepository>('FavoritesRepository');
export const CHAT_REPOSITORY = new InjectionToken<ChatRepository>('ChatRepository');
export const STAFF_REPOSITORY = new InjectionToken<StaffRepository>('StaffRepository');
