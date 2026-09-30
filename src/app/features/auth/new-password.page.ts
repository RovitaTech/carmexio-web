import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { AuthLayout } from './auth-layout';

/**
 * Landing page of the password-reset email and of staff invites: the link signs the
 * person in (Supabase reads the token from the URL), then they choose a password.
 */
@Component({
  selector: 'cx-new-password-page',
  imports: [RouterLink, AuthLayout],
  template: `
    <cx-auth-layout
      i18n-title="@@auth.newPassword.title"
      title="Elige tu contraseña"
      i18n-subtitle="@@auth.newPassword.subtitle"
      subtitle="Úsala para entrar a Carmexio a partir de ahora."
    >
      @if (!session.isSignedIn()) {
        <p role="alert" i18n="@@auth.newPassword.invalidLink">
          El enlace no es válido o ya expiró. Pide uno nuevo.
        </p>
        <a class="btn primary block" routerLink="/recuperar" i18n="@@auth.newPassword.requestNew"
          >Pedir un enlace nuevo</a
        >
      } @else {
        <form (submit)="$event.preventDefault(); save(pass.value, confirm.value)" novalidate>
          <p class="muted" i18n="@@auth.newPassword.account">Cuenta: {{ session.user()?.email }}</p>
          <div class="field">
            <label for="new-pass" i18n="@@auth.newPassword.label"
              >Nueva contraseña (8+ caracteres, 1 número)</label
            >
            <input #pass id="new-pass" type="password" autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="new-pass-2" i18n="@@auth.newPassword.confirm">Repite la contraseña</label>
            <input #confirm id="new-pass-2" type="password" autocomplete="new-password" />
          </div>
          @if (error() || session.error()) {
            <p class="error" role="alert">{{ error() || session.error() }}</p>
          }
          <button
            class="btn primary block"
            type="submit"
            [disabled]="session.busy()"
            i18n="@@auth.newPassword.save"
          >
            Guardar contraseña
          </button>
        </form>
      }
    </cx-auth-layout>
  `,
  styles: `
    form {
      display: grid;
      gap: 14px;
    }
    .error {
      color: var(--cx-error-text);
    }
    .btn.primary {
      color: var(--cx-on-dark);
    }
  `,
})
export class NewPasswordPage {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@auth.newPassword.seo:Nueva contraseña`,
      noindex: true,
    });
  }

  protected async save(password: string, confirm: string): Promise<void> {
    const problem =
      password.length < 8 || !/[0-9]/.test(password)
        ? $localize`:@@auth.la-contrasena-necesita-8-caracteres:La contraseña necesita 8 caracteres y un número.`
        : password !== confirm
          ? $localize`:@@auth.newPassword.mismatch:Las contraseñas no coinciden.`
          : null;
    this.error.set(problem);
    if (problem || !(await this.session.updatePassword(password))) return;
    // Staff and admins were invited to work in the portal; customers go home.
    await this.router.navigateByUrl(this.session.isStaff() ? '/staff' : '/');
  }
}
