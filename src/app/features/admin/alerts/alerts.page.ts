import { Component, inject, resource, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { AlertTone, SiteAlert } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { fromLocalInput, toLocalInput } from '../ui/dates';
import { TextModel, dateRangeRule, fromTextModel, linkRule, toTextModel } from '../ui/form-helpers';
import { LiveBadge } from '../ui/live-badge';
import { LocalizedField } from '../ui/localized-field';

interface AlertModel {
  message: TextModel;
  linkLabel: TextModel;
  link: string;
  tone: AlertTone;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const BLANK: AlertModel = {
  message: { es: '', en: '' },
  linkLabel: { es: '', en: '' },
  link: '',
  tone: 'promo',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

const TONES: { value: AlertTone; label: string }[] = [
  { value: 'promo', label: 'Promoción (azul)' },
  { value: 'info', label: 'Información (oscuro)' },
  { value: 'warning', label: 'Importante (ámbar)' },
];

/** Announcement bar above the site header; small enough to edit inline. */
@Component({
  selector: 'cx-admin-alerts-page',
  imports: [FormField, LocalizedField, LiveBadge, EmptyState, ErrorState, Skeleton],
  template: `
    <header class="head">
      <div>
        <h1>Avisos</h1>
        <p class="muted">Barra de anuncio sobre el menú. Se muestra el más reciente vigente.</p>
      </div>
      @if (editing() === null) {
        <button class="btn primary" type="button" (click)="edit(null)">+ Nuevo aviso</button>
      }
    </header>

    @if (editing() !== null) {
      <form class="card form" novalidate (submit)="$event.preventDefault(); save()">
        <h2>{{ editing() ? 'Editar aviso' : 'Nuevo aviso' }}</h2>
        <cx-localized-field [formField]="alert.message" label="Mensaje" [charLimit]="140" />
        @if (alert.message.es().touched() && alert.message.es().invalid()) {
          <p class="error">{{ alert.message.es().errors()[0].message }}</p>
        }
        <div class="grid-2">
          <cx-localized-field
            [formField]="alert.linkLabel"
            label="Texto del enlace"
            [charLimit]="30"
          />
          <div class="field">
            <label for="alert-link">Enlace</label>
            <input id="alert-link" placeholder="/ofertas" [formField]="alert.link" />
            @if (alert.link().invalid()) {
              <span class="error">{{ alert.link().errors()[0].message }}</span>
            }
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="tone">Estilo</label>
            <select id="tone" [formField]="alert.tone">
              @for (t of tones; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <label class="check">
            <input type="checkbox" [formField]="alert.isActive" />
            Activo
          </label>
          <div class="field">
            <label for="alert-start">Desde</label>
            <input id="alert-start" type="datetime-local" [formField]="alert.startsAt" />
          </div>
          <div class="field">
            <label for="alert-end">Hasta</label>
            <input id="alert-end" type="datetime-local" [formField]="alert.endsAt" />
            @if (alert.endsAt().invalid()) {
              <span class="error">{{ alert.endsAt().errors()[0].message }}</span>
            }
          </div>
        </div>
        <div class="preview" [class]="'preview ' + model().tone" aria-label="Vista previa">
          {{ model().message.es || 'Así se verá el aviso.' }}
          @if (model().linkLabel.es) {
            <u>{{ model().linkLabel.es }} →</u>
          }
        </div>
        <div class="actions">
          <button class="btn outline" type="button" (click)="editing.set(null)">Cancelar</button>
          <button class="btn primary" type="submit" [disabled]="alert().submitting()">
            {{ alert().submitting() ? 'Guardando…' : 'Guardar aviso' }}
          </button>
        </div>
      </form>
    }

    @if (alerts.error()) {
      <cx-error-state [error]="alerts.error()" (retry)="alerts.reload()" />
    } @else if (!alerts.hasValue()) {
      <cx-skeleton height="120px" radius="20px" />
    } @else {
      <ul class="list">
        @for (a of alerts.value(); track a.id) {
          <li class="card item">
            <div class="title">
              <strong>{{ a.message.es }}</strong>
              <small>{{ a.message.en || 'Sin traducción al inglés' }}</small>
            </div>
            <div class="row-actions">
              <cx-live-badge [item]="a" />
              <button class="link-btn" type="button" (click)="edit(a)">Editar</button>
              <button class="link-btn danger" type="button" (click)="remove(a)">Eliminar</button>
            </div>
          </li>
        } @empty {
          <cx-empty-state
            icon="📣"
            title="Sin avisos"
            message="Crea uno para anunciar promociones."
          />
        }
      </ul>
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
  styles: `
    h2 {
      font-size: 1.15rem;
    }
    .item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 14px 16px;
    }
    .title {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .title small {
      color: var(--cx-text-2);
    }
    .row-actions,
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .actions {
      justify-content: flex-end;
    }
    .preview {
      padding: 10px 14px;
      border-radius: var(--cx-radius-md);
      color: var(--cx-on-dark);
      font-weight: 600;
      text-align: center;
    }
    .preview.promo {
      background: var(--cx-primary-fill);
    }
    .preview.info {
      background: var(--cx-navy);
    }
    .preview.warning {
      background: var(--cx-gold);
      color: var(--cx-on-gold);
    }
  `,
})
export class AlertsPage {
  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly alerts = resource({ loader: () => this.cms.alerts() });
  /** `null` = form closed, `''` = new alert, otherwise the id being edited. */
  protected readonly editing = signal<string | null>(null);
  protected readonly tones = TONES;

  protected readonly model = signal<AlertModel>(BLANK);
  protected readonly alert = form(this.model, (p) => {
    required(p.message.es, { message: 'El mensaje en español es obligatorio.' });
    linkRule(p.link);
    dateRangeRule(p.startsAt, p.endsAt);
  });

  protected edit(alert: SiteAlert | null): void {
    this.editing.set(alert?.id ?? '');
    this.model.set(
      alert
        ? {
            message: toTextModel(alert.message),
            linkLabel: toTextModel(alert.linkLabel),
            link: alert.link ?? '',
            tone: alert.tone,
            startsAt: toLocalInput(alert.startsAt),
            endsAt: toLocalInput(alert.endsAt),
            isActive: alert.isActive,
          }
        : BLANK,
    );
  }

  protected save(): Promise<boolean> {
    return submit(this.alert, async () => {
      const m = this.model();
      try {
        await this.cms.saveAlert({
          id: this.editing() ?? '',
          message: fromTextModel(m.message) ?? { es: '' },
          linkLabel: fromTextModel(m.linkLabel),
          link: m.link.trim() || undefined,
          tone: m.tone,
          startsAt: fromLocalInput(m.startsAt),
          endsAt: fromLocalInput(m.endsAt),
          isActive: m.isActive,
        });
        this.toast.success('Aviso guardado.');
        this.editing.set(null);
        this.alerts.reload();
        this.content.reload();
      } catch (e) {
        this.toast.error(e, 'No se pudo guardar el aviso.');
      }
    });
  }

  protected async remove(alert: SiteAlert): Promise<void> {
    if (!confirm('¿Eliminar este aviso?')) return;
    try {
      await this.cms.deleteAlert(alert.id);
      this.toast.success('Aviso eliminado.');
      this.alerts.reload();
      this.content.reload();
    } catch (e) {
      this.toast.error(e);
    }
  }
}
