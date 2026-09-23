import { AdPlacement } from '../../../domain/content';

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  home_hero: 'Portada · carrusel principal',
  home_strip: 'Portada · banners promocionales',
  search_top: 'Búsqueda · banner superior',
  car_sidebar: 'Detalle del auto · columna lateral',
};

export const AD_PLACEMENT_HINTS: Record<AdPlacement, string> = {
  home_hero:
    'Pantalla completa detrás del buscador. Imagen 1920×1080 o video corto (≤ 20 s, sin audio).',
  home_strip: 'Tarjetas bajo la portada. Imagen 1200×600.',
  search_top: 'Franja sobre los resultados. Imagen 1600×300.',
  car_sidebar: 'Tarjeta junto al botón de contacto. Imagen 800×600.',
};
