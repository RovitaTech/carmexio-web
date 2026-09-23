import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  AUTH_REPOSITORY,
  CATALOG_REPOSITORY,
  CHAT_REPOSITORY,
  FAVORITES_REPOSITORY,
  LISTING_REPOSITORY,
} from '../domain/repositories';
import { DummyDb } from './dummy/dummy-db';
import {
  DummyAuthRepository,
  DummyChatRepository,
  DummyFavoritesRepository,
} from './dummy/dummy-account.repositories';
import { DummyCatalogRepository, DummyListingRepository } from './dummy/dummy-listing.repository';

/**
 * In-memory repositories (same seed as the Flutter app). Swap for
 * `provideSupabaseData()` when the backend is live (FRONTEND_PLAN.md §9),
 * then delete `data/dummy/`.
 */
export function provideDummyData(db = new DummyDb()): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CATALOG_REPOSITORY, useValue: new DummyCatalogRepository(db) },
    { provide: LISTING_REPOSITORY, useValue: new DummyListingRepository(db) },
    { provide: AUTH_REPOSITORY, useValue: new DummyAuthRepository(db) },
    { provide: FAVORITES_REPOSITORY, useValue: new DummyFavoritesRepository(db) },
    { provide: CHAT_REPOSITORY, useValue: new DummyChatRepository(db) },
  ]);
}
