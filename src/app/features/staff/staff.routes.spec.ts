import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionStore } from '../../core/auth/session.store';
import { provideDummyData } from '../../data/providers';
import { STAFF_ROUTES } from './staff.routes';

/** Drives the real staff pages against the dummy backend, signed in as admin. */
describe('staff portal', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'staff', children: STAFF_ROUTES }], withComponentInputBinding()),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
    await TestBed.inject(SessionStore).signIn('staff@carmexio.mx', 'carmexio123');
    harness = await RouterTestingHarness.create();
  });

  async function open(url: string): Promise<HTMLElement> {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement!.closest('cx-staff-shell') as HTMLElement;
  }

  it('shows KPIs and the pending ad on the dashboard', async () => {
    const el = await open('/staff');
    expect(el.querySelector('nav')?.textContent).toContain('Revisión');
    expect(el.textContent).toContain('Por revisar');
    expect(el.querySelector('a[href="/staff/revision/car-26"]')).toBeTruthy();
  });

  it('blocks approval until photos and inspection are complete', async () => {
    const el = await open('/staff/revision/car-26');
    const approve = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Aprobar'),
    )!;
    expect(approve.disabled).toBe(true);
    expect(el.querySelector('.blockers')?.textContent).toContain('Faltan 7 fotos');
    expect(el.querySelector('.blockers')?.textContent).toContain('reporte de inspección');
  });

  it('requests changes with the re-shoot list as the reason', async () => {
    const el = await open('/staff/revision/car-26');
    const engine = [...el.querySelectorAll<HTMLLabelElement>('.photos label')].find((l) =>
      l.textContent?.includes('Motor'),
    )!;
    engine.querySelector('input')!.click();
    harness.detectChanges();
    expect(el.querySelector('.preview')?.textContent).toContain(
      'Vuelve a tomar estas fotos: Motor',
    );
  });

  it('filters the listings table by status', async () => {
    const el = await open('/staff/anuncios');
    const rows = () => el.querySelectorAll('tbody tr').length;
    const all = rows();
    const sold = [...el.querySelectorAll<HTMLButtonElement>('.chip')].find(
      (b) => b.textContent?.trim() === 'Vendido',
    )!;
    sold.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(rows()).toBeLessThan(all);
    expect(el.querySelector('tbody')?.textContent).toContain('Vendido');
  });

  it('opens a blank checklist in the inspection editor for a car without a report', async () => {
    const el = await open('/staff/inspecciones/car-26');
    expect(el.textContent).toContain('Reporte nuevo');
    expect(el.querySelectorAll('details.category').length).toBe(7);
  });
});
