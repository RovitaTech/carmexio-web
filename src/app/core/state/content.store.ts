import { Service, computed, inject, resource } from '@angular/core';
import {
  AdPlacement,
  LocalizedText,
  SITE_TEXTS,
  SiteContent,
  SiteTextKey,
} from '../../domain/content';
import { CONTENT_REPOSITORY } from '../../domain/repositories';
import { APP_LANG, pick } from '../i18n/i18n';
import { optional, valueOr } from '../utils/resource';

const EMPTY: SiteContent = { alerts: [], ads: [], offers: [], texts: {} };

/**
 * Admin-managed site content, loaded once per app (SSR + hydration via
 * TransferState). A failed load falls back to the built-in copy — the site
 * never breaks because the CMS is down.
 */
@Service()
export class ContentStore {
  private readonly repo = inject(CONTENT_REPOSITORY);
  readonly lang = inject(APP_LANG);

  private readonly content = resource({
    id: 'site:content',
    loader: () => optional(this.repo.siteContent(), EMPTY),
  });
  private readonly value = computed(() => valueOr(this.content, EMPTY));

  readonly loaded = computed(() => this.content.hasValue());
  readonly alerts = computed(() => this.value().alerts);
  readonly offers = computed(() => this.value().offers);

  ads(placement: AdPlacement) {
    return this.value().ads.filter((a) => a.placement === placement);
  }

  /** Admin override, else the default copy, in the current language. */
  text(key: SiteTextKey): string {
    const override = this.value().texts[key];
    return pick(override?.es.trim() ? override : SITE_TEXTS[key].value, this.lang);
  }

  /** Any localized field in the current language. */
  t(text: LocalizedText | undefined): string {
    return pick(text, this.lang);
  }

  /** After an admin edit, so the public pages show it immediately. */
  reload(): void {
    this.content.reload();
  }
}
