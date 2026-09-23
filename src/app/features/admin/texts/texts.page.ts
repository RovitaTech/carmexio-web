import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import { SITE_TEXTS, SITE_TEXT_KEYS, SiteTextKey } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { TextModel, fromTextModel, toTextModel } from '../ui/form-helpers';
import { LocalizedField } from '../ui/localized-field';

type TextsModel = Record<SiteTextKey, TextModel>;

const GROUPS: Record<string, string> = {
  home: 'Portada',
  stats: 'Cifras de confianza',
  offers: 'Ofertas',
  footer: 'Pie de página',
};

const blank = () =>
  Object.fromEntries(SITE_TEXT_KEYS.map((k) => [k, { es: '', en: '' }])) as TextsModel;

/** Editable copy; an empty field means "use the built-in default". */
@Component({
  selector: 'cx-admin-texts-page',
  imports: [FormField, LocalizedField, ErrorState, Skeleton],
  template: `
    <header class="head">
      <div>
        <h1>Textos del sitio</h1>
        <p class="muted">Deja un campo vacío para usar el texto predeterminado.</p>
      </div>
    </header>

    @if (saved.error()) {
      <cx-error-state [error]="saved.error()" (retry)="saved.reload()" />
    } @else if (!saved.hasValue()) {
      <cx-skeleton height="320px" radius="20px" />
    } @else {
      <form class="texts" novalidate (submit)="$event.preventDefault(); save()">
        @for (group of groups; track group.id) {
          <section class="card form" [attr.aria-labelledby]="'grp-' + group.id">
            <h2 [id]="'grp-' + group.id">{{ group.label }}</h2>
            @for (key of group.keys; track key) {
              <div class="entry">
                <cx-localized-field
                  [formField]="texts[key]"
                  [label]="label(key)"
                  [multiline]="long(key)"
                />
                <p class="default">
                  Predeterminado: <span lang="es">{{ defaults[key].es }}</span>
                  @if (defaults[key].en; as en) {
                    · <span lang="en">{{ en }}</span>
                  }
                </p>
              </div>
            }
          </section>
        }
        <div class="bar">
          <span class="muted"
            >{{ changed() }} texto{{ changed() === 1 ? '' : 's' }} personalizado{{
              changed() === 1 ? '' : 's'
            }}</span
          >
          <button class="btn primary" type="submit" [disabled]="texts().submitting()">
            {{ texts().submitting() ? 'Guardando…' : 'Guardar textos' }}
          </button>
        </div>
      </form>
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
  styles: `
    .texts {
      display: grid;
      gap: 16px;
    }
    h2 {
      font-size: 1.15rem;
    }
    .entry {
      display: grid;
      gap: 4px;
    }
    .default {
      font-size: 0.8rem;
      color: var(--cx-text-3);
    }
    .bar {
      align-items: center;
      justify-content: space-between;
    }
  `,
})
export class TextsPage {
  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly saved = resource({ loader: () => this.cms.texts() });
  protected readonly model = signal<TextsModel>(blank());
  protected readonly texts = form(this.model);

  protected readonly defaults = Object.fromEntries(
    SITE_TEXT_KEYS.map((k) => [k, SITE_TEXTS[k].value]),
  ) as Record<SiteTextKey, { es: string; en?: string }>;
  protected readonly groups = Object.entries(GROUPS).map(([id, label]) => ({
    id,
    label,
    keys: SITE_TEXT_KEYS.filter((k) => SITE_TEXTS[k].group === id),
  }));
  protected readonly changed = computed(
    () => Object.values(this.model()).filter((t) => t.es.trim()).length,
  );

  constructor() {
    effect(() => {
      const saved = valueOr(this.saved, undefined);
      if (!saved) return;
      const model = blank();
      for (const key of SITE_TEXT_KEYS) model[key] = toTextModel(saved[key]);
      this.model.set(model);
    });
  }

  protected label(key: SiteTextKey): string {
    return SITE_TEXTS[key].label;
  }

  protected long(key: SiteTextKey): boolean {
    return SITE_TEXTS[key].value.es.length > 60;
  }

  protected save(): Promise<boolean> {
    return submit(this.texts, async () => {
      const model = this.model();
      try {
        await this.cms.saveTexts(
          Object.fromEntries(SITE_TEXT_KEYS.map((k) => [k, fromTextModel(model[k])])),
        );
        this.content.reload();
        this.toast.success('Textos guardados. Ya se ven en el sitio.');
      } catch (e) {
        this.toast.error(e, 'No se pudieron guardar los textos.');
      }
    });
  }
}
