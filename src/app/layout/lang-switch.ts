import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { APP_LANG, pathIn } from '../core/i18n/i18n';
import { Icon } from '../shared/ui/icon';

/**
 * Link to the same page in the other language. A full page load on purpose:
 * each language is its own prerendered/SSR bundle (`/` = es-MX, `/en` = en).
 */
@Component({
  selector: 'cx-lang-switch',
  imports: [Icon],
  template: `
    <a
      class="switch"
      [href]="href()"
      [attr.hreflang]="target().code"
      [attr.lang]="target().code"
      [attr.aria-label]="target().label"
    >
      <cx-icon name="globe" [size]="18" />
      <span>{{ target().short }}</span>
    </a>
  `,
  styles: `
    .switch {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 42px;
      padding: 0 10px;
      border-radius: var(--cx-radius-md);
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.04em;
      color: inherit;
    }
    .switch:hover {
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
  `,
})
export class LangSwitch {
  private readonly lang = inject(APP_LANG);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly target = computed(() =>
    this.lang === 'es'
      ? { code: 'en', short: 'EN', label: 'View this page in English' }
      : { code: 'es', short: 'ES', label: 'Ver esta página en español' },
  );
  protected readonly href = computed(() => pathIn(this.target().code as 'es' | 'en', this.url()));
}
