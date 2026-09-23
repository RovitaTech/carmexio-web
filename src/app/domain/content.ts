// Site content managed from the admin panel (/admin). Tables: API_NEEDED.md §10.
/** Copy edited in the admin panel: Spanish required, English optional (falls back). */
export interface LocalizedText {
  es: string;
  en?: string;
}

/** Create-or-update payload: `id: ''` creates a new row. */
export type Draft<T extends { id: string }> = T;

export type MediaKind = 'image' | 'video';

/** A file in the `site-media` bucket (photos and videos for ads, offers, hero). */
export interface MediaAsset {
  id: string;
  kind: MediaKind;
  url: string;
  name: string;
  sizeBytes: number;
  createdAt: string;
}

/** Where an ad/banner shows on the public site. */
export type AdPlacement = 'home_hero' | 'home_strip' | 'search_top' | 'car_sidebar';

export const AD_PLACEMENTS: readonly AdPlacement[] = [
  'home_hero',
  'home_strip',
  'search_top',
  'car_sidebar',
];

/** Hero slides, promo banners and ad slots (`banners` table, extended). */
export interface Advertisement {
  id: string;
  placement: AdPlacement;
  title: LocalizedText;
  subtitle?: LocalizedText;
  ctaLabel?: LocalizedText;
  /** Internal path (`/autos?body=pickup`) or absolute URL. */
  link?: string;
  mediaKind: MediaKind;
  mediaUrl: string;
  /** Still frame for videos (also used while the video loads). */
  posterUrl?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  sortOrder: number;
}

export type AlertTone = 'info' | 'promo' | 'warning';

/** Site-wide announcement bar above the header. */
export interface SiteAlert {
  id: string;
  message: LocalizedText;
  linkLabel?: LocalizedText;
  link?: string;
  tone: AlertTone;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface Offer {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  /** Short highlight, e.g. "-$20,000" or "0% enganche". */
  badge?: LocalizedText;
  imageUrl: string;
  link?: string;
  /** Promo code shown to the customer, if any. */
  code?: string;
  validUntil?: string;
  isActive: boolean;
  sortOrder: number;
}

/** Everything the public site reads in one request. */
export interface SiteContent {
  alerts: SiteAlert[];
  ads: Advertisement[];
  offers: Offer[];
  texts: Partial<Record<SiteTextKey, LocalizedText>>;
}

// ---- Editable copy ----------------------------------------------------------

/** Copy the admin can change; defaults ship with the site so it never renders empty. */
export const SITE_TEXTS = {
  'home.hero.eyebrow': {
    group: 'home',
    label: 'Portada · etiqueta',
    value: { es: 'Cada auto verificado por Carmexio', en: 'Every car verified by Carmexio' },
  },
  'home.hero.title': {
    group: 'home',
    label: 'Portada · título',
    value: { es: 'Encuentra tu próximo', en: 'Find your next' },
  },
  'home.hero.highlight': {
    group: 'home',
    label: 'Portada · título resaltado',
    value: { es: 'auto soñado', en: 'dream car' },
  },
  'home.hero.subtitle': {
    group: 'home',
    label: 'Portada · subtítulo',
    value: {
      es: 'Seminuevos inspeccionados en 150 puntos. Nosotros coordinamos visitas, pruebas de manejo y papeles.',
      en: 'Pre-owned cars inspected on 150 points. We arrange visits, test drives and paperwork.',
    },
  },
  'home.stats.1.value': { group: 'stats', label: 'Cifra 1 · valor', value: { es: '150' } },
  'home.stats.1.label': {
    group: 'stats',
    label: 'Cifra 1 · texto',
    value: { es: 'puntos de inspección', en: 'inspection points' },
  },
  'home.stats.2.value': { group: 'stats', label: 'Cifra 2 · valor', value: { es: '4' } },
  'home.stats.2.label': {
    group: 'stats',
    label: 'Cifra 2 · texto',
    value: { es: 'sucursales en México', en: 'showrooms in Mexico' },
  },
  'home.stats.3.value': { group: 'stats', label: 'Cifra 3 · valor', value: { es: '98%' } },
  'home.stats.3.label': {
    group: 'stats',
    label: 'Cifra 3 · texto',
    value: { es: 'clientes satisfechos', en: 'happy customers' },
  },
  'home.sell.title': {
    group: 'home',
    label: 'Bloque vender · título',
    value: { es: '¿Vendes tu auto?', en: 'Selling your car?' },
  },
  'home.sell.subtitle': {
    group: 'home',
    label: 'Bloque vender · texto',
    value: {
      es: 'Publica gratis con 11 fotos guiadas. Carmexio lo inspecciona y atiende a los compradores.',
      en: 'List it free with 11 guided photos. Carmexio inspects it and handles the buyers.',
    },
  },
  'offers.intro': {
    group: 'offers',
    label: 'Ofertas · introducción',
    value: {
      es: 'Promociones vigentes en autos Carmexio Certificados.',
      en: 'Current promotions on Carmexio Certified cars.',
    },
  },
  'footer.about': {
    group: 'footer',
    label: 'Pie de página · descripción',
    value: {
      es: 'Autos seminuevos verificados por Carmexio. Nosotros coordinamos cada visita.',
      en: 'Pre-owned cars verified by Carmexio. We arrange every visit.',
    },
  },
} as const satisfies Record<string, { group: string; label: string; value: LocalizedText }>;

export type SiteTextKey = keyof typeof SITE_TEXTS;
export const SITE_TEXT_KEYS = Object.keys(SITE_TEXTS) as SiteTextKey[];

// ---- Scheduling ---------------------------------------------------------------

export type LiveStatus = 'live' | 'scheduled' | 'expired' | 'off';

/** For admin lists: why an item is (not) showing on the site right now. */
export function liveStatus(
  item: { isActive: boolean; startsAt?: string; endsAt?: string },
  now = Date.now(),
): LiveStatus {
  if (!item.isActive) return 'off';
  if (item.startsAt && Date.parse(item.startsAt) > now) return 'scheduled';
  if (item.endsAt && Date.parse(item.endsAt) < now) return 'expired';
  return 'live';
}

/** Active and inside its optional start/end window. */
export function isLive(
  item: { isActive: boolean; startsAt?: string; endsAt?: string },
  now = Date.now(),
): boolean {
  if (!item.isActive) return false;
  if (item.startsAt && Date.parse(item.startsAt) > now) return false;
  return !(item.endsAt && Date.parse(item.endsAt) < now);
}
