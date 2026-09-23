import { InjectionToken, LOCALE_ID, inject } from '@angular/core';
import type { LocalizedText } from '../../domain/content';

/** Site languages. Spanish (es-MX) is the source locale at `/`; English lives at `/en`. */
export type Lang = 'es' | 'en';
export const LANGS: readonly Lang[] = ['es', 'en'];

export function langOf(localeId: string): Lang {
  return localeId.toLowerCase().startsWith('en') ? 'en' : 'es';
}

/** Current language of this build (each locale is a separate bundle). */
export const APP_LANG = new InjectionToken<Lang>('AppLang', {
  factory: () => langOf(inject(LOCALE_ID)),
});

export function pick(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return (lang === 'en' ? text.en?.trim() : '') || text.es;
}

/** URL prefix of a language: `''` for Spanish, `/en` for English. */
export function langPrefix(lang: Lang): string {
  return lang === 'en' ? '/en' : '';
}

/** Same page in another language, e.g. `/autos?q=x` → `/en/autos?q=x`. */
export function pathIn(lang: Lang, routerUrl: string): string {
  const path = routerUrl === '/' ? '' : routerUrl;
  return `${langPrefix(lang)}${path}` || '/';
}
