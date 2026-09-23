// Domain entities — mirror ../carmexio/lib/features/*/domain/entities.
// Column names/values follow ../carmexio/API_NEEDED.md.

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
export type Transmission = 'automatic' | 'manual';
export type BodyType = 'suv' | 'pickup' | 'sedan' | 'hatchback' | 'coupe' | 'van' | 'convertible';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'rejected';
export type SortOption = 'newest' | 'priceLow' | 'priceHigh' | 'mileageLow' | 'yearNew';

export const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  hybrid: 'Híbrido',
  electric: 'Eléctrico',
  lpg: 'Gas LP',
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  automatic: 'Automática',
  manual: 'Manual',
};

export const BODY_LABELS: Record<BodyType, string> = {
  suv: 'SUV',
  pickup: 'Pickup',
  sedan: 'Sedán',
  hatchback: 'Hatchback',
  coupe: 'Coupé',
  van: 'Van',
  convertible: 'Convertible',
};

export const STATUS_OWNER_LABELS: Record<ListingStatus, string> = {
  active: 'Publicado',
  pending: 'En revisión por Carmexio',
  sold: 'Vendido',
  rejected: 'Cambios solicitados',
};

/** Staff-facing status names (portal, review queue). */
export const STATUS_STAFF_LABELS: Record<ListingStatus, string> = {
  active: 'Publicado',
  pending: 'Pendiente',
  sold: 'Vendido',
  rejected: 'Rechazado',
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Más recientes',
  priceLow: 'Precio: menor a mayor',
  priceHigh: 'Precio: mayor a menor',
  mileageLow: 'Menor kilometraje',
  yearNew: 'Modelo más reciente',
};

/** Mandatory photo angles, in canonical order (`listings.image_angles`). */
export const PHOTO_ANGLES = [
  { value: 'front', label: 'Frente', instruction: 'A 3 m de frente, auto completo.' },
  { value: 'front_left', label: 'Frente ¾ izq.', instruction: 'Esquina a 45°, ruedas visibles.' },
  {
    value: 'left_side',
    label: 'Lado izquierdo',
    instruction: 'Perfil completo, puertas cerradas.',
  },
  { value: 'rear', label: 'Trasera', instruction: 'De frente a la parte trasera, placa visible.' },
  { value: 'rear_right', label: 'Trasera ¾ der.', instruction: 'Esquina trasera a 45°.' },
  { value: 'right_side', label: 'Lado derecho', instruction: 'Perfil completo, puertas cerradas.' },
  { value: 'dashboard', label: 'Tablero', instruction: 'Motor encendido, kilometraje legible.' },
  {
    value: 'front_seats',
    label: 'Asientos delanteros',
    instruction: 'Desde la puerta del conductor.',
  },
  { value: 'rear_seats', label: 'Asientos traseros', instruction: 'Desde la puerta trasera.' },
  { value: 'engine', label: 'Motor', instruction: 'Cofre abierto, motor completo.' },
  { value: 'trunk', label: 'Cajuela / caja', instruction: 'Abierta y vacía.' },
] as const;

export type PhotoAngle = (typeof PHOTO_ANGLES)[number]['value'];

export interface DealerLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface Car {
  id: string;
  sellerId: string;
  locationId: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  price: number;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  engineCc?: number;
  exteriorColor?: string;
  city: string;
  description: string;
  images: string[];
  imageAngles: PhotoAngle[];
  features: string[];
  owners?: number;
  status: ListingStatus;
  isFeatured: boolean;
  isVerified: boolean;
  inspectionScore?: number;
  rejectionReason?: string;
  viewsCount: number;
  favoritesCount: number;
  createdAt: string;
  updatedAt: string;
  location?: DealerLocation;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  models: string[];
  listingsCount: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel?: string;
  deepLink?: string;
}

export interface CarFilter {
  query?: string;
  brand?: string;
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: Transmission;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  sort?: SortOption;
}

export interface Page<T> {
  items: T[];
  page: number;
  hasMore: boolean;
}

