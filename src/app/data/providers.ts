import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import {
  AUTH_REPOSITORY,
  CATALOG_REPOSITORY,
  CHAT_REPOSITORY,
  FAVORITES_REPOSITORY,
  LISTING_REPOSITORY,
  STAFF_REPOSITORY,
} from '../domain/repositories';
import { DummyDb } from './dummy/dummy-db';
import {
  DummyAuthRepository,
  DummyChatRepository,
  DummyFavoritesRepository,
} from './dummy/dummy-account.repositories';
import { DummyCatalogRepository, DummyListingRepository } from './dummy/dummy-listing.repository';
import { DummyStaffRepository } from './dummy/dummy-staff.repository';
import { APP_CONFIG } from '../core/config/app-config';
import {
  SupabaseAuthRepository,
  SupabaseChatRepository,
  SupabaseFavoritesRepository,
} from './supabase/supabase-account.repositories';
import { SUPABASE_CLIENT, createSupabaseClient } from './supabase/supabase-client';
import {
  SupabaseCatalogRepository,
  SupabaseListingRepository,
} from './supabase/supabase-listing.repository';
import { SupabaseStaffRepository } from './supabase/supabase-staff.repository';

export interface DummyDataOptions {
  /** Simulated network latency; tests pass 0. */
  latencyMs?: number;
}

/**
 * In-memory repositories (same seed as the Flutter app). Swap for
 * `provideSupabaseData()` when the backend is live (FRONTEND_PLAN.md §9),
 * then delete `data/dummy/`.
 *
 * Factories, not values: every app injector — i.e. every SSR request — gets
 * its own `DummyDb`, so one visitor's actions never leak into another's page.
 */
export function provideDummyData(options: DummyDataOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DummyDb, useFactory: () => new DummyDb(options.latencyMs) },
    { provide: CATALOG_REPOSITORY, useFactory: () => new DummyCatalogRepository(inject(DummyDb)) },
    { provide: LISTING_REPOSITORY, useFactory: () => new DummyListingRepository(inject(DummyDb)) },
    { provide: AUTH_REPOSITORY, useFactory: () => new DummyAuthRepository(inject(DummyDb)) },
    {
      provide: FAVORITES_REPOSITORY,
      useFactory: () => new DummyFavoritesRepository(inject(DummyDb)),
    },
    { provide: CHAT_REPOSITORY, useFactory: () => new DummyChatRepository(inject(DummyDb)) },
    { provide: STAFF_REPOSITORY, useFactory: () => new DummyStaffRepository(inject(DummyDb)) },
  ]);
}

/**
 * Live backend (../carmexio/API_NEEDED.md). Needs `supabase.url` and
 * `supabase.publishableKey` in the environment.
 */
export function provideSupabaseData(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SUPABASE_CLIENT, useFactory: createSupabaseClient },
    {
      provide: CATALOG_REPOSITORY,
      useFactory: () => new SupabaseCatalogRepository(inject(SUPABASE_CLIENT)),
    },
    {
      provide: LISTING_REPOSITORY,
      useFactory: () => new SupabaseListingRepository(inject(SUPABASE_CLIENT)),
    },
    {
      provide: AUTH_REPOSITORY,
      useFactory: () =>
        new SupabaseAuthRepository(
          inject(SUPABASE_CLIENT),
          `${inject(APP_CONFIG).siteUrl}/recuperar`,
        ),
    },
    {
      provide: FAVORITES_REPOSITORY,
      useFactory: () => new SupabaseFavoritesRepository(inject(SUPABASE_CLIENT)),
    },
    {
      provide: CHAT_REPOSITORY,
      useFactory: () => new SupabaseChatRepository(inject(SUPABASE_CLIENT)),
    },
    {
      provide: STAFF_REPOSITORY,
      useFactory: () => new SupabaseStaffRepository(inject(SUPABASE_CLIENT)),
    },
  ]);
}
