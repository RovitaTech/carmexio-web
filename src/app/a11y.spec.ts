import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import axe from 'axe-core';
import { App } from './app';
import { routes } from './app.routes';
import { SessionStore } from './core/auth/session.store';
import { provideDummyData } from './data/providers';

/**
 * axe-core on real rendered pages (inside the full shell). jsdom has no layout,
 * so colour contrast is not checked here — tokens in _tokens.scss carry that.
 */
const PUBLIC_PAGES = [
  '/',
  '/autos',
  '/autos/car-1--ram-1500-2022',
  '/autos/car-1--ram-1500-2022/inspeccion',
  '/ofertas',
  '/sucursales',
  '/como-funciona',
  '/admin/entrar',
  '/entrar',
  '/registro',
];
const SIGNED_IN_PAGES = ['/mis-anuncios', '/favoritos', '/mensajes', '/cuenta', '/vender'];
const STAFF_PAGES = [
  '/staff',
  '/staff/revision',
  '/staff/revision/car-26',
  '/staff/anuncios',
  '/staff/inspecciones/car-1',
  '/admin',
  '/admin/anuncios',
  '/admin/anuncios/nuevo',
  '/admin/anuncios/hero-certified',
  '/admin/ofertas',
  '/admin/ofertas/offer-buen-fin',
  '/admin/avisos',
  '/admin/medios',
  '/admin/textos',
];

async function violations(url: string): Promise<string[]> {
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  fixture.detectChanges();
  const result = await axe.run(fixture.nativeElement as HTMLElement, {
    rules: { 'color-contrast': { enabled: false } },
  });
  fixture.destroy();
  return result.violations.map(
    (v) => `${url} · ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`,
  );
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
  });

  it.each(PUBLIC_PAGES)('%s has no violations', async (url) => {
    expect(await violations(url)).toEqual([]);
  });

  it.each(SIGNED_IN_PAGES)('%s (signed in) has no violations', async (url) => {
    await TestBed.inject(SessionStore).signIn('demo@carmexio.mx', 'carmexio123');
    expect(await violations(url)).toEqual([]);
  });

  it.each(STAFF_PAGES)('%s (admin) has no violations', async (url) => {
    await TestBed.inject(SessionStore).signIn('staff@carmexio.mx', 'carmexio123');
    expect(await violations(url)).toEqual([]);
  });
});
