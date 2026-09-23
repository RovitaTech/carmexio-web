// Row (snake_case, as in ../carmexio/API_NEEDED.md) → domain entity.
// Shared by the dummy and Supabase repositories.
import {
  AppUser,
  Brand,
  BodyDefect,
  Car,
  ChatMessage,
  Conversation,
  DealerLocation,
  InspectionReport,
  ListingDraft,
  PHOTO_ANGLES,
  PhotoAngle,
  PromoBanner,
} from '../domain/models';

// Untyped DB rows stop here: mappers are the only place that reads them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const ANGLE_VALUES = new Set<string>(PHOTO_ANGLES.map((a) => a.value));

export function toLocation(r: Row): DealerLocation {
  return {
    id: r['id'],
    name: r['name'],
    city: r['city'],
    address: r['address'] ?? '',
    phone: r['phone'] ?? '',
    whatsapp: r['whatsapp'] ?? '',
    hours: r['hours'] ?? '',
    latitude: r['latitude'] ?? undefined,
    longitude: r['longitude'] ?? undefined,
    imageUrl: r['image_url'] ?? undefined,
  };
}

export function toCar(r: Row): Car {
  return {
    id: r['id'],
    sellerId: r['seller_id'],
    locationId: r['location_id'],
    brand: r['brand'],
    model: r['model'],
    version: r['version'] ?? undefined,
    year: r['year'],
    price: r['price'],
    mileageKm: r['mileage_km'],
    fuelType: r['fuel_type'],
    transmission: r['transmission'],
    bodyType: r['body_type'],
    engineCc: r['engine_cc'] ?? undefined,
    exteriorColor: r['exterior_color'] ?? undefined,
    city: r['city'],
    description: r['description'] ?? '',
    images: r['images'] ?? [],
    imageAngles: ((r['image_angles'] ?? []) as string[]).filter((a): a is PhotoAngle =>
      ANGLE_VALUES.has(a),
    ),
    features: r['features'] ?? [],
    owners: r['owners'] ?? undefined,
    status: r['status'],
    isFeatured: r['is_featured'] ?? false,
    isVerified: r['is_verified'] ?? false,
    inspectionScore: r['inspection_score'] ?? undefined,
    rejectionReason: r['rejection_reason'] ?? undefined,
    viewsCount: r['views_count'] ?? 0,
    favoritesCount: r['favorites_count'] ?? 0,
    createdAt: r['created_at'],
    updatedAt: r['updated_at'] ?? r['created_at'],
    location: r['location'] ? toLocation(r['location']) : undefined,
  };
}

export function toBrand(r: Row): Brand {
  return {
    id: r['id'],
    name: r['name'],
    logoUrl: r['logo_url'] ?? undefined,
    models: r['models'] ?? [],
    listingsCount: r['listings_count'] ?? 0,
  };
}

export function toBanner(r: Row): PromoBanner {
  return {
    id: r['id'],
    title: r['title'],
    subtitle: r['subtitle'],
    imageUrl: r['image_url'],
    ctaLabel: r['cta_label'] ?? undefined,
    deepLink: r['deep_link'] ?? undefined,
  };
}

export function toInspection(r: Row): InspectionReport {
  return {
    listingId: r['listing_id'],
    locationId: r['location_id'],
    overallScore: Number(r['overall_score']),
    summary: r['summary'] ?? undefined,
    inspectorName: r['inspector_name'] ?? 'Carmexio',
    inspectedAt: r['inspected_at'],
    categories: r['categories'] ?? [],
    bodyDefects: (r['body_defects'] ?? []) as BodyDefect[],
  };
}

export function toConversation(r: Row): Conversation {
  const listing = r['listing'] as Row | null;
  return {
    id: r['id'],
    location: toLocation(r['location']),
    listingId: listing?.['id'],
    listingTitle: listing
      ? `${listing['brand']} ${listing['model']} ${listing['year']}`
      : undefined,
    listingPrice: listing?.['price'],
    listingImage: listing?.['images']?.[0],
    lastMessage: r['last_message'] ?? undefined,
    lastMessageAt: r['last_message_at'] ?? r['created_at'],
    unreadCount: r['user_unread_count'] ?? 0,
  };
}

export function toMessage(r: Row): ChatMessage {
  return {
    id: r['id'],
    conversationId: r['conversation_id'],
    senderId: r['sender_id'],
    fromDealer: r['sender_role'] === 'staff',
    body: r['body'],
    createdAt: r['created_at'],
    readAt: r['read_at'] ?? undefined,
  };
}

export function inspectionToRow(report: InspectionReport): Row {
  return {
    listing_id: report.listingId,
    location_id: report.locationId,
    overall_score: report.overallScore,
    summary: report.summary ?? null,
    inspector_name: report.inspectorName,
    inspected_at: report.inspectedAt,
    categories: report.categories,
    body_defects: report.bodyDefects,
  };
}

export function toUser(r: Row): AppUser {
  return {
    id: r['id'],
    email: r['email'] ?? '',
    fullName: r['full_name'] ?? '',
    phone: r['phone'] ?? undefined,
    city: r['city'] ?? undefined,
    avatarUrl: r['avatar_url'] ?? undefined,
    role: r['role'] ?? 'user',
    locationId: r['location_id'] ?? undefined,
  };
}

/** Client-writable listing columns; photos in canonical angle order. */
export function draftToRow(d: ListingDraft): Row {
  const angles = PHOTO_ANGLES.map((a) => a.value).filter((a) => d.photos[a]);
  return {
    location_id: d.locationId,
    brand: d.brand,
    model: d.model,
    version: d.version ?? null,
    year: d.year,
    price: d.price,
    mileage_km: d.mileageKm,
    fuel_type: d.fuelType,
    transmission: d.transmission,
    body_type: d.bodyType,
    engine_cc: d.engineCc ?? null,
    exterior_color: d.exteriorColor ?? null,
    description: d.description,
    features: d.features,
    images: angles.map((a) => d.photos[a]!),
    image_angles: angles,
  };
}
