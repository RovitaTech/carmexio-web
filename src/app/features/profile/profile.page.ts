import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { ThemeMode, ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'cx-profile-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      @if (session.user(); as user) {
        <section class="hero">
          <span class="avatar" aria-hidden="true">{{ user.fullName.charAt(0) }}</span>
          <div>
            <h1>{{ user.fullName }}</h1>
            <p>{{ user.email }}{{ user.city ? ' · ' + user.city : '' }}</p>
          </div>
        </section>

        <form
          class="card block"
          (submit)="$event.preventDefault(); save(name.value, phone.value, city.value)"
        >
          <h2 i18n="@@profile.editar-perfil">Editar perfil</h2>
          <div class="field">
            <label for="p-name" i18n="@@profile.nombre">Nombre</label
            ><input #name id="p-name" [value]="user.fullName" />
          </div>
          <div class="field">
            <label for="p-phone" i18n="@@profile.phone">Teléfono / WhatsApp</label
            ><input #phone id="p-phone" type="tel" [value]="user.phone ?? ''" />
          </div>
          <div class="field">
            <label for="p-city" i18n="@@profile.ciudad">Ciudad</label
            ><input #city id="p-city" [value]="user.city ?? ''" />
          </div>
          @if (saved()) {
            <p role="status" class="ok" i18n="@@profile.perfil-actualizado">Perfil actualizado</p>
          }
          <button
            class="btn primary"
            type="submit"
            [disabled]="session.busy()"
            i18n="@@profile.guardar-cambios"
          >
            Guardar cambios
          </button>
        </form>

        <nav class="card block links" i18n-aria-label="@@profile.mi-cuenta" aria-label="Mi cuenta">
          <a routerLink="/mis-anuncios" i18n="@@profile.mis-anuncios">Mis anuncios</a>
          <a routerLink="/favoritos" i18n="@@profile.autos-guardados">Autos guardados</a>
          <a routerLink="/mensajes" i18n="@@profile.mensajes">Mensajes</a>
          <a routerLink="/sucursales" i18n="@@profile.sucursales">Sucursales</a>
          @if (session.isStaff()) {
            <a routerLink="/staff" i18n="@@profile.portal-staff">Portal staff</a>
          }
        </nav>

        <section class="card block">
          <h2 i18n="@@profile.apariencia">Apariencia</h2>
          <div
            class="segmented"
            role="radiogroup"
            i18n-aria-label="@@profile.tema"
            aria-label="Tema"
          >
            @for (m of modes; track m.value) {
              <button
                class="chip"
                type="button"
                role="radio"
                [attr.aria-checked]="theme.mode() === m.value"
                [class.active]="theme.mode() === m.value"
                (click)="theme.apply(m.value)"
              >
                {{ m.label }}
              </button>
            }
          </div>
        </section>

        <button
          class="btn outline signout"
          type="button"
          (click)="signOut()"
          i18n="@@profile.cerrar-sesion"
        >
          Cerrar sesión
        </button>
      } @else {
        <section class="hero">
          <div>
            <h1 i18n="@@profile.compra-y-vende-autos-facil">Compra y vende autos fácil</h1>
            <p i18n="@@profile.guarda-favoritos-chatea-con-carmexio">
              Guarda favoritos, chatea con Carmexio y publica tu auto gratis.
            </p>
            <div class="row">
              <a class="btn primary" routerLink="/entrar" i18n="@@profile.entrar">Entrar</a>
              <a class="btn outline light" routerLink="/registro" i18n="@@profile.crear-cuenta"
                >Crear cuenta</a
              >
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 16px;
      max-width: 720px;
      padding-block: 28px;
    }
    .hero {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 24px;
      border-radius: var(--cx-radius-xl);
      background: var(--cx-gradient-hero);
      color: var(--cx-on-dark);
    }
    .hero p {
      color: var(--cx-on-dark-2);
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--cx-gradient-primary);
      font-size: 1.6rem;
      font-weight: 800;
    }
    .block {
      display: grid;
      gap: 12px;
      padding: 20px;
    }
    .links a {
      padding: 10px 0;
      border-bottom: 1px solid var(--cx-border);
      font-weight: 700;
    }
    .segmented,
    .row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .row {
      margin-top: 14px;
    }
    .light {
      color: var(--cx-on-dark);
      border-color: var(--cx-glass-border);
    }
    .ok {
      color: var(--cx-success);
    }
    .signout {
      color: var(--cx-error);
    }
  `,
})
export class ProfilePage {
  protected readonly session = inject(SessionStore);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly saved = signal(false);
  protected readonly modes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: $localize`:@@profile.sistema:Sistema` },
    { value: 'light', label: $localize`:@@profile.claro:Claro` },
    { value: 'dark', label: $localize`:@@profile.oscuro:Oscuro` },
  ];

  constructor() {
    inject(SeoService).set({ title: $localize`:@@profile.mi-cuenta-2:Mi cuenta`, noindex: true });
  }

  protected async save(fullName: string, phone: string, city: string): Promise<void> {
    this.saved.set(await this.session.updateProfile({ fullName, phone, city }));
  }

  protected async signOut(): Promise<void> {
    await this.session.signOut();
    await this.router.navigate(['/']);
  }
}
