import { BodyType, Brand, DealerLocation, FuelType, Transmission } from '../../../domain/models';
import { StockItem } from '../../../domain/stock-import';
import { CatalogField, ColumnMap, mapColumns } from './catalog-columns';
import {
  bodyForModel,
  detectBody,
  detectFuel,
  detectTransmission,
  findBrand,
  fold,
  isSoldOut,
  parseMileage,
  parsePrice,
  parseYear,
  splitUrls,
} from './catalog-values';

/** A car being prepared: every field the admin may still have to fill in the preview. */
export interface StockDraft {
  externalId: string;
  brand: string;
  model: string;
  version: string | null;
  year: number | null;
  price: number | null;
  mileageKm: number | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  bodyType: BodyType | null;
  exteriorColor: string | null;
  description: string;
  locationId: string | null;
  imageUrls: string[];
  sold: boolean;
}

export interface ImportRow {
  /** Line in the file (the header is line 1). */
  line: number;
  title: string;
  draft: StockDraft;
  /** Guesses the admin should glance at (never block the import). */
  notes: string[];
}

export interface CatalogContext {
  brands: readonly Brand[];
  locations: readonly DealerLocation[];
  /** Latest accepted model year (current year + 1). */
  maxYear: number;
}

export interface ParsedCatalog {
  rows: ImportRow[];
  columns: ColumnMap;
}

/** Header row + data rows → one draft per car. */
export function readCatalog(table: readonly string[][], ctx: CatalogContext): ParsedCatalog {
  const [header = [], ...data] = table;
  const columns = mapColumns(header);
  const rows = data.map((cells, i) => toRow(cells, i + 2, columns, ctx));
  markDuplicates(rows);
  return { rows, columns };
}

function toRow(
  cells: readonly string[],
  line: number,
  cols: ColumnMap,
  ctx: CatalogContext,
): ImportRow {
  const get = (f: CatalogField) => {
    const i = cols.fields[f];
    return i === undefined ? '' : (cells[i] ?? '').trim();
  };
  const notes: string[] = [];
  const title = get('title') || [get('brand'), get('model'), get('year')].filter(Boolean).join(' ');
  const description = get('description');
  const text = `${title} ${description}`;

  const brand =
    get('brand') ||
    findBrand(
      ctx.brands.map((b) => b.name),
      title,
    ) ||
    '';
  const model = get('model') || guessModel(title, brand, ctx.brands);
  if (brand && !ctx.brands.some((b) => fold(b.name) === fold(brand))) {
    notes.push(`Marca nueva en el catálogo: "${brand}".`);
  }

  const priceCell = get('salePrice') || get('price');
  const price = parsePrice(priceCell);
  if (price.currency && price.currency !== 'MXN')
    notes.push(`Precio en ${price.currency}: revisa que sea en pesos.`);

  let fuelType = detectFuel(get('fuel')) ?? detectFuel(text) ?? null;
  if (!fuelType) {
    fuelType = 'gasoline';
    notes.push('Combustible no indicado: se asumió gasolina.');
  }

  const images = [
    ...new Set(
      splitUrls(get('image'), get('extraImages'), ...cols.imageColumns.map((i) => cells[i] ?? '')),
    ),
  ];
  const https = images.filter((u) => u.toLowerCase().startsWith('https://'));
  if (https.length < images.length) notes.push('Se ignoraron fotos sin https.');

  let externalId = get('id');
  if (!externalId && title) {
    externalId = `titulo-${fold(title)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`.slice(0, 100);
    notes.push('Sin id en el archivo: se usará el título (cambiarlo creará otro auto).');
  }

  return {
    line,
    title: title || `Fila ${line}`,
    notes,
    draft: {
      externalId,
      brand,
      model,
      version: get('version') || null,
      year: Number(get('year')) || parseYear(title, description) || null,
      price: price.value ?? null,
      mileageKm: parseMileage(get('mileage'), title, description) ?? null,
      fuelType,
      transmission: detectTransmission(get('transmission')) ?? detectTransmission(text) ?? null,
      bodyType: detectBody(get('body')) ?? detectBody(text) ?? bodyForModel(model) ?? null,
      exteriorColor: get('color') || null,
      description: (description || title).slice(0, 1500),
      locationId: matchBranch(get('branch'), ctx.locations),
      imageUrls: https,
      sold: isSoldOut(get('availability')),
    },
  };
}

