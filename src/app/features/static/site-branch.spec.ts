import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { SessionStore } from '../../core/auth/session.store';
import { DummyDb } from '../../data/dummy/dummy-db';
import { provideDummyData } from '../../data/providers';
import { CHAT_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';

/** carmexioguanajuato.com: one branch, sell-only, two kinds of stock. */
describe('Carmexio Guanajuato site', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
  });

  async function open(url: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('brands the site as Carmexio Guanajuato and shows the two stock groups', async () => {
    const el = await open('/');
    expect(el.querySelector('header cx-logo')?.textContent).toContain('GUANAJUATO');
    expect(el.textContent).toContain('Autos en Guanajuato');
    expect(el.textContent).toContain('Autos que puedes recoger en Guanajuato');
    expect(el.textContent).toContain('442 669 8432');
    expect(el.textContent).not.toContain('Vende tu auto');
    expect(el.querySelector('a[href="/vender"]')).toBeNull();
  });

  it('splits the inventory by where the car is', async () => {
    const listings = TestBed.inject(LISTING_REPOSITORY);
    const local = await listings.search({ locationId: 'loc-gto' }, 0, 50);
    const pickup = await listings.search({ excludeLocationId: 'loc-gto' }, 0, 50);
    expect(local.items.length).toBeGreaterThan(0);
    expect(local.items.every((c) => c.locationId === 'loc-gto')).toBe(true);
    expect(pickup.items.length).toBeGreaterThan(0);
    expect(pickup.items.some((c) => c.locationId === 'loc-gto')).toBe(false);

    const el = await open('/autos?stock=pickup');
    expect(el.textContent).toContain('Estos autos están en otra sucursal Carmexio');
    expect(el.querySelector('.stock .chip.active')?.textContent).toContain('recoger en Guanajuato');
    expect(el.textContent).toContain('Recógelo en Guanajuato');
  });

  it('questions about a car in another branch go to the Guanajuato inbox', async () => {
    await TestBed.inject(SessionStore).signIn('demo@carmexio.mx', 'carmexio123');
    const db = TestBed.inject(DummyDb);
    const elsewhere = db.listings.find(
      (l) => l['status'] === 'active' && l['location_id'] === 'loc-gdl',
    )!;
    const id = await TestBed.inject(CHAT_REPOSITORY).start({
      listingId: elsewhere['id'],
      locationId: 'loc-gto',
    });
    expect(db.conversations.find((c) => c['id'] === id)).toMatchObject({
      listing_id: elsewhere['id'],
      location_id: 'loc-gto',
    });
  });

  it('the sell flow is a staff tool: customers are sent home, old links still resolve', async () => {
    await TestBed.inject(SessionStore).signIn('demo@carmexio.mx', 'carmexio123');
    await open('/vender');
    expect(TestBed.inject(Router).url).toBe('/');
    await TestBed.inject(Router).navigateByUrl('/mis-anuncios');
    expect(TestBed.inject(Router).url).toBe('/');
    await TestBed.inject(Router).navigateByUrl('/sucursales');
    expect(TestBed.inject(Router).url).toBe('/contacto');
  });
});
