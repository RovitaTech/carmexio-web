import { BodyType, FuelType, Transmission } from '../../../domain/models';

/** Lowercase, no accents: "Querétaro" → "queretaro". */
export const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * "$459,900", "459,900.00 MXN", "MXN 1.049.000", "459900" → 459900 (whole pesos).
 * A separator followed by exactly two final digits is a decimal part.
 */
export function parsePrice(raw: string): { value?: number; currency?: string } {
  const currency = /\b(MXN|USD|US\$|EUR)\b/i.exec(raw)?.[1]?.toUpperCase().replace('US$', 'USD');
  const digits = raw.replace(/[^\d.,]/g, '');
  if (!digits) return { currency };
  const whole = digits.replace(/[.,]\d{2}$/, '').replace(/[.,]/g, '');
  const value = Number(whole);
  return { value: Number.isFinite(value) && value > 0 ? value : undefined, currency };
}

export function parseYear(...texts: string[]): number | undefined {
  for (const text of texts) {
    const m = /\b(19[89]\d|20[0-4]\d)\b/.exec(text);
    if (m) return Number(m[1]);
  }
  return undefined;
}

/** A mileage column ("61200", "61,200 km") or free text ("45 mil km", "61k kms"). */
export function parseMileage(column: string | undefined, ...texts: string[]): number | undefined {
  if (column) {
    const n = Number(column.replace(/[^\d]/g, ''));
    if (column.trim() && Number.isFinite(n))
      return /\bmi(les)?\b/i.test(column) ? Math.round(n * 1.609) : n;
  }
  for (const text of texts) {
    const m = /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(mil|k)?\s*(?:km|kms|kilometros|kilómetros)\b/i.exec(
      text,
    );
    if (m) return Number(m[1].replace(/[.,]/g, '')) * (m[2] ? 1000 : 1);
  }
  return undefined;
}

const FUEL_WORDS: [RegExp, FuelType][] = [
  [/\b(diesel|diésel)\b/, 'diesel'],
  [/\b(hibrido|hybrid|hev|phev)\b/, 'hybrid'],
  [/\b(electrico|electric|ev)\b/, 'electric'],
  [/\b(gas lp|glp|lpg)\b/, 'lpg'],
  [/\b(gasolina|gasoline|petrol|nafta|gas)\b/, 'gasoline'],
];
// Not "auto": in Spanish it just means "car" ("Vendo auto…").
const TRANSMISSION_WORDS: [RegExp, Transmission][] = [
  [/\b(automatic[ao]?|automatic|aut|cvt|tiptronic|dsg|dct)\b/, 'automatic'],
  [/\b(manual|estandar|std|mt)\b/, 'manual'],
];
const BODY_WORDS: [RegExp, BodyType][] = [
  [/\b(pick ?up|pickup|doble cabina|cabina sencilla|redilas)\b/, 'pickup'],
  [/\b(convertible|cabrio|roadster)\b/, 'convertible'],
  [/\b(minivan|van|panel)\b/, 'van'],
  [/\b(coupe|cupe)\b/, 'coupe'],
  [/\b(hatchback|hatch|hb)\b/, 'hatchback'],
  [/\b(sedan)\b/, 'sedan'],
  [/\b(suv|crossover|camioneta)\b/, 'suv'],
];

const firstMatch = <T>(table: [RegExp, T][], ...texts: string[]): T | undefined => {
  const text = fold(texts.join(' '));
  return table.find(([re]) => re.test(text))?.[1];
};
export const detectFuel = (...t: string[]) => firstMatch(FUEL_WORDS, ...t);
export const detectTransmission = (...t: string[]) => firstMatch(TRANSMISSION_WORDS, ...t);
export const detectBody = (...t: string[]) => firstMatch(BODY_WORDS, ...t);

/** Body type of common models in Mexico when the listing doesn't say it. */
const MODELS_BY_BODY: Record<BodyType, string[]> = {
  pickup: [
    'hilux',
    'tacoma',
    'tundra',
    'np300',
    'frontier',
    'silverado',
    'cheyenne',
    'colorado',
    'lobo',
    'ranger',
    'maverick',
    '1500',
    '2500',
    '700',
    'gladiator',
    'tornado',
    'l200',
    'amarok',
    's10',
  ],
  suv: [
    'rav4',
    'cr-v',
    'hr-v',
    'cx-3',
    'cx-5',
    'cx-30',
    'cx-50',
    'cx-90',
    'tucson',
    'creta',
    'santa fe',
    'sportage',
    'seltos',
    'sorento',
    'kicks',
    'x-trail',
    'tiguan',
    'taos',
    't-cross',
    'explorer',
    'bronco',
    'escape',
    'edge',
    'tahoe',
    'suburban',
    'trax',
    'equinox',
    'wrangler',
    'grand cherokee',
    'compass',
    'x1',
    'x3',
    'x5',
    'q3',
    'q5',
    'gla',
    'glc',
    'gle',
    'cayenne',
    'macan',
  ],
  sedan: [
    'versa',
    'sentra',
    'altima',
    'corolla',
    'camry',
    'yaris',
    'jetta',
    'vento',
    'virtus',
    'aveo',
    'onix',
    'city',
    'civic',
    'accord',
    'rio',
    'forte',
    'k3',
    'accent',
    'elantra',
    'serie 3',
    'clase c',
    'a3',
    'a4',
    'taycan',
  ],
  hatchback: ['golf', 'polo', 'march', 'grand i10', 'swift', 'fit', '2', '3', 'clase a'],
  coupe: ['mustang', 'camaro', '911', 'r8', 'amg c63', 'serie 4'],
  van: ['sienna', 'odyssey', 'urvan', 'hiace', 'transit'],
  convertible: [],
};
const MODEL_BODY = new Map(
  (Object.entries(MODELS_BY_BODY) as [BodyType, string[]][]).flatMap(([body, models]) =>
    models.map((m) => [m, body] as const),
  ),
);
/** Exact model name first ("Grand Cherokee"), then its first word ("Wrangler Rubicon"). */
export function bodyForModel(model: string): BodyType | undefined {
  const key = fold(model).trim().replace(/\s+/g, ' ');
  return MODEL_BODY.get(key) ?? MODEL_BODY.get(key.split(' ')[0]);
}

const BRAND_ALIASES: Record<string, string> = {
  vw: 'Volkswagen',
  volks: 'Volkswagen',
  chevy: 'Chevrolet',
  mercedes: 'Mercedes-Benz',
  benz: 'Mercedes-Benz',
  mb: 'Mercedes-Benz',
};
/** Known brand name mentioned in the text (or a common alias), longest name first. */
export function findBrand(known: readonly string[], text: string): string | undefined {
  const t = ` ${fold(text).replace(/[^a-z0-9-]+/g, ' ')} `;
  const byLength = [...known].sort((a, b) => b.length - a.length);
  const hit = byLength.find((b) => t.includes(` ${fold(b)} `));
  if (hit) return hit;
  const alias = Object.keys(BRAND_ALIASES).find((a) => t.includes(` ${a} `));
  return alias ? BRAND_ALIASES[alias] : undefined;
}

/** "out of stock", "agotado", "vendido" → true. */
export const isSoldOut = (availability: string) =>
  /\b(out of stock|sold|vendido|agotado|no disponible|discontinued)\b/.test(fold(availability));

/** Photo URLs from one or more cells (comma / space / pipe separated). */
export const splitUrls = (...cells: string[]) =>
  cells.flatMap((c) => c.split(/[\s,|]+/)).filter((u) => /^https?:\/\//i.test(u));
