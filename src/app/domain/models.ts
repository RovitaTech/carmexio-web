// Domain entities — mirror ../carmexio/lib/features/*/domain/entities.
// Column names/values follow ../carmexio/API_NEEDED.md.

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
export type Transmission = 'automatic' | 'manual';
export type BodyType = 'suv' | 'pickup' | 'sedan' | 'hatchback' | 'coupe' | 'van' | 'convertible';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'rejected';
export type SortOption = 'newest' | 'priceLow' | 'priceHigh' | 'mileageLow' | 'yearNew';

export const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: $localize`:@@fuel.gasoline:Gasolina`,
  diesel: $localize`:@@fuel.diesel:Diésel`,
  hybrid: $localize`:@@fuel.hybrid:Híbrido`,
  electric: $localize`:@@fuel.electric:Eléctrico`,
  lpg: $localize`:@@fuel.lpg:Gas LP`,
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  automatic: $localize`:@@transmission.automatic:Automática`,
  manual: $localize`:@@transmission.manual:Manual`,
};

export const BODY_LABELS: Record<BodyType, string> = {
  suv: $localize`:@@body.suv:SUV`,
  pickup: $localize`:@@body.pickup:Pickup`,
  sedan: $localize`:@@body.sedan:Sedán`,
  hatchback: $localize`:@@body.hatchback:Hatchback`,
  coupe: $localize`:@@body.coupe:Coupé`,
  van: $localize`:@@body.van:Van`,
  convertible: $localize`:@@body.convertible:Convertible`,
};

export const STATUS_OWNER_LABELS: Record<ListingStatus, string> = {
  active: $localize`:@@status.active:Publicado`,
  pending: $localize`:@@status.pending:En revisión por Carmexio`,
  sold: $localize`:@@status.sold:Vendido`,
  rejected: $localize`:@@status.rejected:Cambios solicitados`,
};

/** Staff-facing status names (portal, review queue). */
export const STATUS_STAFF_LABELS: Record<ListingStatus, string> = {
  active: 'Publicado',
  pending: 'Pendiente',
  sold: 'Vendido',
  rejected: 'Rechazado',
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: $localize`:@@sort.newest:Más recientes`,
  priceLow: $localize`:@@sort.priceLow:Precio: menor a mayor`,
  priceHigh: $localize`:@@sort.priceHigh:Precio: mayor a menor`,
  mileageLow: $localize`:@@sort.mileageLow:Menor kilometraje`,
  yearNew: $localize`:@@sort.yearNew:Modelo más reciente`,
};

/** Mandatory photo angles, in canonical order (`listings.image_angles`). */
export const PHOTO_ANGLES = [
  {
    value: 'front',
    label: $localize`:@@angle.front.label:Frente`,
    instruction: $localize`:@@angle.front.hint:A 3 m de frente, auto completo.`,
  },
  {
    value: 'front_left',
    label: $localize`:@@angle.front_left.label:Frente ¾ izq.`,
    instruction: $localize`:@@angle.front_left.hint:Esquina a 45°, ruedas visibles.`,
  },
  {
    value: 'left_side',
    label: $localize`:@@angle.left_side.label:Lado izquierdo`,
    instruction: $localize`:@@angle.left_side.hint:Perfil completo, puertas cerradas.`,
  },
  {
    value: 'rear',
    label: $localize`:@@angle.rear.label:Trasera`,
    instruction: $localize`:@@angle.rear.hint:De frente a la parte trasera, placa visible.`,
  },
  {
    value: 'rear_right',
    label: $localize`:@@angle.rear_right.label:Trasera ¾ der.`,
    instruction: $localize`:@@angle.rear_right.hint:Esquina trasera a 45°.`,
  },
  {
    value: 'right_side',
    label: $localize`:@@angle.right_side.label:Lado derecho`,
    instruction: $localize`:@@angle.right_side.hint:Perfil completo, puertas cerradas.`,
  },
  {
    value: 'dashboard',
    label: $localize`:@@angle.dashboard.label:Tablero`,
    instruction: $localize`:@@angle.dashboard.hint:Motor encendido, kilometraje legible.`,
  },
  {
    value: 'front_seats',
    label: $localize`:@@angle.front_seats.label:Asientos delanteros`,
    instruction: $localize`:@@angle.front_seats.hint:Desde la puerta del conductor.`,
  },
  {
    value: 'rear_seats',
    label: $localize`:@@angle.rear_seats.label:Asientos traseros`,
    instruction: $localize`:@@angle.rear_seats.hint:Desde la puerta trasera.`,
  },
  {
    value: 'engine',
    label: $localize`:@@angle.engine.label:Motor`,
    instruction: $localize`:@@angle.engine.hint:Cofre abierto, motor completo.`,
  },
  {
    value: 'trunk',
    label: $localize`:@@angle.trunk.label:Cajuela / caja`,
    instruction: $localize`:@@angle.trunk.hint:Abierta y vacía.`,
  },
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
  P: { label: $localize`:@@defect.P:Pintura retocada`, severity: 'minor' },
  A1: { label: $localize`:@@defect.A1:Rayón pequeño`, severity: 'minor' },
  A2: { label: $localize`:@@defect.A2:Rayón`, severity: 'moderate' },
  A3: { label: $localize`:@@defect.A3:Rayón grande`, severity: 'moderate' },
  U1: { label: $localize`:@@defect.U1:Abolladura pequeña`, severity: 'moderate' },
  B2: { label: $localize`:@@defect.B2:Abolladura con rayón`, severity: 'major' },
  S1: { label: $localize`:@@defect.S1:Óxido`, severity: 'major' },
  '•': { label: $localize`:@@defect.dot:Detalles menores`, severity: 'minor' },
} satisfies Record<string, { label: string; severity: DefectSeverity }>;

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
