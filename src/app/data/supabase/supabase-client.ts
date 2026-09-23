import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../../core/config/app-config';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SupabaseClient');

/**
 * One client per app injector. On the server (SSR) there is no session:
 * nothing is persisted or refreshed, and every render is a guest render.
 */
export function createSupabaseClient(): SupabaseClient {
  const { supabase } = inject(APP_CONFIG);
  if (!supabase.url || !supabase.publishableKey) {
    throw new Error(
      'Supabase is not configured: set supabase.url and supabase.publishableKey in the environment.',
    );
  }
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  return createClient(supabase.url, supabase.publishableKey, {
    auth: {
      persistSession: browser,
      autoRefreshToken: browser,
      detectSessionInUrl: browser,
    },
  });
}
