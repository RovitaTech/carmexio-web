import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  BODY_LABELS,
  BodyType,
  DealerLocation,
  FUEL_LABELS,
  FuelType,
  TRANSMISSION_LABELS,
  Transmission,
} from '../../../domain/models';
import { StockImportOutcome } from '../../../domain/stock-import';
import { ImportRow, StockDraft, draftProblems } from './catalog-rows';

export interface DraftEdit {
  line: number;
  patch: Partial<StockDraft>;
}

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));

/** Preview of the parsed file: every car on one line, missing fields editable in place. */
@Component({
  selector: 'cx-import-table',
  imports: [DecimalPipe],
  template: `
    <div class="scroll" role="region" aria-label="Autos del archivo" tabindex="0">
      <table>
        <caption class="visually-hidden">
          Autos del archivo, con los datos que faltan editables
        </caption>
        <thead>
          <tr>
            <th scope="col">Fila</th>
            <th scope="col">Auto</th>
            <th scope="col">Año</th>
            <th scope="col">Precio (MXN)</th>
            <th scope="col">Km</th>
            <th scope="col">Sucursal</th>
            <th scope="col">Combustible</th>
            <th scope="col">Transmisión</th>
            <th scope="col">Carrocería</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.line) {
            @let d = row.draft;
            @let problems = problemsOf(row);
            @let result = results()[row.line];
            <tr [class.blocked]="problems.length">
              <td class="num">{{ row.line }}</td>
              <td class="car">
                @if (d.imageUrls[0]; as src) {
                  <img [src]="src" alt="" loading="lazy" referrerpolicy="no-referrer" />
                } @else {
                  <span class="nophoto" aria-hidden="true">Sin foto</span>
                }
                <div>
                  <input
                    class="brand"
                    [value]="d.brand"
                    placeholder="Marca"
                    [attr.aria-label]="'Marca, fila ' + row.line"
                    (change)="edit(row, { brand: text($event) })"
                  />
                  <input
                    [value]="d.model"
                    placeholder="Modelo"
                    [attr.aria-label]="'Modelo, fila ' + row.line"
                    (change)="edit(row, { model: text($event) })"
                  />
                  <small class="muted"
                    >{{ d.imageUrls.length }} foto(s){{ d.sold ? ' · vendido' : '' }}</small
                  >
                </div>
              </td>
              <td>
                <input
                  class="short"
                  type="number"
                  inputmode="numeric"
                  [value]="d.year ?? ''"
                  [attr.aria-label]="'Año, fila ' + row.line"
                  (change)="edit(row, { year: num($event) })"
                />
              </td>
              <td>
                <input
                  type="number"
                  inputmode="numeric"
                  [value]="d.price ?? ''"
                  [attr.aria-label]="'Precio, fila ' + row.line"
                  (change)="edit(row, { price: num($event) })"
                />
              </td>
              <td>
                <input
                  type="number"
                  inputmode="numeric"
                  [value]="d.mileageKm ?? ''"
                  [attr.aria-label]="'Kilometraje, fila ' + row.line"
                  (change)="edit(row, { mileageKm: num($event) })"
                />
              </td>
              <td>
                <select
                  [attr.aria-label]="'Sucursal, fila ' + row.line"
                  (change)="edit(row, { locationId: text($event) || null })"
                >
                  <option value="" [selected]="!d.locationId">Elegir…</option>
                  @for (l of locations(); track l.id) {
                    <option [value]="l.id" [selected]="d.locationId === l.id">{{ l.city }}</option>
                  }
                </select>
              </td>
              <td>
                <select
                  [attr.aria-label]="'Combustible, fila ' + row.line"
                  (change)="edit(row, { fuelType: $any(text($event)) || null })"
                >
                  <option value="" [selected]="!d.fuelType">Elegir…</option>
                  @for (o of fuels; track o.value) {
                    <option [value]="o.value" [selected]="d.fuelType === o.value">
                      {{ o.label }}
                    </option>
                  }
                </select>
              </td>
              <td>
                <select
                  [attr.aria-label]="'Transmisión, fila ' + row.line"
                  (change)="edit(row, { transmission: $any(text($event)) || null })"
                >
                  <option value="" [selected]="!d.transmission">Elegir…</option>
                  @for (o of transmissions; track o.value) {
                    <option [value]="o.value" [selected]="d.transmission === o.value">
                      {{ o.label }}
                    </option>
                  }
                </select>
              </td>
              <td>
                <select
                  [attr.aria-label]="'Carrocería, fila ' + row.line"
                  (change)="edit(row, { bodyType: $any(text($event)) || null })"
                >
                  <option value="" [selected]="!d.bodyType">Elegir…</option>
                  @for (o of bodies; track o.value) {
                    <option [value]="o.value" [selected]="d.bodyType === o.value">
                      {{ o.label }}
                    </option>
                  }
                </select>
              </td>
              <td class="state">
                @if (result) {
                  @switch (result.status) {
                    @case ('created') {
                      <span class="ok">✓ Publicado</span>
                    }
                    @case ('updated') {
                      <span class="ok">✓ Actualizado</span>
                    }
                    @default {
                      <span class="bad">✕ {{ result.error?.message }}</span>
                    }
                  }
                  @if (result.photos.failed) {
                    <small class="muted"
                      >{{ result.photos.failed }} foto(s) no se pudieron copiar</small
                    >
                  }
                } @else if (problems.length) {
                  <span class="bad">Falta: {{ problems.join(', ') }}</span>
                } @else {
                  <span class="ok">Listo · {{ d.price | number }}</span>
                }
                @for (note of row.notes; track note) {
                  <small class="note">{{ note }}</small>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .scroll {
      overflow-x: auto;
      border: 1px solid var(--cx-border);
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface);
    }
    table {
      width: 100%;
      min-width: 1080px;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    th,
    td {
      padding: 8px;
      border-bottom: 1px solid var(--cx-border);
      text-align: left;
      vertical-align: top;
    }
    th {
      position: sticky;
      top: 0;
      background: var(--cx-surface-alt);
      font-weight: 700;
      white-space: nowrap;
    }
    tr.blocked {
      background: color-mix(in srgb, var(--cx-warning-text) 6%, transparent);
    }
    .num {
      color: var(--cx-text-2);
    }
    .car {
      display: flex;
      gap: 8px;
      min-width: 240px;
    }
    .car div {
      display: grid;
      gap: 4px;
    }
    img,
    .nophoto {
      width: 64px;
      height: 48px;
      flex-shrink: 0;
      border-radius: var(--cx-radius-sm);
      object-fit: cover;
      background: var(--cx-surface-alt);
    }
    .nophoto {
      display: grid;
      place-items: center;
      font-size: 0.7rem;
      color: var(--cx-text-2);
    }
    input,
    select {
      width: 100%;
      min-width: 90px;
      padding: 6px 8px;
      border: 1px solid var(--cx-border);
      border-radius: var(--cx-radius-sm);
      background: var(--cx-bg);
      color: inherit;
      font: inherit;
    }
    input.short {
      min-width: 70px;
    }
    input.brand {
      font-weight: 700;
    }
    .state {
      display: grid;
      gap: 4px;
      min-width: 200px;
    }
    .ok {
      color: var(--cx-success-text);
      font-weight: 700;
    }
    .bad {
      color: var(--cx-error-text);
      font-weight: 700;
    }
    .note {
      color: var(--cx-warning-text);
    }
  `,
})
export class ImportTable {
  readonly rows = input.required<readonly ImportRow[]>();
  readonly locations = input.required<readonly DealerLocation[]>();
  readonly results = input<Readonly<Record<number, StockImportOutcome>>>({});
  readonly maxYear = input.required<number>();
  readonly edited = output<DraftEdit>();

  protected readonly fuels = options<FuelType>(FUEL_LABELS);
  protected readonly transmissions = options<Transmission>(TRANSMISSION_LABELS);
  protected readonly bodies = options<BodyType>(BODY_LABELS);
  private readonly problems = computed(
    () => new Map(this.rows().map((r) => [r.line, draftProblems(r.draft, this.maxYear())])),
  );

  protected problemsOf(row: ImportRow): string[] {
    return this.problems().get(row.line) ?? [];
  }

  protected edit(row: ImportRow, patch: Partial<StockDraft>): void {
    this.edited.emit({ line: row.line, patch });
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value.trim();
  }

  protected num(event: Event): number | null {
    const value = (event.target as HTMLInputElement).value;
    return value === '' ? null : Number(value);
  }
}
