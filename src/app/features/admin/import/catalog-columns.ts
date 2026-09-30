/**
 * Which column holds what. Headers from the WhatsApp Business / Meta Commerce Manager
 * catalog export (products and vehicles feeds), plus Spanish names for hand-made sheets.
 * Matching ignores case, accents, spaces and punctuation ("Image Link" = "image_link").
 */
export type CatalogField =
  | 'id'
  | 'title'
  | 'description'
  | 'price'
  | 'salePrice'
  | 'availability'
  | 'image'
  | 'extraImages'
  | 'brand'
  | 'model'
  | 'version'
  | 'year'
  | 'mileage'
  | 'fuel'
  | 'transmission'
  | 'body'
  | 'color'
  | 'branch';

const ALIASES: Record<CatalogField, string[]> = {
  id: ['id', 'retailerid', 'vehicleid', 'contentid', 'sku', 'itemid', 'identificador'],
  title: ['title', 'name', 'titulo', 'nombre', 'producto', 'product'],
  description: ['description', 'descripcion', 'richtextdescription', 'shortdescription'],
  price: ['price', 'precio', 'amount', 'monto'],
  salePrice: ['saleprice', 'preciodeoferta', 'preciooferta', 'preciorebajado'],
  availability: ['availability', 'disponibilidad', 'stock', 'inventory', 'estado', 'status'],
  image: ['imagelink', 'image', 'image0url', 'imageurl', 'imagen', 'foto', 'photo', 'photourl'],
  extraImages: [
    'additionalimagelink',
    'additionalimagelinks',
    'imagenesadicionales',
    'fotosadicionales',
    'images',
  ],
  brand: ['brand', 'make', 'marca'],
  model: ['model', 'modelo'],
  version: ['version', 'trim', 'variante'],
  year: ['year', 'ano', 'anio', 'modelyear'],
  mileage: ['mileage', 'mileagevalue', 'kilometraje', 'km', 'kms', 'kilometros', 'odometer'],
  fuel: ['fueltype', 'fuel', 'combustible'],
  transmission: ['transmission', 'transmision', 'caja'],
  body: ['bodystyle', 'bodytype', 'body', 'carroceria', 'tipo', 'vehicletype'],
  color: ['exteriorcolor', 'color', 'colorexterior'],
  branch: [
    'branch',
    'sucursal',
    'location',
    'ubicacion',
    'city',
    'ciudad',
    'store',
    'tienda',
    'addresscity',
    'agencia',
  ],
};

export const headerKey = (header: string) =>
  header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export interface ColumnMap {
  /** Field → column index (first matching column wins). */
  fields: Partial<Record<CatalogField, number>>;
  /** Extra photo columns such as image[1].url, image[2].url. */
  imageColumns: number[];
  /** Headers nobody uses (shown to the admin, never an error). */
  ignored: string[];
}

export function mapColumns(header: readonly string[]): ColumnMap {
  const fields: ColumnMap['fields'] = {};
  const imageColumns: number[] = [];
  const ignored: string[] = [];
  header.forEach((raw, i) => {
    const key = headerKey(raw);
    if (/^image\d+url$/.test(key) && key !== 'image0url') {
      imageColumns.push(i);
      return;
    }
    const field = (Object.keys(ALIASES) as CatalogField[]).find((f) => ALIASES[f].includes(key));
    if (field && fields[field] === undefined) fields[field] = i;
    else if (!field && raw.trim()) ignored.push(raw.trim());
  });
  return { fields, imageColumns, ignored };
}
