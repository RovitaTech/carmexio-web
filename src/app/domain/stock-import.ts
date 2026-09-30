// Carmexio's own stock loaded from the WhatsApp Business catalog (/admin/importar).
// Mirrors carmexio-BE `POST /v1/admin/listings/import` (docs/API_MAP.md).
import { BodyType, FuelType, Transmission } from './models';

/** One car, normalised and validated in the browser before it is sent. */
export interface StockItem {
  /** Catalog item id (retailer id): re-importing the same id updates the car. */
  externalId: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  price: number;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  exteriorColor: string | null;
  description: string;
  locationId: string;
  /** Catalog photo URLs (https); the server copies them into storage. */
  imageUrls: string[];
  /** Out of stock in the catalog → sold. */
  sold: boolean;
}

export type StockImportStatus = 'created' | 'updated' | 'failed';

export interface StockImportOutcome {
  externalId: string;
  status: StockImportStatus;
  listingId: string | null;
  photos: { copied: number; failed: number; reused: number };
  error: { code: string; message: string } | null;
}

/** The server accepts at most this many cars per request. */
export const STOCK_IMPORT_BATCH = 10;
