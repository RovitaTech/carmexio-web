import type { AppConfig } from '../app/core/config/app-config';

/**
 * Committed defaults (demo data mode). Never put secret keys here: only the
 * Supabase *publishable* key belongs in a client bundle. For deployments, set
 * the values in the host's environment and generate this file at build time.
 */
export const environment: AppConfig = {
  siteUrl: 'https://carmexio.mx',
  supabase: {
    url: '',
    publishableKey: '',
  },
};
