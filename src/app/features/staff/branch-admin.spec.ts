import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionStore } from '../../core/auth/session.store';
import { staffGuard } from '../../core/auth/guards';
import { DummyDb } from '../../data/dummy/dummy-db';
import { provideDummyData } from '../../data/providers';
import { AUTH_REPOSITORY, STAFF_REPOSITORY, TEAM_REPOSITORY } from '../../domain/repositories';
import { ADMIN_ROUTES } from '../admin/admin.routes';
import { STAFF_ROUTES } from './staff.routes';

/** Super admin vs. branch admin, against the in-memory backend. */
describe('branch admins', () => {
  let harness: RouterTestingHarness;
  let db: DummyDb;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'staff', canActivate: [staffGuard], children: STAFF_ROUTES },
            { path: 'admin', children: ADMIN_ROUTES },
          ],
          withComponentInputBinding(),
        ),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
    db = TestBed.inject(DummyDb);
    harness = await RouterTestingHarness.create();
  });

  /** Turns the demo customer into the Guadalajara branch admin. */
  async function signInAsGdlAdmin(): Promise<void> {
    const demo = db.profiles.find((p) => p['email'] === 'demo@carmexio.mx')!;
    Object.assign(demo, { role: 'staff', location_id: 'loc-gdl' });
    await TestBed.inject(SessionStore).signIn('demo@carmexio.mx', 'carmexio123');
  }

  async function open(url: string): Promise<HTMLElement> {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.fixture.nativeElement as HTMLElement;
  }

  it('a branch admin edits site content but not users or the stock import', async () => {
    await signInAsGdlAdmin();
    const panel = await open('/admin/anuncios');
    expect(TestBed.inject(Router).url).toBe('/admin/anuncios');
    expect(panel.querySelector('nav')?.textContent).not.toContain('Usuarios');
    expect(panel.querySelector('nav')?.textContent).not.toContain('Importar');
    expect(panel.textContent).toContain('Admin de sucursal');

    await open('/admin/usuarios');
    expect(TestBed.inject(Router).url).toBe('/admin');
    await open('/admin/importar');
    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  it("a branch admin's inbox only holds their branch; replies go out as Carmexio", async () => {
    await signInAsGdlAdmin();
    const staff = TestBed.inject(STAFF_REPOSITORY);
    const inbox = await staff.inbox('loc-gdl');
    expect(inbox.map((t) => t.id)).toEqual(['conv-2']);
    await expect(staff.inbox('loc-cdmx')).rejects.toThrow('No tienes permiso');

    const el = await open('/staff/mensajes/conv-2');
    const box = el.querySelector<HTMLTextAreaElement>('#reply')!;
    box.value = 'Sí, sigue disponible.';
    el.querySelector<HTMLFormElement>('form.reply')!.dispatchEvent(new Event('submit'));
    await vi.waitFor(async () => {
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(el.querySelector('.messages li.mine:last-child')?.textContent).toContain(
        'Sí, sigue disponible.',
      );
    });
    expect(db.conversations.find((c) => c['id'] === 'conv-2')!['last_message']).toBe(
      'Sí, sigue disponible.',
    );
  });

  it('inventory shows every branch, including sold cars elsewhere, read-only', async () => {
    await signInAsGdlAdmin();
    const cars = await TestBed.inject(STAFF_REPOSITORY).inventory({ status: 'sold' });
    expect(cars.map((c) => [c.id, c.locationId])).toContainEqual(['car-27', 'loc-cdmx']);
    const el = await open('/staff/inventario');
    await vi.waitFor(async () => {
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(el.textContent).toContain('Querétaro');
      expect(el.textContent).toContain('Guadalajara');
    });
    expect(el.querySelector('table a[href^="/staff"]')).toBeNull(); // no editing from here
  });

  it('the super admin invites a branch admin, who then sets a password', async () => {
    await TestBed.inject(SessionStore).signIn('staff@carmexio.mx', 'carmexio123');
    const team = TestBed.inject(TEAM_REPOSITORY);
    const member = await team.invite({
      email: 'Tijuana@Carmexio.mx',
      fullName: 'Admin Tijuana',
      role: 'staff',
      locationId: 'loc-tij',
    });
    expect(member).toMatchObject({
      email: 'tijuana@carmexio.mx',
      role: 'staff',
      locationId: 'loc-tij',
    });
    expect((await team.members()).map((m) => m.email)).toContain('tijuana@carmexio.mx');
    await expect(
      team.invite({ email: 'tijuana@carmexio.mx', fullName: 'x', role: 'admin' }),
    ).rejects.toThrow('ya tiene cuenta');

    // New password flow (same page as the reset email): update, then sign in with it.
    const auth = TestBed.inject(AUTH_REPOSITORY);
    await auth.updatePassword('nuevaClave2026');
    await auth.signOut();
    await expect(auth.signIn('staff@carmexio.mx', 'carmexio123')).rejects.toThrow();
    await expect(auth.signIn('staff@carmexio.mx', 'nuevaClave2026')).resolves.toMatchObject({
      role: 'admin',
    });
  });
});
