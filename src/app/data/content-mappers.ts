// Content rows (API_NEEDED.md §10) ↔ entities. Localized columns are `x` (es) + `x_en`.
// `banners` keeps the columns the Flutter app reads (title, subtitle, image_url,
// cta_label, deep_link); the web adds `_en`, placement, video and scheduling.
import {
  Advertisement,
  AlertTone,
  Draft,
  LocalizedText,
  MediaAsset,
  Offer,
  SiteAlert,
} from '../domain/content';
import { Row } from './mappers';

function text(r: Row, column: string): LocalizedText {
  return { es: r[column] ?? '', en: r[`${column}_en`] ?? undefined };
}

function optionalText(r: Row, column: string): LocalizedText | undefined {
  return r[column] ? text(r, column) : undefined;
}

function textColumns(column: string, value: LocalizedText | undefined): Row {
  return {
    [column]: value?.es.trim() || null,
    [`${column}_en`]: value?.en?.trim() || null,
  };
}

const orNull = (value: string | undefined) => value || null;

export function toMedia(r: Row): MediaAsset {
  return {
    id: r['id'],
    kind: r['kind'],
    url: r['url'],
    name: r['name'] ?? '',
    sizeBytes: r['size_bytes'] ?? 0,
    createdAt: r['created_at'],
  };
}

export function toAd(r: Row): Advertisement {
  const video = r['video_url'] as string | null;
  return {
    id: r['id'],
    placement: r['placement'] ?? 'home_strip',
    title: text(r, 'title'),
    subtitle: optionalText(r, 'subtitle'),
    ctaLabel: optionalText(r, 'cta_label'),
    link: r['deep_link'] ?? undefined,
    mediaKind: video ? 'video' : 'image',
    mediaUrl: video ?? r['image_url'],
    posterUrl: video ? (r['image_url'] ?? undefined) : undefined,
    startsAt: r['starts_at'] ?? undefined,
    endsAt: r['ends_at'] ?? undefined,
    isActive: r['is_active'] ?? true,
    sortOrder: r['sort_order'] ?? 0,
  };
}

export function adToRow(ad: Draft<Advertisement>): Row {
  const video = ad.mediaKind === 'video';
  return {
    placement: ad.placement,
    ...textColumns('title', ad.title),
    ...textColumns('subtitle', ad.subtitle),
    ...textColumns('cta_label', ad.ctaLabel),
    deep_link: orNull(ad.link),
    // Flutter reads image_url: for videos it holds the poster.
    image_url: video ? (ad.posterUrl ?? '') : ad.mediaUrl,
    video_url: video ? ad.mediaUrl : null,
    starts_at: orNull(ad.startsAt),
    ends_at: orNull(ad.endsAt),
    is_active: ad.isActive,
    sort_order: ad.sortOrder,
  };
}

export function toAlert(r: Row): SiteAlert {
  return {
    id: r['id'],
    message: text(r, 'message'),
    linkLabel: optionalText(r, 'link_label'),
    link: r['link'] ?? undefined,
    tone: (r['tone'] as AlertTone) ?? 'info',
    startsAt: r['starts_at'] ?? undefined,
    endsAt: r['ends_at'] ?? undefined,
    isActive: r['is_active'] ?? true,
  };
}

export function alertToRow(alert: Draft<SiteAlert>): Row {
  return {
    ...textColumns('message', alert.message),
    ...textColumns('link_label', alert.linkLabel),
    link: orNull(alert.link),
    tone: alert.tone,
    starts_at: orNull(alert.startsAt),
    ends_at: orNull(alert.endsAt),
    is_active: alert.isActive,
  };
}

export function toOffer(r: Row): Offer {
  return {
    id: r['id'],
    title: text(r, 'title'),
    description: text(r, 'description'),
    badge: optionalText(r, 'badge'),
    imageUrl: r['image_url'],
    link: r['link'] ?? undefined,
    code: r['code'] ?? undefined,
    validUntil: r['valid_until'] ?? undefined,
    isActive: r['is_active'] ?? true,
    sortOrder: r['sort_order'] ?? 0,
  };
}

export function offerToRow(offer: Draft<Offer>): Row {
  return {
    ...textColumns('title', offer.title),
    ...textColumns('description', offer.description),
    ...textColumns('badge', offer.badge),
    image_url: offer.imageUrl,
    link: orNull(offer.link),
    code: orNull(offer.code?.trim().toUpperCase()),
    valid_until: orNull(offer.validUntil),
    is_active: offer.isActive,
    sort_order: offer.sortOrder,
  };
}

/** `site_texts` rows (`key`, `value`, `value_en`) → key → text. */
export function toTexts(rows: Row[]): Record<string, LocalizedText> {
  return Object.fromEntries(rows.map((r) => [r['key'], text(r, 'value')]));
}

export function textsToRows(texts: Record<string, LocalizedText | undefined>): Row[] {
  return Object.entries(texts)
    .filter((entry): entry is [string, LocalizedText] => !!entry[1]?.es.trim())
    .map(([key, value]) => ({ key, ...textColumns('value', value) }));
}
