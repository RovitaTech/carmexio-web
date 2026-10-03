import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  /** Canonical origin for SEO (canonical URLs, sitemap, Open Graph). */
  siteUrl: string;
  /** The branch this website sells from and how to reach it. */
  site: {
    /** `locations.id`: cars here are "en Guanajuato"; every other branch is "para recoger". */
    branchId: string;
    /** Shown next to the logo and in titles ("Carmexio Guanajuato"). */
    region: string;
    phones: readonly string[];
    /** Digits for wa.me (country code + number). */
    whatsapp: string;
    /** Empty hides the link. */
    facebookUrl: string;
  };
  /** carmexio-BE REST API (`…/v1`), used for server-side jobs such as the stock import. */
  apiUrl: string;
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
