// DELETE WHEN LIVE — in-memory stand-in for Supabase, seeded from the same
// data as the Flutter app (../carmexio/tool/export_dummy_seed.dart).
import seed from './seed.json';
import { AppError } from '../../domain/models';
import { Row } from '../mappers';

/** Shifts every timestamp so the seed always looks "fresh". */
function shiftDates<T>(value: T, offsetMs: number): T {
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, offsetMs)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        typeof v === 'string' && /_at$/.test(k)
          ? new Date(Date.parse(v) + offsetMs).toISOString()
          : shiftDates(v, offsetMs),
      ]),
    ) as T;
  }
  return value;
}

export class DummyDb {
  readonly latencyMs: number;
  readonly profiles: Row[];
  readonly locations: Row[];
  readonly brands: Row[];
  readonly banners: Row[];
  readonly listings: Row[];
  readonly inspections: Row[];
  readonly conversations: Row[];
  readonly messages: Row[];
  readonly favorites = new Map<string, Set<string>>();
  readonly passwords = new Map<string, string>();
  readonly staffId = seed.staff_id;
  readonly autoReplies = seed.auto_replies;
  currentUserId: string | null = null;

  constructor(latencyMs = 350) {
    this.latencyMs = latencyMs;
    const data = shiftDates(structuredClone(seed), Date.now() - Date.parse(seed.exported_at));
    this.profiles = data.profiles as Row[];
    this.locations = data.locations as Row[];
    this.brands = data.brands as Row[];
    this.banners = data.banners as Row[];
    this.listings = data.listings as Row[];
    this.inspections = data.inspection_reports as Row[];
    this.conversations = data.conversations as Row[];
    this.messages = data.messages as Row[];
    for (const [user, ids] of Object.entries(data.favorites)) {
      this.favorites.set(user, new Set(ids as string[]));
    }
    this.passwords.set(seed.demo.email, seed.demo.password);
    // Demo staff account for the /staff portal.
    this.profiles.push({
      id: seed.staff_id,
      email: 'staff@carmexio.mx',
      full_name: 'Carmexio Staff',
      role: 'admin',
      location_id: 'loc-cdmx',
      created_at: new Date().toISOString(),
    });
    this.passwords.set('staff@carmexio.mx', 'carmexio123');
  }

  delay(factor = 1): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs * factor));
  }

  location(id: string | undefined): Row | undefined {
    return this.locations.find((l) => l['id'] === id);
  }

  listing(id: string): Row | undefined {
    return this.listings.find((l) => l['id'] === id);
  }

  withLocation(row: Row): Row {
    return { ...row, location: this.location(row['location_id']) };
  }

  nextId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

export function requireUser(db: DummyDb): string {
  if (!db.currentUserId) throw new AppError('Inicia sesión para continuar.', 'auth');
  return db.currentUserId;
}
