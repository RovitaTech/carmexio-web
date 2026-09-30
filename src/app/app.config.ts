import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { SessionStore } from './core/auth/session.store';
import { ThemeService } from './core/theme/theme.service';
import { provideSupabaseData } from './data/providers';

export const appConfig: ApplicationConfig = {
  providers: [
    // LOCALE_ID and locale data come from the localize build (angular.json → i18n).
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideClientHydration(withEventReplay()),
    // Live data (Supabase). Specs use provideDummyData() as an in-memory fake.
    provideSupabaseData(),
    provideAppInitializer(() => {
      inject(ThemeService).init();
      return inject(SessionStore).restore();
    }),
  ],
};
