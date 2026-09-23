import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionStore } from '../../core/auth/session.store';
import { ContentStore } from '../../core/state/content.store';
import { provideDummyData } from '../../data/providers';
import { CMS_REPOSITORY } from '../../domain/repositories';
import { ADMIN_ROUTES } from './admin.routes';

/** The real admin pages against the dummy backend. */
describe('admin panel', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', children: ADMIN_ROUTES }], withComponentInputBinding()),
        provideDummyData({ latencyMs: 0 }),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  async function open(url: string): Promise<HTMLElement> {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.fixture.nativeElement as HTMLElement;
  }

  function type(el: HTMLElement, selector: string, value: string): void {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('sends guests to the admin login', async () => {
    await open('/admin/anuncios');
    expect(TestBed.inject(Router).url).toBe('/admin/entrar?from=%2Fadmin%2Fanuncios');
  });

  it('refuses accounts that are not admins and signs them out', async () => {
    const el = await open('/admin/entrar');
    type(el, '#admin-email', 'demo@carmexio.mx');
    type(el, '#admin-password', 'carmexio123');
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(el.textContent).toContain('no tiene acceso de administrador');
    });
    expect(TestBed.inject(SessionStore).isSignedIn()).toBe(false);
  });

  it('lets an admin in and shows the dashboard', async () => {
    const el = await open('/admin/entrar?from=%2Fadmin%2Fofertas');
    type(el, '#admin-email', 'staff@carmexio.mx');
    type(el, '#admin-password', 'carmexio123');
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/ofertas'));
    const dash = await open('/admin');
    expect(dash.textContent).toContain('Anuncios activos');
  });

  describe('signed in as admin', () => {
    beforeEach(() => TestBed.inject(SessionStore).signIn('staff@carmexio.mx', 'carmexio123'));

    it('validates and creates an ad that the public site then shows', async () => {
      const el = await open('/admin/anuncios/nuevo');
      const form = el.querySelector<HTMLFormElement>('form')!;
      form.dispatchEvent(new Event('submit'));
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(el.textContent).toContain('El título en español es obligatorio.');
      expect(el.textContent).toContain('Elige una imagen o un video.');

      const [media] = await TestBed.inject(CMS_REPOSITORY).media();
      el.querySelector<HTMLButtonElement>('.picker .btn')!.click(); // open library
      await harness.fixture.whenStable();
      harness.detectChanges();
      const tile = [...el.querySelectorAll<HTMLButtonElement>('.grid button')].find((b) =>
        b.querySelector('img')?.getAttribute('src')?.includes(media.url.slice(-40)),
      )!;
      tile.click();
      type(el, 'cx-localized-field input[lang="es"]', 'Venta nocturna');
      type(el, 'cx-localized-field input[lang="en"]', 'Night sale');
      harness.detectChanges();
      form.dispatchEvent(new Event('submit'));
      await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/anuncios'));

      const content = TestBed.inject(ContentStore);
      await vi.waitFor(() =>
        expect(content.ads('home_hero').map((a) => a.title)).toContainEqual({
          es: 'Venta nocturna',
          en: 'Night sale',
        }),
      );
    });

    it('text overrides replace the defaults; clearing restores them', async () => {
      const cms = TestBed.inject(CMS_REPOSITORY);
      const content = TestBed.inject(ContentStore);
      await cms.saveTexts({ 'home.hero.title': { es: 'Tu auto ideal', en: 'Your ideal car' } });
      content.reload();
      await harness.fixture.whenStable();
      expect(content.text('home.hero.title')).toBe('Tu auto ideal');
      await cms.saveTexts({ 'home.hero.title': undefined });
      content.reload();
      await harness.fixture.whenStable();
      expect(content.text('home.hero.title')).toBe('Encuentra tu próximo');
    });

    it('hides expired and inactive alerts from the public site', async () => {
      const cms = TestBed.inject(CMS_REPOSITORY);
      const content = TestBed.inject(ContentStore);
      const [alert] = await cms.alerts();
      await cms.saveAlert({ ...alert, endsAt: new Date(Date.now() - 1000).toISOString() });
      content.reload();
      await harness.fixture.whenStable();
      expect(content.alerts()).toEqual([]);
    });
  });
});
