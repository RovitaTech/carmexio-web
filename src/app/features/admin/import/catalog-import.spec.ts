import { Brand, DealerLocation } from '../../../domain/models';
import { draftProblems, matchBranch, readCatalog, toStockItem } from './catalog-rows';
import { detectTransmission, parseMileage, parsePrice } from './catalog-values';
import { parseDelimited } from './delimited';

const brands = [
  { id: 'brand-toyota', name: 'Toyota', models: ['Hilux', 'RAV4', 'Tacoma'], listingsCount: 0 },
  { id: 'brand-vw', name: 'Volkswagen', models: ['Jetta', 'Golf'], listingsCount: 0 },
  { id: 'brand-jeep', name: 'Jeep', models: ['Wrangler', 'Grand Cherokee'], listingsCount: 0 },
] as Brand[];
const locations = [
  { id: 'loc-cdmx', name: 'Carmexio CDMX', city: 'CDMX' },
  { id: 'loc-gdl', name: 'Carmexio Guadalajara', city: 'Guadalajara' },
  { id: 'loc-qro', name: 'Carmexio Querétaro', city: 'Querétaro' },
] as DealerLocation[];
const ctx = { brands, locations, maxYear: 2027 };

/** Shape of a WhatsApp Business catalog export from Commerce Manager (+ a branch column). */
const META_CSV = [
  'id,title,description,availability,condition,price,link,image_link,additional_image_link,brand,sucursal',
  'hilux-001,Toyota Hilux 2022 SR,"Diésel, manual, 61,200 km. Doble cabina.",in stock,used,615000.00 MXN,https://wa.me/p/1,https://scontent.whatsapp.net/a.jpg,"https://scontent.whatsapp.net/b.jpg,https://scontent.whatsapp.net/c.jpg",Toyota,Guadalajara',
  'jetta-002,VW Jetta 2019 Comfortline,"Automático, 45 mil km, un dueño",out of stock,used,"$289,900",https://wa.me/p/2,https://scontent.whatsapp.net/d.jpg,,,CDMX',
  'wrangler-003,Jeep Grand Cherokee 2021,Muy cuidada,in stock,used,899000 USD,,http://insecure.example.com/e.jpg,,Jeep,Monterrey',
].join('\n');

describe('catalog import', () => {
  it('parses quoted CSV, semicolon Excel CSV and pasted tab-separated text', () => {
    expect(parseDelimited('a,b\n"x, y","say ""hi"""\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
    expect(parseDelimited(String.fromCharCode(0xfeff) + 'marca;precio\nToyota;459.900')).toEqual([
      ['marca', 'precio'],
      ['Toyota', '459.900'],
    ]);
    expect(parseDelimited('title\tprice\nHilux\t615000\n\n')).toEqual([
      ['title', 'price'],
      ['Hilux', '615000'],
    ]);
  });

  it('reads prices, mileage and transmission the way Mexican listings write them', () => {
    expect(parsePrice('615000.00 MXN')).toEqual({ value: 615000, currency: 'MXN' });
    expect(parsePrice('$1,049,000')).toEqual({ value: 1049000, currency: undefined });
    expect(parsePrice('MXN 459.900').value).toBe(459900);
    expect(parseMileage(undefined, 'Automático, 45 mil km')).toBe(45000);
    expect(parseMileage('61,200 km')).toBe(61200);
    expect(parseMileage(undefined, 'con 12,500 kms')).toBe(12500);
    expect(detectTransmission('Vendo auto Toyota')).toBeUndefined(); // "auto" = car
    expect(detectTransmission('Transmisión automática CVT')).toBe('automatic');
  });

  it('turns a WhatsApp catalog export into ready cars and flags what is missing', () => {
    const { rows, columns } = readCatalog(parseDelimited(META_CSV), ctx);
    expect(columns.ignored).toEqual(['condition', 'link']);

    const [hilux, jetta, jeep] = rows;
    expect(toStockItem(hilux.draft, 2027)).toEqual({
      externalId: 'hilux-001',
      brand: 'Toyota',
      model: 'Hilux',
      version: null,
      year: 2022,
      price: 615000,
      mileageKm: 61200,
      fuelType: 'diesel',
      transmission: 'manual',
      bodyType: 'pickup',
      exteriorColor: null,
      description: 'Diésel, manual, 61,200 km. Doble cabina.',
      locationId: 'loc-gdl',
      imageUrls: [
        'https://scontent.whatsapp.net/a.jpg',
        'https://scontent.whatsapp.net/b.jpg',
        'https://scontent.whatsapp.net/c.jpg',
      ],
      sold: false,
    });

    // Brand from the "VW" alias, model from the brand's list, sold when out of stock.
    expect(jetta.draft).toMatchObject({
      brand: 'Volkswagen',
      model: 'Jetta',
      year: 2019,
      price: 289900,
      mileageKm: 45000,
      transmission: 'automatic',
      bodyType: 'sedan',
      locationId: 'loc-cdmx',
      sold: true,
    });
    expect(jetta.notes).toContain('Combustible no indicado: se asumió gasolina.');
    expect(draftProblems(jetta.draft, 2027)).toEqual([]);

    // Multi-word model, USD price, http photo, unknown branch: blocked until fixed.
    expect(jeep.draft).toMatchObject({ model: 'Grand Cherokee', bodyType: 'suv', imageUrls: [] });
    expect(jeep.notes).toEqual(
      expect.arrayContaining([
        'Precio en USD: revisa que sea en pesos.',
        'Se ignoraron fotos sin https.',
      ]),
    );
    expect(draftProblems(jeep.draft, 2027)).toEqual([
      'kilometraje',
      'transmisión',
      'sucursal',
      'fotos',
    ]);
    expect(toStockItem(jeep.draft, 2027)).toBeNull();
  });

  it('matches branches by id, name, city or abbreviation', () => {
    expect(matchBranch('Carmexio Querétaro', locations)).toBe('loc-qro');
    expect(matchBranch('queretaro', locations)).toBe('loc-qro');
    expect(matchBranch('GDL', locations)).toBe('loc-gdl');
    expect(matchBranch('loc-cdmx', locations)).toBe('loc-cdmx');
    expect(matchBranch('Tijuana', locations)).toBeNull(); // not in this list
    expect(matchBranch('', locations)).toBeNull();
  });

  it('derives an id from the title when the file has none, and warns about duplicates', () => {
    const table = parseDelimited('title,price\nToyota RAV4 2020,400000\nToyota RAV4 2020,410000');
    const { rows } = readCatalog(table, ctx);
    expect(rows[0].draft.externalId).toBe('titulo-toyota-rav4-2020');
    expect(rows[1].notes).toContain('Mismo id que la fila 2: se importará solo la última versión.');
  });
});