// ---- Inspection ---------------------------------------------------------

export type CarPanel =
  | 'front_bumper'
  | 'hood'
  | 'roof'
  | 'trunk'
  | 'rear_bumper'
  | 'front_left_fender'
  | 'front_left_door'
  | 'rear_left_door'
  | 'rear_left_quarter'
  | 'front_right_fender'
  | 'front_right_door'
  | 'rear_right_door'
  | 'rear_right_quarter'
  | 'left_rocker'
  | 'right_rocker';

export type DefectSeverity = 'minor' | 'moderate' | 'major';

export const DEFECT_CODES = {
  P: { label: 'Pintura retocada', severity: 'minor' },
  A1: { label: 'Rayón pequeño', severity: 'minor' },
  A2: { label: 'Rayón', severity: 'moderate' },
  A3: { label: 'Rayón grande', severity: 'moderate' },
  U1: { label: 'Abolladura pequeña', severity: 'moderate' },
  B2: { label: 'Abolladura con rayón', severity: 'major' },
  S1: { label: 'Óxido', severity: 'major' },
  '•': { label: 'Detalles menores', severity: 'minor' },
} as const satisfies Record<string, { label: string; severity: DefectSeverity }>;

export type DefectCode = keyof typeof DEFECT_CODES;
export type CheckStatus = 'ok' | 'attention' | 'fail';

export interface BodyDefect {
  panel: CarPanel;
  code: DefectCode;
  note?: string;
}

export interface InspectionCategory {
  name: string;
  items: { name: string; status: CheckStatus; note?: string }[];
}

export interface InspectionReport {
  listingId: string;
  locationId: string;
  overallScore: number;
  summary?: string;
  inspectorName: string;
  inspectedAt: string;
  categories: InspectionCategory[];
  bodyDefects: BodyDefect[];
}

/** ok = 1, attention = 0.5, fail = 0 → percentage. */
export function categoryScore(category: InspectionCategory): number {
  if (!category.items.length) return 100;
  const points = category.items.reduce(
    (sum, i) => sum + (i.status === 'ok' ? 1 : i.status === 'attention' ? 0.5 : 0),
    0,
  );
  return Math.round((points / category.items.length) * 100);
}

// ---- Users & chat --------------------------------------------------------

export type UserRole = 'user' | 'staff' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  city?: string;
  avatarUrl?: string;
  role: UserRole;
  locationId?: string;
}

export interface Conversation {
  id: string;
  location: DealerLocation;
  listingId?: string;
  listingTitle?: string;
  listingPrice?: number;
  listingImage?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  fromDealer: boolean;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface ListingDraft {
  brand: string;
  model: string;
  version?: string;
  year: number;
  price: number;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  engineCc?: number;
  exteriorColor?: string;
  locationId: string;
  description: string;
  features: string[];
  photos: Partial<Record<PhotoAngle, string>>;
}

export type ProfileChanges = Partial<Pick<AppUser, 'fullName' | 'phone' | 'city'>>;

// ---- Staff ----------------------------------------------------------------

/** What an owner may do to their own ad (the DB guard enforces the rest). */
export type OwnerStatusChange = Extract<ListingStatus, 'sold' | 'pending'>;

export interface ListingFlags {
  isFeatured?: boolean;
  isVerified?: boolean;
}

export interface StaffListingFilter {
  locationId?: string;
  status?: ListingStatus;
  query?: string;
}

export interface StaffStats {
  pending: number;
  active: number;
  rejected: number;
  soldThisMonth: number;
  unreadChats: number;
  withoutInspection: number;
}

// ---- Errors ---------------------------------------------------------------

export type AppErrorKind = 'network' | 'auth' | 'notFound' | 'validation' | 'server';

/** The only error type repositories reject with; `message` is user-facing (es-MX). */
export class AppError extends Error {
  constructor(
    message: string,
    readonly kind: AppErrorKind = 'server',
  ) {
    super(message);
    this.name = 'AppError';
  }
}
