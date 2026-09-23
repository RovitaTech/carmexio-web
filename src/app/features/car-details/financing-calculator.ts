import { Component, computed, input, output, signal } from '@angular/core';
import {
  DEFAULT_ANNUAL_RATE,
  LOAN_TERMS,
  MAX_DOWN_PCT,
  MIN_DOWN_PCT,
  quoteLoan,
} from '../../core/utils/finance';
import { formatPrice } from '../../core/utils/format';
import { Icon } from '../../shared/ui/icon';

/** Estimated monthly payment; "Solicitar" opens a chat with Carmexio about the car. */
@Component({
  selector: 'cx-financing-calculator',
  imports: [Icon],
  template: `
    <section class="card calc" aria-labelledby="calc-title">
      <header>
        <span class="icon"><cx-icon name="calculator" /></span>
        <h2 id="calc-title" i18n="@@finance.title">Calcula tu mensualidad</h2>
      </header>

      <div class="field">
        <label for="down">
          <ng-container i18n="@@finance.down">Enganche</ng-container>
          <strong>{{ downPct() }}% · {{ money(quote().downPayment) }}</strong>
        </label>
        <input
          id="down"
          type="range"
          [min]="minDown"
          [max]="maxDown"
          step="5"
          [value]="downPct()"
          (input)="downPct.set(+$any($event.target).value)"
        />
      </div>

      <fieldset class="terms">
        <legend i18n="@@finance.term">Plazo</legend>
        @for (t of terms; track t) {
          <label [class.on]="months() === t">
            <input
              type="radio"
              name="term"
              class="visually-hidden"
              [value]="t"
              [checked]="months() === t"
              (change)="months.set(t)"
            />
            <ng-container i18n="@@finance.months">{{ t }} meses</ng-container>
          </label>
        }
      </fieldset>

      <div class="result" aria-live="polite">
        <span i18n="@@finance.monthly">Mensualidad estimada</span>
        <strong>{{ money(quote().monthly) }}</strong>
        <small i18n="@@finance.detail"
          >Monto a financiar {{ money(quote().financed) }} · tasa {{ rate }}% anual</small
        >
      </div>

      <button class="btn primary block" type="button" (click)="apply.emit()">
        <ng-container i18n="@@finance.apply">Solicitar financiamiento</ng-container>
        <cx-icon name="arrowRight" [size]="18" />
      </button>
      <p class="fine" i18n="@@finance.disclaimer">
        Cálculo informativo, no es una oferta de crédito. Sujeto a aprobación.
      </p>
    </section>
  `,
  styles: `
    .calc {
      display: grid;
      gap: 16px;
      padding: 20px;
    }
    header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h2 {
      font-size: 1.15rem;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-primary-soft);
      color: var(--cx-primary-text);
    }
    .field label {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--cx-text-2);
    }
    .field strong {
      color: var(--cx-text);
    }
    input[type='range'] {
      width: 100%;
      accent-color: var(--cx-primary);
    }
    .terms {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0;
      padding: 0;
      border: 0;
    }
    legend {
      width: 100%;
      margin-bottom: 6px;
      font-size: 0.9rem;
      color: var(--cx-text-2);
    }
    .terms label {
      padding: 8px 12px;
      border: 1px solid var(--cx-border);
      border-radius: var(--cx-radius-pill);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
    }
    .terms label.on {
      border-color: var(--cx-primary-fill);
      background: var(--cx-primary-fill);
      color: var(--cx-on-dark);
    }
    .terms label:has(input:focus-visible) {
      outline: 3px solid var(--cx-primary);
      outline-offset: 2px;
    }
    .result {
      display: grid;
      gap: 2px;
      padding: 16px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface-alt);
    }
    .result span,
    .result small {
      color: var(--cx-text-2);
    }
    .result strong {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .fine {
      font-size: 0.75rem;
      color: var(--cx-text-2);
    }
  `,
})
export class FinancingCalculator {
  readonly price = input.required<number>();
  readonly apply = output<void>();

  protected readonly downPct = signal(20);
  protected readonly months = signal<number>(48);
  protected readonly quote = computed(() => quoteLoan(this.price(), this.downPct(), this.months()));

  protected readonly terms = LOAN_TERMS;
  protected readonly minDown = MIN_DOWN_PCT;
  protected readonly maxDown = MAX_DOWN_PCT;
  protected readonly rate = DEFAULT_ANNUAL_RATE;
  protected readonly money = formatPrice;
}
