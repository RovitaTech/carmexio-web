// DELETE WHEN LIVE — in-memory site content + admin CMS.
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
import { DummyDb, requireAdmin } from './dummy-db';

const bySort = (a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder;

export class DummyContentRepository implements ContentRepository {
  constructor(private readonly db: DummyDb) {}

  async siteContent(): Promise<SiteContent> {
    await this.db.delay(0.3);
    const { banners, alerts, offers, texts } = this.db.content;
    return {
      alerts: alerts.map(toAlert).filter((a) => isLive(a)),
      ads: banners
        .map(toAd)
        .filter((a) => isLive(a))
        .sort(bySort),
      offers: offers
        .map(toOffer)
        .filter((o) => o.isActive && (!o.validUntil || Date.parse(o.validUntil) > Date.now()))
        .sort(bySort),
      texts: toTexts(texts),
    };
  }
}

export class DummyCmsRepository implements CmsRepository {
  constructor(private readonly db: DummyDb) {}

  async media() {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return this.db.content.media
      .map(toMedia)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** No storage in demo mode: the browser keeps the file as an object URL. */
  async uploadMedia(file: Blob, name: string): Promise<MediaAsset> {
    await this.db.delay(1.5);
    requireAdmin(this.db);
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    if (!file.type.startsWith('image/') && kind !== 'video') {
      throw new AppError('Solo se permiten imágenes o videos.', 'validation');
    }
    const row: Row = {
      id: this.db.nextId('media'),
      kind,
      url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : name,
      name,
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    };
    this.db.content.media.unshift(row);
    return toMedia(row);
  }

  async deleteMedia(id: string) {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    this.remove(this.db.content.media, id);
  }

  async ads() {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return this.db.content.banners.map(toAd).sort(bySort);
  }

  async saveAd(ad: Draft<Advertisement>) {
    return toAd(await this.upsert(this.db.content.banners, ad.id, 'ad', adToRow(ad)));
  }

  async deleteAd(id: string) {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    this.remove(this.db.content.banners, id);
  }

  async alerts() {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return this.db.content.alerts.map(toAlert);
  }

  async saveAlert(alert: Draft<SiteAlert>) {
    return toAlert(await this.upsert(this.db.content.alerts, alert.id, 'alert', alertToRow(alert)));
  }

  async deleteAlert(id: string) {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    this.remove(this.db.content.alerts, id);
  }

  async offers() {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return this.db.content.offers.map(toOffer).sort(bySort);
  }

  async saveOffer(offer: Draft<Offer>) {
    return toOffer(await this.upsert(this.db.content.offers, offer.id, 'offer', offerToRow(offer)));
  }

  async deleteOffer(id: string) {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    this.remove(this.db.content.offers, id);
  }

  async texts() {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return toTexts(this.db.content.texts);
  }

  async saveTexts(texts: SiteContent['texts']) {
    await this.db.delay(0.6);
    requireAdmin(this.db);
    this.db.content.texts.splice(0, this.db.content.texts.length, ...textsToRows(texts));
  }

  private async upsert(table: Row[], id: string, prefix: string, values: Row): Promise<Row> {
    await this.db.delay(0.6);
    requireAdmin(this.db);
    const existing = id ? table.find((r) => r['id'] === id) : undefined;
    if (existing) return Object.assign(existing, values);
    if (id) throw new AppError('Este elemento ya no existe.', 'notFound');
    const row = { id: this.db.nextId(prefix), ...values };
    table.push(row);
    return row;
  }

  private remove(table: Row[], id: string): void {
    const index = table.findIndex((r) => r['id'] === id);
    if (index < 0) throw new AppError('Este elemento ya no existe.', 'notFound');
    table.splice(index, 1);
  }
}
