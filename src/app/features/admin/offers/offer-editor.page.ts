import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, maxLength, min, pattern, required, submit } from '@angular/forms/signals';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import { Offer } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { fromLocalInput, toLocalInput } from '../ui/dates';
import { TextModel, fromTextModel, linkRule, toTextModel } from '../ui/form-helpers';
import { LocalizedField } from '../ui/localized-field';
import { MediaPicker } from '../ui/media-picker';

interface OfferModel {
  title: TextModel;
  description: TextModel;
  badge: TextModel;
  imageUrl: string;
  link: string;
  code: string;
  validUntil: string;
  isActive: boolean;
  sortOrder: number;
}

const BLANK: OfferModel = {
  title: { es: '', en: '' },
  description: { es: '', en: '' },
  badge: { es: '', en: '' },
  imageUrl: '',
  link: '',
  code: '',
  validUntil: '',
  isActive: true,
  sortOrder: 0,
};

@Component({
  selector: 'cx-admin-offer-editor',
  imports: [RouterLink, FormField, LocalizedField, MediaPicker, ErrorState, Skeleton],
  template: `
    <a class="back" routerLink="/admin/ofertas">← Ofertas</a>
    <header class="head">
      <h1>{{ isNew() ? 'Nueva oferta' : 'Editar oferta' }}</h1>
    </header>

    @if (existing.error()) {
      <cx-error-state [error]="existing.error()" (retry)="existing.reload()" />
    } @else if (!loaded()) {
      <cx-skeleton height="480px" radius="20px" />
    } @else {
      <form class="card form" novalidate (submit)="$event.preventDefault(); save()">
        <cx-localized-field [formField]="offer.title" label="Título" [charLimit]="80" />
        @if (offer.title.es().touched() && offer.title.es().invalid()) {
          <p class="error">{{ offer.title.es().errors()[0].message }}</p>
        }
        <cx-localized-field
          [formField]="offer.description"
          label="Descripción"
          [multiline]="true"
          [charLimit]="300"
        />
        @if (offer.description.es().touched() && offer.description.es().invalid()) {
          <p class="error">{{ offer.description.es().errors()[0].message }}</p>
        }
        <cx-localized-field
          [formField]="offer.badge"
          label="Distintivo (ej. -$20,000, 10%)"
          [charLimit]="16"
        />

        <cx-media-picker [formField]="offer.imageUrl" label="Imagen" />
        @if (offer.imageUrl().touched() && offer.imageUrl().invalid()) {
          <p class="error">{{ offer.imageUrl().errors()[0].message }}</p>
        }

        <div class="grid-2">
          <div class="field">
            <label for="link">Enlace</label>
            <input id="link" placeholder="/autos?verified=true" [formField]="offer.link" />
            @if (offer.link().invalid()) {
              <span class="error">{{ offer.link().errors()[0].message }}</span>
            }
          </div>
          <div class="field">
            <label for="code">Código promocional</label>
            <input id="code" placeholder="BUENFIN" [formField]="offer.code" />
            @if (offer.code().invalid()) {
              <span class="error">{{ offer.code().errors()[0].message }}</span>
            }
          </div>
          <div class="field">
            <label for="until">Vigente hasta</label>
            <input id="until" type="datetime-local" [formField]="offer.validUntil" />
          </div>
          <div class="field">
            <label for="order">Orden</label>
            <input id="order" type="number" [formField]="offer.sortOrder" />
          </div>
        </div>
        <label class="check">
          <input type="checkbox" [formField]="offer.isActive" />
          Activa en el sitio
        </label>

        <div class="bar">
          <a class="btn outline" routerLink="/admin/ofertas">Cancelar</a>
          <button class="btn primary" type="submit" [disabled]="offer().submitting()">
            {{ offer().submitting() ? 'Guardando…' : 'Guardar oferta' }}
          </button>
        </div>
      </form>
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
})
export class OfferEditorPage {
  /** Route param: an offer id, or `nuevo`. */
  readonly id = input.required<string>();

  private readonly cms = inject(CMS_REPOSITORY);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly isNew = computed(() => this.id() === 'nuevo');
  protected readonly existing = resource({
    params: () => (this.isNew() ? undefined : this.id()),
    loader: async ({ params }) => {
      const offer = (await this.cms.offers()).find((o) => o.id === params);
      if (!offer) throw new Error('Esta oferta ya no existe.');
      return offer;
    },
  });
  protected readonly loaded = computed(() => this.isNew() || this.existing.hasValue());

  protected readonly model = signal<OfferModel>(BLANK);
  protected readonly offer = form(this.model, (p) => {
    required(p.title.es, { message: 'El título en español es obligatorio.' });
    required(p.description.es, { message: 'La descripción en español es obligatoria.' });
    required(p.imageUrl, { message: 'Elige una imagen.' });
    linkRule(p.link);
    maxLength(p.code, 20, { message: 'Máximo 20 caracteres.' });
    pattern(p.code, /^[A-Za-z0-9-]*$/, { message: 'Solo letras, números y guiones.' });
    min(p.sortOrder, 0, { message: 'Usa 0 o más.' });
  });

  constructor() {
    effect(() => {
      const offer = valueOr(this.existing, undefined);
      this.model.set(offer ? toModel(offer) : BLANK);
    });
  }

  protected save(): Promise<boolean> {
    return submit(this.offer, async () => {
      const m = this.model();
      try {
        await this.cms.saveOffer({
          id: this.isNew() ? '' : this.id(),
          title: fromTextModel(m.title) ?? { es: '' },
          description: fromTextModel(m.description) ?? { es: '' },
          badge: fromTextModel(m.badge),
          imageUrl: m.imageUrl,
          link: m.link.trim() || undefined,
          code: m.code.trim().toUpperCase() || undefined,
          validUntil: fromLocalInput(m.validUntil),
          isActive: m.isActive,
          sortOrder: m.sortOrder,
        });
        this.content.reload();
        this.toast.success('Oferta guardada.');
        await this.router.navigateByUrl('/admin/ofertas');
      } catch (e) {
        this.toast.error(e, 'No se pudo guardar la oferta.');
      }
    });
  }
}

function toModel(o: Offer): OfferModel {
  return {
    title: toTextModel(o.title),
    description: toTextModel(o.description),
    badge: toTextModel(o.badge),
    imageUrl: o.imageUrl,
    link: o.link ?? '',
    code: o.code ?? '',
    validUntil: toLocalInput(o.validUntil),
    isActive: o.isActive,
    sortOrder: o.sortOrder,
  };
}