/** Longest known model of the brand found in the title, else the word after the brand. */
function guessModel(title: string, brand: string, brands: readonly Brand[]): string {
  const known = brands.find((b) => fold(b.name) === fold(brand))?.models ?? [];
  const t = ` ${fold(title).replace(/[^a-z0-9-]+/g, ' ')} `;
  const hit = [...known]
    .sort((a, b) => b.length - a.length)
    .find((m) => t.includes(` ${fold(m)} `));
  if (hit) return hit;
  const words = title.split(/\s+/);
  const at = words.findIndex((w) => fold(w) === fold(brand.split(/[\s-]/)[0] ?? ''));
  const next = at >= 0 ? words[at + 1] : undefined;
  return next && !/^\d{4}$/.test(next) ? next : '';
}

const BRANCH_ALIASES: Record<string, string[]> = {
  'loc-cdmx': ['cdmx', 'df', 'ciudad de mexico', 'mexico city', 'mexico'],
  'loc-gdl': ['gdl', 'guadalajara', 'jalisco', 'zapopan'],
  'loc-qro': ['qro', 'queretaro'],
  'loc-tij': ['tij', 'tijuana', 'baja california'],
};
/** Branch cell → location id by id, name, city or common abbreviation. */
export function matchBranch(cell: string, locations: readonly DealerLocation[]): string | null {
  const v = fold(cell)
    .replace(/^carmexio\s+/, '')
    .trim();
  if (!v) return null;
  const direct = locations.find(
    (l) => fold(l.id) === v || fold(l.name).replace(/^carmexio\s+/, '') === v || fold(l.city) === v,
  );
  if (direct) return direct.id;
  const alias = Object.entries(BRANCH_ALIASES).find(([, names]) => names.includes(v))?.[0];
  return alias && locations.some((l) => l.id === alias) ? alias : null;
}

function markDuplicates(rows: ImportRow[]): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const first = seen.get(row.draft.externalId);
    if (first)
      row.notes.push(`Mismo id que la fila ${first}: se importará solo la última versión.`);
    else if (row.draft.externalId) seen.set(row.draft.externalId, row.line);
  }
}

/** What still blocks the import (recomputed live as the admin edits). */
export function draftProblems(d: StockDraft, maxYear: number): string[] {
  const p: string[] = [];
  if (!d.externalId) p.push('id');
  if (!d.brand) p.push('marca');
  if (!d.model) p.push('modelo');
  if (!d.year || d.year < 1980 || d.year > maxYear) p.push('año');
  if (!d.price || d.price < 20_000 || d.price > 50_000_000) p.push('precio');
  if (d.mileageKm === null || d.mileageKm < 0 || d.mileageKm > 1_500_000) p.push('kilometraje');
  if (!d.fuelType) p.push('combustible');
  if (!d.transmission) p.push('transmisión');
  if (!d.bodyType) p.push('carrocería');
  if (!d.locationId) p.push('sucursal');
  if (!d.imageUrls.length) p.push('fotos');
  return p;
}

/** A complete draft → what the API accepts (null while something is missing). */
export function toStockItem(d: StockDraft, maxYear: number): StockItem | null {
  if (draftProblems(d, maxYear).length) return null;
  return {
    externalId: d.externalId,
    brand: d.brand,
    model: d.model,
    version: d.version,
    year: d.year!,
    price: d.price!,
    mileageKm: d.mileageKm!,
    fuelType: d.fuelType!,
    transmission: d.transmission!,
    bodyType: d.bodyType!,
    exteriorColor: d.exteriorColor,
    description: d.description,
    locationId: d.locationId!,
    imageUrls: d.imageUrls.slice(0, 20),
    sold: d.sold,
  };
}
