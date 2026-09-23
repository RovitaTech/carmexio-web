import { carSlug, compactPrice, formatKm, formatPrice, idFromSlug, timeAgo } from './format';

describe('format', () => {
  it('formats MXN prices', () => {
    expect(formatPrice(459900)).toBe('$459,900');
    expect(compactPrice(250000)).toBe('$250K');
    expect(compactPrice(459900)).toBe('$459.9K');
    expect(compactPrice(1250000)).toBe('$1.25M');
  });

  it('formats mileage', () => {
    expect(formatKm(92712)).toBe('92,712 km');
  });

  it('formats relative time in Spanish', () => {
    const now = Date.parse('2026-09-23T12:00:00Z');
    expect(timeAgo('2026-09-23T11:55:00Z', now)).toBe('hace 5 min');
    expect(timeAgo('2026-09-23T09:00:00Z', now)).toBe('hace 3 h');
    expect(timeAgo('2026-09-21T12:00:00Z', now)).toBe('hace 2 d');
  });

  it('builds SEO slugs that round-trip to the id', () => {
    const slug = carSlug({ id: 'car-7', brand: 'Mercedes-Benz', model: 'Clase C', year: 2022 });
    expect(slug).toBe('car-7--mercedes-benz-clase-c-2022');
    expect(idFromSlug(slug)).toBe('car-7');
    expect(idFromSlug('car-7')).toBe('car-7');
  });
});
