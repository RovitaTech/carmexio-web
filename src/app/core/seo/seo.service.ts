import { DOCUMENT, RESPONSE_INIT, Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../config/app-config';
import { APP_LANG, LANGS, Lang, langPrefix } from '../i18n/i18n';

export interface SeoData {
  title: string;
  description?: string;
  image?: string;
  /** Canonical path; defaults to the current route without its query string. */
  path?: string;
  /** Private or thin pages (account, auth, chats, staff). */
  noindex?: boolean;
  /** JSON-LD object(s) for rich results (Car, AutoDealer, BreadcrumbList…). */
  jsonLd?: object | object[];
}

const SITE_NAME = 'Carmexio';
const DEFAULT_IMAGE = '/icon-512.png';

/**
 * Per-page title, meta, canonical, Open Graph / Twitter and JSON-LD. Runs on
 * the server, so crawlers get it in the HTML. Every call replaces everything
 * the previous page set — nothing leaks between routes.
 */
@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly siteUrl = inject(APP_CONFIG).siteUrl;
  /** Only present while rendering on the server. */
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  private readonly lang = inject(APP_LANG);

  set(data: SeoData): void {
    const title = `${data.title} · ${SITE_NAME}`;
    const path = data.path ?? this.currentPath();
    const url = this.localized(path, this.lang);
    const image = this.absolute(data.image ?? DEFAULT_IMAGE);

    this.title.setTitle(title);
    this.setMeta('name', 'robots', data.noindex ? 'noindex, nofollow' : 'index, follow');
    this.setMeta('name', 'description', data.description);
    this.setMeta('property', 'og:site_name', SITE_NAME);
    this.setMeta('property', 'og:locale', this.lang === 'en' ? 'en_US' : 'es_MX');
    this.setMeta('property', 'og:type', 'website');
    this.setMeta('property', 'og:title', title);
    this.setMeta('property', 'og:description', data.description);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:image', image);
    this.setMeta('name', 'twitter:card', 'summary_large_image');
    this.setCanonical(data.noindex ? undefined : url);
    this.setAlternates(data.noindex ? undefined : path);
    this.setJsonLd(data.jsonLd);
  }

  /** HTTP status of the server-rendered response (e.g. 404 for a missing car). */
  setStatus(status: number): void {
    if (this.response) this.response.status = status;
  }

  /** `https://carmexio.mx` + path, unless the value is already absolute. */
  absolute(pathOrUrl: string): string {
    return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${this.siteUrl}${pathOrUrl}`;
  }

  /** Absolute URL of `path` in a given language (`/en` prefix for English). */
  private localized(path: string, lang: Lang): string {
    return `${this.siteUrl}${langPrefix(lang)}${path}` || this.siteUrl;
  }

  /** `<link rel="alternate" hreflang>` for every language + x-default (Spanish). */
  private setAlternates(path: string | undefined): void {
    this.document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((l) => l.remove());
    if (path === undefined) return;
    const links: [string, string][] = [
      ...LANGS.map((lang): [string, string] => [
        lang === 'es' ? 'es-MX' : 'en',
        this.localized(path, lang),
      ]),
      ['x-default', this.localized(path, 'es')],
    ];
    for (const [hreflang, href] of links) {
      const link = this.document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      this.document.head.appendChild(link);
    }
  }

  /** Pages set SEO while their navigation is still in flight, so prefer its target URL. */
  private currentPath(): string {
    const tree = this.router.currentNavigation()?.finalUrl ?? this.router.parseUrl(this.router.url);
    const path = this.router.serializeUrl(tree).split(/[?#]/)[0];
    return path === '/' ? '' : path;
  }

  private setMeta(attr: 'name' | 'property', key: string, content: string | undefined): void {
    const selector = `${attr}="${key}"`;
    if (content) this.meta.updateTag({ [attr]: key, content }, selector);
    else this.meta.removeTag(selector);
  }

  private setCanonical(url: string | undefined): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(jsonLd: SeoData['jsonLd']): void {
    this.document.getElementById('cx-jsonld')?.remove();
    if (!jsonLd) return;
    const script = this.document.createElement('script');
    script.id = 'cx-jsonld';
    script.type = 'application/ld+json';
    // `<` escaped so listing text can never close the script tag.
    script.textContent = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}
