import { SupabaseClient } from '@supabase/supabase-js';
import {
  Advertisement,
  Draft,
  MediaAsset,
  Offer,
  SiteAlert,
  SiteContent,
  isLive,
} from '../../domain/content';
import { AppError } from '../../domain/models';
import { CmsRepository, ContentRepository } from '../../domain/repositories';
import {
  adToRow,
  alertToRow,
  offerToRow,
  textsToRows,
  toAd,
  toAlert,
  toMedia,
  toOffer,
  toTexts,
} from '../content-mappers';
import { Row } from '../mappers';
import { SITE_MEDIA_BUCKET } from './supabase-constants';
import { check, toAppError, unwrap } from './supabase-errors';

/** Public read (RLS: active rows only). Schedules are re-checked client-side. */
export class SupabaseContentRepository implements ContentRepository {
  constructor(private readonly db: SupabaseClient) {}

  async siteContent(): Promise<SiteContent> {
    const now = new Date().toISOString();
    const [ads, alerts, offers, texts] = await Promise.all([
      this.db.from('banners').select('*').eq('is_active', true).order('sort_order'),
      this.db.from('site_alerts').select('*').eq('is_active', true),
      this.db
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
        .order('sort_order'),
      this.db.from('site_texts').select('*'),
    ]);
    return {
      ads: unwrap(ads)
        .map(toAd)
        .filter((a: Advertisement) => isLive(a)),
      alerts: unwrap(alerts)
        .map(toAlert)
        .filter((a: SiteAlert) => isLive(a)),
      offers: unwrap(offers).map(toOffer),
      texts: toTexts(unwrap(texts)),
    };
  }
}

/** Admin writes (RLS `is_admin()`); lists include inactive and scheduled rows. */
export class SupabaseCmsRepository implements CmsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async media() {
    const rows = unwrap(
      await this.db.from('media_assets').select('*').order('created_at', { ascending: false }),
    );
    return rows.map(toMedia);
  }

  /** `site-media/<yyyy-mm>/<timestamp>-<name>`, then a `media_assets` row. */
  async uploadMedia(file: Blob, name: string): Promise<MediaAsset> {
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    if (!file.type.startsWith('image/') && kind !== 'video') {
      throw new AppError('Solo se permiten imágenes o videos.', 'validation');
    }
    const path = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${name.replace(/[^\w.-]/g, '_')}`;
    const bucket = this.db.storage.from(SITE_MEDIA_BUCKET);
    const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw toAppError(error);
    const row: Row = {
      kind,
      path,
      url: bucket.getPublicUrl(path).data.publicUrl,
      name,
      size_bytes: file.size,
    };
    return toMedia(unwrap(await this.db.from('media_assets').insert(row).select().single()));
  }

  async deleteMedia(id: string) {
    const row = unwrap(await this.db.from('media_assets').select('path').eq('id', id).single());
    const { error } = await this.db.storage.from(SITE_MEDIA_BUCKET).remove([row['path']]);
    if (error) throw toAppError(error);
    check(await this.db.from('media_assets').delete().eq('id', id));
  }

  async ads() {
    return unwrap(await this.db.from('banners').select('*').order('sort_order')).map(toAd);
  }

  async saveAd(ad: Draft<Advertisement>) {
    return toAd(await this.upsert('banners', ad.id, adToRow(ad)));
  }

  deleteAd(id: string) {
    return this.remove('banners', id);
  }

  async alerts() {
    return unwrap(
      await this.db.from('site_alerts').select('*').order('created_at', { ascending: false }),
    ).map(toAlert);
  }

  async saveAlert(alert: Draft<SiteAlert>) {
    return toAlert(await this.upsert('site_alerts', alert.id, alertToRow(alert)));
  }

  deleteAlert(id: string) {
    return this.remove('site_alerts', id);
  }

  async offers() {
    return unwrap(await this.db.from('offers').select('*').order('sort_order')).map(toOffer);
  }

  async saveOffer(offer: Draft<Offer>) {
    return toOffer(await this.upsert('offers', offer.id, offerToRow(offer)));
  }

  deleteOffer(id: string) {
    return this.remove('offers', id);
  }

  async texts() {
    return toTexts(unwrap(await this.db.from('site_texts').select('*')));
  }

  /** Upserts edited keys; keys cleared in the form fall back to the built-in defaults. */
  async saveTexts(texts: SiteContent['texts']) {
    const rows = textsToRows(texts);
    const cleared = Object.keys(texts).filter((key) => !rows.some((r) => r['key'] === key));
    if (rows.length) check(await this.db.from('site_texts').upsert(rows, { onConflict: 'key' }));
    if (cleared.length) check(await this.db.from('site_texts').delete().in('key', cleared));
  }

  private async upsert(table: string, id: string, values: Row): Promise<Row> {
    const query = id
      ? this.db.from(table).update(values).eq('id', id)
      : this.db.from(table).insert(values);
    return unwrap(await query.select().single());
  }

  private async remove(table: string, id: string): Promise<void> {
    check(await this.db.from(table).delete().eq('id', id));
  }
}
