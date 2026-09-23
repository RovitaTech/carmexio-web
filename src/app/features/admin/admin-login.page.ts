import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { Logo } from '../../shared/ui/logo';

/** Separate door for admins; non-admin accounts are signed straight back out. */
@Component({
  selector: 'cx-admin-login-page',
  imports: [FormField, Logo],
  template: `
    <main class="wrap">
      <form class="card box" novalidate (submit)="$event.preventDefault(); signIn()">
        <cx-logo [size]="30" />
        <h1>Panel de administración</h1>
        <p class="muted">Solo para administradores de Carmexio.</p>

        <div class="field">
          <label for="admin-email">Correo</label>
          <input id="admin-email" type="email" autocomplete="username" [formField]="login.email" />
          @if (login.email().touched() && login.email().invalid()) {
            <span class="error">{{ login.email().errors()[0].message }}</span>
          }
        </div>
        <div class="field">
          <label for="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            autocomplete="current-password"
            [formField]="login.password"
          />
          @if (login.password().touched() && login.password().invalid()) {
            <span class="error">{{ login.password().errors()[0].message }}</span>
          }
        </div>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="btn primary block" type="submit" [disabled]="login().submitting()">
          {{ login().submitting() ? 'Entrando…' : 'Entrar' }}
        </button>
        <a class="back" href="/">← Volver al sitio</a>
      </form>
    </main>
  `,
  styles: `
    .wrap {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px 16px;
      background: var(--cx-gradient-hero);
    }
    .box {
      display: grid;
      gap: 14px;
      width: min(420px, 100%);
      padding: 32px 28px;
    }
    h1 {
      font-size: 1.6rem;
    }
    .error {
      color: var(--cx-error-text);
      font-weight: 600;
    }
    .back {
      justify-self: center;
      color: var(--cx-primary-text);
      font-weight: 600;
    }
  `,
})
export class AdminLoginPage {
  /** Where the guard sent us from (`?from=/admin/ofertas`). */
  readonly from = input<string>();

  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly model = signal({ email: '', password: '' });
  protected readonly login = form(this.model, (p) => {
    required(p.email, { message: 'Escribe tu correo.' });
    email(p.email, { message: 'Correo no válido.' });
    required(p.password, { message: 'Escribe tu contraseña.' });
  });

  constructor() {
    inject(SeoService).set({ title: 'Acceso administrador', noindex: true });
    if (this.session.isAdmin()) void this.router.navigateByUrl('/admin');
  }

  protected signIn(): Promise<boolean> {
    return submit(this.login, async () => {
      this.error.set(null);
      const { email, password } = this.model();
      if (!(await this.session.signIn(email, password))) {
        this.error.set(this.session.error());
        return;
      }
      if (!this.session.isAdmin()) {
        await this.session.signOut();
        this.error.set('Esta cuenta no tiene acceso de administrador.');
        return;
      }
      const target = this.from()?.startsWith('/admin') ? this.from()! : '/admin';
      await this.router.navigateByUrl(target);
    });
  }
}
