import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionStore } from '../../../core/auth/session.store';
import { provideDummyData } from '../../../data/providers';
import { LISTING_REPOSITORY } from '../../../domain/repositories';
import { ADMIN_ROUTES } from '../admin.routes';

/** Paste → preview → fix → publish, against the in-memory backend. */
describe('admin stock import', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  const CSV = [
    'id\ttitle\tdescription\tavailability\tprice\timage_link\tsucursal',
    'wa-1\tToyota Hilux 2022\tDiésel, manual, 61,200 km, doble cabina\tin stock\t615000 MXN\thttps://cdn.example.com/h.jpg\tGuadalajara',
    'wa-2\tJeep Wrangler 2021\tAutomático, 30 mil km\tin stock\t$899,000\thttps://cdn.example.com/w.jpg\t',
  ].join('\n');

  async function settle(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  const button = (label: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(label),
    )!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', children: ADMIN_ROUTES }]),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
    await TestBed.inject(SessionStore).signIn('staff@carmexio.mx', 'carmexio123');
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/importar');
    await vi.waitFor(async () => {
      await settle();
      el = harness.fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#import-paste')).not.toBeNull();
    });
  });

  it('previews pasted rows, fills the missing branch in bulk and publishes', async () => {
    const paste = el.querySelector<HTMLTextAreaElement>('#import-paste')!;
    paste.value = CSV;
    paste.dispatchEvent(new Event('input'));
    harness.detectChanges();
    button('Leer filas pegadas').click();
    await settle();

    expect(el.textContent).toContain('2 autos');
    expect(el.textContent).toContain('1 con datos faltantes');
    expect(el.textContent).toContain('Falta: sucursal');
    expect(button('Publicar').textContent).toContain('Publicar 1 autos');

    const branchFill = el.querySelector<HTMLSelectElement>('.fill select')!;
    branchFill.value = 'loc-cdmx';
    branchFill.dispatchEvent(new Event('change'));
    await settle();
    expect(button('Publicar').textContent).toContain('Publicar 2 autos');

    button('Publicar').click();
    await vi.waitFor(async () => {
      await settle();
      expect(el.textContent).toContain('Resultado: 2 nuevos · 0 actualizados · 0 con error.');
    });
    expect(el.textContent).toContain('✓ Publicado');

    const live = await TestBed.inject(LISTING_REPOSITORY).search({ query: 'Wrangler' }, 0, 10);
    expect(live.items.some((c) => c.locationId === 'loc-cdmx' && c.price === 899000)).toBe(true);
  });
});
