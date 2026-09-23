import { Component, input } from '@angular/core';
import { Logo } from '../../shared/ui/logo';

/** Navy hero + form card, shared by sign in / sign up / reset. */
@Component({
  selector: 'cx-auth-layout',
  imports: [Logo],
  template: `
    <div class="wrap">
      <section class="hero">
        <cx-logo [size]="34" [white]="true" />
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </section>
      <section class="form card"><ng-content /></section>
    </div>
  `,
  styles: `
    .wrap {
      display: grid;
      min-height: calc(100vh - 68px);
    }
    .hero {
      display: grid;
      gap: 14px;
      align-content: center;
      padding: 40px 24px;
      background: var(--cx-gradient-hero);
      color: #fff;
    }
    .hero p {
      color: rgb(255 255 255 / 75%);
      max-width: 420px;
    }
    h1 {
      font-size: clamp(2rem, 4vw, 2.8rem);
    }
    .form {
      display: grid;
      gap: 14px;
      align-content: start;
      width: min(460px, 100% - 32px);
      margin: -24px auto 40px;
      padding: 28px;
    }
    @media (min-width: 1024px) {
      .wrap {
        grid-template-columns: 1fr 1fr;
      }
      .hero {
        padding-inline: 64px;
      }
      .form {
        margin: auto;
      }
    }
  `,
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
