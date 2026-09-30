import { Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { carSlug, formatKm, formatPrice } from '../../core/utils/format';
import { InventoryFilter } from '../../domain/models';
import { STAFF_REPOSITORY } from '../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/state-views';
import { StatusPill } from '../../shared/ui/status-pill';
import { StaffScope } from './staff-scope.store';

/**
 * Inventory check: stock of every branch (live + sold), read-only. Branch admins use it to
 * answer "do we have one in Guadalajara?"; pending ads, owners and chats stay per branch.
 */
@Component({
  selector: 'cx-staff-inventory-page',
  imports: [RouterLink, EmptyState, ErrorState, Skeleton, StatusPill],
  template: `
    <header>
      <h1>Inventario</h1>
      <p>Autos disponibles y vendidos de todas las sucursales (solo lectura).</p>
    </header>

    <div class="filters">
      <div class="field">
        <label for="inv-branch">Sucursal</label>
        <select id="inv-branch" (change)="branch.set($any($event.target).value || undefined)">
          <option value="">Todas</option>
          @for (l of scope.locations.value() ?? []; track l.id) {
            <option [value]="l.id">{{ l.name }}</option>
          }
        </select>
      </div>
      <div class="field search">
        <label for="inv-q">Buscar</label>
        <input
          id="inv-q"
          type="search"
          placeholder="Marca o modelo"
          (input)="query.set($any($event.target).value)"
        />
      </div>
      <div class="chips" role="group" aria-label="Estado">
        @for (s of statuses; track s.label) {
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

    @if (cars.error()) {
      <cx-error-state [error]="cars.error()" (retry)="cars.reload()" />
    } @else if (!cars.hasValue()) {
      <cx-skeleton height="240px" radius="20px" />
    } @else if (cars.value().length) {
      <p class="count">{{ cars.value().length }} autos</p>
      <div class="card table-wrap">
        <table>
          <caption class="visually-hidden">
            Inventario de todas las sucursales
          </caption>
          <thead>
            <tr>
              <th scope="col">Auto</th>
              <th scope="col">Sucursal</th>
              <th scope="col">Precio</th>
              <th scope="col">Km</th>
              <th scope="col">Estado</th>
              <th scope="col">Inspección</th>
              <th scope="col"><span class="visually-hidden">Ver</span></th>
            </tr>
          </thead>
          <tbody>
            @for (car of cars.value(); track car.id) {
              <tr>
                <th scope="row">
                  <span class="car">
                    @if (car.images[0]; as src) {
                      <img [src]="src" alt="" loading="lazy" />
                    }
                    <span>{{ car.brand }} {{ car.model }} {{ car.year }}</span>
                  </span>
                </th>
                <td>{{ car.location?.city ?? car.city }}</td>
                <td>{{ price(car.price) }}</td>
                <td>{{ km(car.mileageKm) }}</td>
                <td><cx-status-pill [status]="car.status" /></td>
                <td>
                  {{ car.inspectionScore !== undefined ? car.inspectionScore.toFixed(1) : '—' }}
                </td>
                <td>
                  @if (car.status === 'active') {
                    <a [routerLink]="['/autos', slug(car)]" target="_blank">Ver ↗</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <cx-empty-state icon="🔍" title="Sin autos" message="Prueba otra sucursal o búsqueda." />
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
    header p,
    .count {
      color: var(--cx-text-2);
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 12px;
    }
    .search {
      flex: 1 1 220px;
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
      min-width: 760px;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--cx-border);
      text-align: left;
      vertical-align: middle;
    }
    thead th {
      color: var(--cx-text-2);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .car {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    img {
      width: 56px;
      height: 42px;
      border-radius: var(--cx-radius-sm);
      object-fit: cover;
    }
    td a {
      color: var(--cx-primary-text);
      font-weight: 600;
    }
  `,
})
export class InventoryPage {
  protected readonly scope = inject(StaffScope);
  private readonly staff = inject(STAFF_REPOSITORY);

  protected readonly branch = signal<string | undefined>(undefined);
  protected readonly status = signal<InventoryFilter['status']>(undefined);
  protected readonly query = signal('');
  protected readonly statuses: { value: InventoryFilter['status']; label: string }[] = [
    { value: undefined, label: 'Todos' },
    { value: 'active', label: 'Disponibles' },
    { value: 'sold', label: 'Vendidos' },
  ];

  protected readonly cars = resource({
    params: () => ({ locationId: this.branch(), status: this.status(), query: this.query() }),
    loader: ({ params }) => this.staff.inventory(params),
  });

  protected price = formatPrice;
  protected km = formatKm;
  protected slug = carSlug;
}
