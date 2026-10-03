import type { AppConfig } from '../app/core/config/app-config';

/**
 * Live configuration. Never put secret keys here: only the Supabase
 * *publishable* key belongs in a client bundle (RLS protects the data).
 */
export const environment: AppConfig = {
  // Canonical domain (Vercel project domain; keep public/robots.txt in sync).
  siteUrl: 'https://www.carmexioguanajuato.com',
  site: {
    branchId: 'loc-gto',
    region: 'Guanajuato',
    phones: ['442 669 8432', '427 224 0980'],
    whatsapp: '524426698432',
    facebookUrl: '',
  },
  apiUrl: 'https://api.carmexioguanajuato.com/v1',
  supabase: {
    url: 'https://msxeedztqddyfunvtcsx.supabase.co',
    publishableKey: 'sb_publishable_Gp32QC6MQYjWZnSFhrVmWQ_FVXZxdEY',
  },
};
