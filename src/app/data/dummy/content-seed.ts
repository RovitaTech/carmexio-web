// DELETE WHEN LIVE — demo site content for the admin panel (web-only tables).
// Rows use the same columns as API_NEEDED.md §10.
import { Row } from '../mappers';

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;

const DAY = 86_400_000;

export function contentSeed(now = Date.now()) {
  const inDays = (days: number) => new Date(now + days * DAY).toISOString();
  const banners: Row[] = [
    {
      id: 'hero-certified',
      placement: 'home_hero',
      title: 'Autos verificados, sin sorpresas',
      title_en: 'Verified cars, no surprises',
      subtitle: 'Inspección de 150 puntos y garantía de 6 meses en cada auto certificado.',
      subtitle_en: '150-point inspection and a 6-month warranty on every certified car.',
      cta_label: 'Ver certificados',
      cta_label_en: 'See certified cars',
      deep_link: '/autos?verified=true',
      image_url: img('1592853625601-bb9d23da12fc'),
      sort_order: 0,
    },
    {
      id: 'hero-pickups',
      placement: 'home_hero',
      title: 'Temporada de pickups',
      title_en: 'Pickup season',
      subtitle: 'Listas para el trabajo, inspeccionadas y con entrega inmediata.',
      subtitle_en: 'Work-ready trucks, inspected and ready to deliver.',
      cta_label: 'Ver pickups',
      cta_label_en: 'Shop pickups',
      deep_link: '/autos?body=pickup',
      image_url: img('1552745998-234af3caf5b6'),
      sort_order: 1,
    },
    {
      id: 'hero-sell',
      placement: 'home_hero',
      title: 'Vende tu auto en 48 h',
      title_en: 'Sell your car in 48 h',
      subtitle: 'Publica gratis. Nosotros atendemos a los compradores y los papeles.',
      subtitle_en: 'List it free. We handle the buyers and the paperwork.',
      cta_label: 'Empezar a vender',
      cta_label_en: 'Start selling',
      deep_link: '/vender',
      image_url: img('1612563893490-d86ed296e5e6'),
      sort_order: 2,
    },
    {
      id: 'strip-delivery',
      placement: 'home_strip',
      title: 'Envío a todo México',
      title_en: 'Delivery nationwide',
      subtitle: 'Llevamos tu próximo auto a cualquier estado.',
      subtitle_en: 'We ship your next car to any state in Mexico.',
      cta_label: 'Ver autos',
      cta_label_en: 'Browse cars',
      deep_link: '/autos',
      image_url: img('1649793395985-967862a3b73f'),
      sort_order: 0,
    },
    {
      id: 'strip-financing',
      placement: 'home_strip',
      title: 'Financiamiento desde 10% de enganche',
      title_en: 'Financing from 10% down',
      subtitle: 'Calcula tu mensualidad en cada auto.',
      subtitle_en: 'Estimate your monthly payment on every car.',
      cta_label: 'Explorar',
      cta_label_en: 'Explore',
      deep_link: '/autos',
      image_url: img('1605893477799-b99e3b8b93fe'),
      sort_order: 1,
    },
    {
      id: 'search-certified',
      placement: 'search_top',
      title: 'Carmexio Certificado: garantía de 6 meses',
      title_en: 'Carmexio Certified: 6-month warranty',
      cta_label: 'Solo certificados',
      cta_label_en: 'Certified only',
      deep_link: '/autos?verified=true',
      image_url: img('1592853625601-bb9d23da12fc'),
      sort_order: 0,
    },
    {
      id: 'sidebar-insurance',
      placement: 'car_sidebar',
      title: 'Asegura tu auto el mismo día',
      title_en: 'Insure your car the same day',
      subtitle: 'Cotiza en la sucursal al recoger tu auto.',
      subtitle_en: 'Get a quote at the showroom when you pick it up.',
      image_url: img('1612057473117-3e16246121e6'),
      sort_order: 0,
    },
  ].map((b) => ({ is_active: true, video_url: null, starts_at: null, ends_at: null, ...b }));

  const alerts: Row[] = [
    {
      id: 'alert-buen-fin',
      message: 'Buen Fin Carmexio: hasta $30,000 de descuento en autos certificados.',
      message_en: 'Carmexio Buen Fin: up to $30,000 off certified cars.',
      link_label: 'Ver ofertas',
      link_label_en: 'See offers',
      link: '/ofertas',
      tone: 'promo',
      starts_at: null,
      ends_at: inDays(30),
      is_active: true,
    },
  ];

  const offers: Row[] = [
    {
      id: 'offer-buen-fin',
      title: 'Buen Fin Carmexio',
      title_en: 'Carmexio Buen Fin',
      description: 'Hasta $30,000 de descuento en autos Carmexio Certificados seleccionados.',
      description_en: 'Up to $30,000 off selected Carmexio Certified cars.',
      badge: '-$30,000',
      image_url: img('1592853625601-bb9d23da12fc'),
      link: '/autos?verified=true',
      code: 'BUENFIN',
      valid_until: inDays(30),
      sort_order: 0,
    },
    {
      id: 'offer-enganche',
      title: 'Enganche desde 10%',
      title_en: 'Down payment from 10%',
      description: 'Financiamiento con aprobación en 24 h en todas las sucursales.',
      description_en: 'Financing approved in 24 h at every showroom.',
      badge: '10%',
      image_url: img('1605893477799-b99e3b8b93fe'),
      link: '/autos',
      valid_until: inDays(60),
      sort_order: 1,
    },
    {
      id: 'offer-trade-in',
      title: 'Bono por tu auto usado',
      title_en: 'Trade-in bonus',
      description: '$10,000 extra al dejar tu auto a cuenta de uno certificado.',
      description_en: '$10,000 extra when you trade in your car for a certified one.',
      badge: '+$10,000',
      badge_en: '+$10,000',
      image_url: img('1552745998-234af3caf5b6'),
      link: '/vender',
      sort_order: 2,
    },
  ].map((o) => ({ is_active: true, code: null, valid_until: null, ...o }));

  const media: Row[] = [...banners, ...offers]
    .map((r) => r['image_url'] as string)
    .filter((url, i, all) => all.indexOf(url) === i)
    .map((url, i) => ({
      id: `media-${i + 1}`,
      kind: 'image',
      url,
      name: `unsplash-${i + 1}.jpg`,
      size_bytes: 0,
      created_at: new Date(now - i * DAY).toISOString(),
    }));

  return { banners, alerts, offers, media, texts: [] as Row[] };
}
