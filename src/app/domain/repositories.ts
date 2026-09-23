import { InjectionToken } from '@angular/core';
import {
  AppUser,
  Brand,
  Car,
  CarFilter,
  ChatMessage,
  Conversation,
  DealerLocation,
  InspectionReport,
  ListingDraft,
  ListingStatus,
  Page,
  PromoBanner,
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
  similar(car: Car, limit?: number): Promise<Car[]>;
  inspection(listingId: string): Promise<InspectionReport | null>;
  mine(): Promise<Car[]>;
  uploadPhoto(file: Blob, fileName: string): Promise<string>;
  create(draft: ListingDraft): Promise<Car>;
  update(id: string, draft: ListingDraft): Promise<Car>;
  setStatus(id: string, status: ListingStatus, reason?: string): Promise<void>;
  remove(id: string): Promise<void>;
  /** Staff: pending ads for a branch (all branches for admins). */
  reviewQueue(locationId?: string): Promise<Car[]>;
}

export interface AuthRepository {
  current(): Promise<AppUser | null>;
  signIn(email: string, password: string): Promise<AppUser>;
  signUp(fullName: string, email: string, phone: string, password: string): Promise<AppUser | null>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateProfile(changes: Partial<Pick<AppUser, 'fullName' | 'phone' | 'city'>>): Promise<AppUser>;
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

export const CATALOG_REPOSITORY = new InjectionToken<CatalogRepository>('CatalogRepository');
export const LISTING_REPOSITORY = new InjectionToken<ListingRepository>('ListingRepository');
export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
export const FAVORITES_REPOSITORY = new InjectionToken<FavoritesRepository>('FavoritesRepository');
export const CHAT_REPOSITORY = new InjectionToken<ChatRepository>('ChatRepository');
