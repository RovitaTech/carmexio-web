import { Component, effect, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatPrice, timeAgo } from '../../core/utils/format';
import { ListingStatus, STATUS_STAFF_LABELS } from '../../domain/models';
import { STAFF_REPOSITORY } from '../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/state-views';
import { StatusPill } from '../../shared/ui/status-pill';
import { StaffScope } from './staff-scope.store';

/** Every listing in scope, any status — search, filter, jump to review/inspection. */
@Component({
  selector: 'cx-staff-listings-page',
  imports: [RouterLink, EmptyState, ErrorState, Skeleton, StatusPill],
  template: `
    <header>
      <h1>Anuncios</h1>
      <p>{{ scope.label() }}</p>
    </header>

    <div class="filters">
      <div class="field search">
        <label for="q">Buscar</label>
        <input
          id="q"
          type="search"
          placeholder="Marca, modelo o ID"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </div>
      <div class="chips" role="group" aria-label="Estado">
        @for (s of statuses; track s.value) {
          <button
            type="button"
            class="chip"
            [class.active]="status() === s.value"
            [attr.aria-pressed]="status() === s.value"
            (click)="status.set(s.value)"
          >
            {{ s.label }}
          </button>
        }
      </div>
    </div>

    @if (rows.error()) {
      <cx-error-state [error]="rows.error()" (retry)="rows.reload()" />
    } @else if (!rows.hasValue()) {
      <cx-skeleton height="240px" radius="20px" />
    } @else if (rows.value().length) {
      <div class="card table-wrap">
        <table>
          <caption class="visually-hidden">
            Anuncios
          </caption>
          <thead>
            <tr>
              <th scope="col">Auto</th>
              <th scope="col">Precio</th>
              <th scope="col">Estado</th>
              <th scope="col">Inspección</th>
              <th scope="col">Actualizado</th>
              <th scope="col"><span class="visually-hidden">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (car of rows.value(); track car.id) {
              <tr>
                <th scope="row">
                  {{ car.brand }} {{ car.model }} {{ car.year }}
                  <small>{{ car.location?.name }} · {{ car.id.toUpperCase() }}</small>
                </th>
                <td>{{ price(car.price) }}</td>
                <td>
                  <cx-status-pill [status]="car.status" />
                  @if (car.isFeatured) {
                    <span class="flag" title="Destacado">★</span>
                  }
                  @if (car.isVerified) {
                    <span class="flag" title="Carmexio Certificado">✔</span>
                  }
                </td>
                <td>
                  {{ car.inspectionScore !== undefined ? car.inspectionScore.toFixed(1) : '—' }}
                </td>
                <td>{{ ago(car.updatedAt) }}</td>
                <td class="actions">
                  <a [routerLink]="['/staff/revision', car.id]">Revisar</a>
                  <a [routerLink]="['/staff/inspecciones', car.id]">Inspección</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <cx-empty-state icon="🔍" title="Sin resultados" message="Prueba otro estado o búsqueda." />
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
    header p {
      color: var(--cx-text-2);
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 12px;
    }
    .search {
      flex: 1 1 260px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 720px;
    }
    th,
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--cx-border);
      text-align: left;
      vertical-align: middle;
    }
    thead th {
      color: var(--cx-text-2);
      font-size: 0.8rem;
      font-weight: 700;
    }
    tbody th small {
      display: block;
      color: var(--cx-text-2);
      font-weight: 500;
    }
    .flag {
      margin-left: 6px;
      color: var(--cx-warning-text);
    }
    .actions {
      display: flex;
      gap: 12px;
      white-space: nowrap;
    }
    .actions a {
      color: var(--cx-primary-dark);
      font-weight: 700;
    }
  `,
})
export class StaffListingsPage {
  protected readonly scope = inject(StaffScope);
  private readonly staff = inject(STAFF_REPOSITORY);

  protected readonly query = signal('');
  protected readonly status = signal<ListingStatus | undefined>(undefined);
  /** `query` after the user stops typing for 300 ms. */
  private readonly search = signal('');

  protected readonly rows = resource({
    params: () => ({
      locationId: this.scope.locationId(),
      status: this.status(),
      query: this.search(),
    }),
    loader: ({ params }) => this.staff.listings(params),
  });

  protected readonly statuses: { value: ListingStatus | undefined; label: string }[] = [
    { value: undefined, label: 'Todos' },
    ...(Object.entries(STATUS_STAFF_LABELS) as [ListingStatus, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ];
  protected readonly price = formatPrice;
  protected readonly ago = timeAgo;

  constructor() {
    effect((onCleanup) => {
      const q = this.query();
      const timer = setTimeout(() => this.search.set(q), 300);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
