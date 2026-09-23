import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  /** Canonical origin for SEO (canonical URLs, sitemap, Open Graph). */
  siteUrl: string;
  supabase: {
    url: string;
    /** Publishable (anon) key — safe in the browser; RLS protects the data. */
    publishableKey: string;
  };
}

/** Runtime configuration; tests override it with `{ provide: APP_CONFIG, useValue }`. */
export const APP_CONFIG = new InjectionToken<AppConfig>('AppConfig', {
  factory: () => environment,
});
