const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});
const grouped = new Intl.NumberFormat('es-MX');

/** 459900 → "$459,900" */
export function formatPrice(value: number): string {
  return currency.format(value);
}

/** 459900 → "$459.9K", 1250000 → "$1.25M" */
export function compactPrice(value: number): string {
  if (value >= 1_000_000) return `$${trim(value / 1_000_000, 2)}M`;
  if (value >= 1_000) return `$${trim(value / 1_000, 1)}K`;
  return formatPrice(value);
}

/** 92712 → "92,712 km" */
export function formatKm(km: number): string {
  return `${grouped.format(km)} km`;
}

/** Relative time: "hace 5 min" / "5 min ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return $localize`:@@time.now:justo ahora`;
  if (minutes < 60) return $localize`:@@time.minutes:hace ${minutes}:count: min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return $localize`:@@time.hours:hace ${hours}:count: h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return $localize`:@@time.days:hace ${days}:count: d`;
  return new Date(iso).toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short' });
}

/** Locale of the running build (`$localize.locale` is set by localized bundles). */
export function currentLocale(): string {
  return (typeof $localize !== 'undefined' && $localize.locale) || 'es-MX';
}

export function carSlug(car: { id: string; brand: string; model: string; year: number }): string {
  const text = `${car.brand}-${car.model}-${car.year}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${car.id}--${text}`;
}

/** Inverse of `carSlug`: "car-1--ram-1500-2022" → "car-1". */
export function idFromSlug(slug: string): string {
  return slug.split('--')[0];
}

function trim(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}
