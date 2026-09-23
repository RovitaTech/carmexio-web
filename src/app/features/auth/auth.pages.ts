import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { AuthLayout } from './auth-layout';

const EMAIL = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

@Component({
  selector: 'cx-login-page',
  imports: [RouterLink, AuthLayout],
  template: `
    <cx-auth-layout
      title="Bienvenido de nuevo"
      subtitle="Guarda autos, chatea con Carmexio y publica tu auto."
    >
      <form (submit)="$event.preventDefault(); submit()" novalidate>
        <div class="field">
          <label for="email">Correo</label>
          <input
            id="email"
            type="email"
            autocomplete="email"
            [value]="email()"
            (input)="email.set($any($event.target).value)"
          />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autocomplete="current-password"
            [value]="password()"
            (input)="password.set($any($event.target).value)"
          />
        </div>
        @if (session.error()) {
          <p class="error" role="alert">{{ session.error() }}</p>
        }
        <button class="btn primary block" type="submit" [disabled]="session.busy()">
          {{ session.busy() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
      <button class="demo" type="button" (click)="fillDemo()">
        Modo demo: usar demo&#64;carmexio.mx / carmexio123 (staff: staff&#64;carmexio.mx)
      </button>
      <p class="links">
        <a routerLink="/recuperar">¿Olvidaste tu contraseña?</a>
        <a routerLink="/registro" [queryParams]="{ from: from() }">Crear cuenta</a>
      </p>
    </cx-auth-layout>
  `,
  styles: `
    form {
      display: grid;
      gap: 14px;
    }
    .error {
      color: var(--cx-error);
    }
    .demo {
      padding: 12px;
      border: 0;
      border-radius: var(--cx-radius-md);
      background: var(--cx-primary-soft);
      text-align: left;
      cursor: pointer;
    }
    .links {
      display: flex;
      justify-content: space-between;
    }
    .links a {
      color: var(--cx-primary-text);
      font-weight: 700;
    }
  `,
})
export class LoginPage {
  readonly from = input<string>();
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly email = signal('');
  protected readonly password = signal('');

  constructor() {
    inject(SeoService).set({ title: 'Entrar', noindex: true });
  }

  protected fillDemo(): void {
    this.email.set('demo@carmexio.mx');
    this.password.set('carmexio123');
  }

  protected async submit(): Promise<void> {
    if (!EMAIL.test(this.email().trim()) || !this.password()) {
      this.session.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    if (await this.session.signIn(this.email(), this.password())) {
      await this.router.navigateByUrl(this.from() || '/');
    }
  }
}

@Component({
  selector: 'cx-register-page',
  imports: [RouterLink, AuthLayout],
  template: `
    <cx-auth-layout title="Crea tu cuenta" subtitle="Publica tu auto gratis y habla con Carmexio.">
      @if (confirmSent()) {
        <p role="status">
          Te enviamos un correo de confirmación. Confírmalo y después inicia sesión.
        </p>
        <a class="btn primary block" routerLink="/entrar">Ir a entrar</a>
      } @else {
        <form
          (submit)="
            $event.preventDefault();
            submit(name.value, email.value, phone.value, password.value, terms.checked)
          "
          novalidate
        >
          <div class="field">
            <label for="name">Nombre completo</label><input #name id="name" autocomplete="name" />
          </div>
          <div class="field">
            <label for="remail">Correo</label
            ><input #email id="remail" type="email" autocomplete="email" />
          </div>
          <div class="field">
            <label for="phone">Teléfono / WhatsApp</label
            ><input #phone id="phone" type="tel" value="+52 " autocomplete="tel" />
          </div>
          <div class="field">
            <label for="rpass">Contraseña (8+ caracteres, 1 número)</label
            ><input #password id="rpass" type="password" autocomplete="new-password" />
          </div>
          <label class="check"
            ><input #terms type="checkbox" /> Acepto los Términos y el Aviso de Privacidad</label
          >
          @if (error() || session.error()) {
            <p class="error" role="alert">{{ error() || session.error() }}</p>
          }
          <button class="btn primary block" type="submit" [disabled]="session.busy()">
            Crear cuenta
          </button>
        </form>
        <p>
          ¿Ya tienes cuenta? <a routerLink="/entrar" [queryParams]="{ from: from() }">Entrar</a>
        </p>
      }
    </cx-auth-layout>
  `,
  styles: `
    form {
      display: grid;
      gap: 14px;
    }
    .check {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 0.9rem;
    }
    .error {
      color: var(--cx-error);
    }
    a {
      color: var(--cx-primary-text);
      font-weight: 700;
    }
    .btn.primary {
      color: var(--cx-on-dark);
    }
  `,
})
export class RegisterPage {
  readonly from = input<string>();
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmSent = signal(false);

  constructor() {
    inject(SeoService).set({ title: 'Crear cuenta', noindex: true });
  }

  protected async submit(
    name: string,
    email: string,
    phone: string,
    password: string,
    terms: boolean,
  ) {
    const problem =
      name.trim().length < 3
        ? 'Ingresa tu nombre completo.'
        : !EMAIL.test(email.trim())
          ? 'Ingresa un correo válido.'
          : !/^\+?[0-9 ]{10,15}$/.test(phone.trim())
            ? 'Ingresa un teléfono válido.'
            : password.length < 8 || !/[0-9]/.test(password)
              ? 'La contraseña necesita 8 caracteres y un número.'
              : !terms
                ? 'Acepta los términos para continuar.'
                : null;
    this.error.set(problem);
    if (problem) return;
    const needsConfirmation = await this.session.signUp(name, email, phone, password);
    if (needsConfirmation) this.confirmSent.set(true);
    else if (this.session.isSignedIn()) await this.router.navigateByUrl(this.from() || '/');
  }
}

@Component({
  selector: 'cx-reset-page',
  imports: [RouterLink, AuthLayout],
  template: `
    <cx-auth-layout
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para elegir una nueva."
    >
      @if (sent()) {
        <p role="status">
          Si existe una cuenta con ese correo, recibirás el enlace en unos minutos.
        </p>
        <a class="btn primary block" routerLink="/entrar">Volver a entrar</a>
      } @else {
        <form (submit)="$event.preventDefault(); submit(email.value)" novalidate>
          <div class="field">
            <label for="reset-email">Correo</label><input #email id="reset-email" type="email" />
          </div>
          <button class="btn primary block" type="submit" [disabled]="session.busy()">
            Enviar enlace
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
    .btn.primary {
      color: var(--cx-on-dark);
    }
  `,
})
export class ResetPage {
  protected readonly session = inject(SessionStore);
  protected readonly sent = signal(false);

  constructor() {
    inject(SeoService).set({ title: 'Recuperar contraseña', noindex: true });
  }

  protected async submit(email: string): Promise<void> {
    if (!EMAIL.test(email.trim())) return;
    if (await this.session.resetPassword(email)) this.sent.set(true);
  }
}
