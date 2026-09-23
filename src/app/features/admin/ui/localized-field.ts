import { Component, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { LocalizedText } from '../../../domain/content';

let nextId = 0;

/**
 * Spanish + English inputs for one piece of site copy. Spanish is the source
 * (required when the form says so); English falls back to it when empty.
 */
@Component({
  selector: 'cx-localized-field',
  template: `
    <fieldset class="field" [attr.aria-describedby]="invalid() ? uid + '-err' : null">
      <legend>
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true">*</span>
        }
      </legend>
      <div class="pair">
        @for (lang of langs; track lang.code) {
          <label [for]="uid + '-' + lang.code">
            <span class="lang">{{ lang.name }}</span>
            @if (multiline()) {
              <textarea
                [id]="uid + '-' + lang.code"
                [attr.lang]="lang.code"
                rows="3"
                [attr.maxlength]="charLimit()"
                [placeholder]="lang.code === 'en' ? 'Opcional — usa el español si está vacío' : ''"
                [value]="value()[lang.code] ?? ''"
                [attr.aria-invalid]="lang.code === 'es' && invalid()"
                (input)="set(lang.code, $any($event.target).value)"
                (blur)="touch.emit()"
              ></textarea>
            } @else {
              <input
                [id]="uid + '-' + lang.code"
                [attr.lang]="lang.code"
                [attr.maxlength]="charLimit()"
                [placeholder]="lang.code === 'en' ? 'Opcional — usa el español si está vacío' : ''"
                [value]="value()[lang.code] ?? ''"
                [attr.aria-invalid]="lang.code === 'es' && invalid()"
                (input)="set(lang.code, $any($event.target).value)"
                (blur)="touch.emit()"
              />
            }
          </label>
        }
      </div>
      @if (invalid() && touched()) {
        <p class="error" [id]="uid + '-err'" role="alert">
          @for (e of errors(); track $index) {
            {{ e.message }}
          }
        </p>
      }
    </fieldset>
  `,
  styles: `
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
    }
    legend {
      padding: 0;
      margin-bottom: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--cx-text-2);
    }
    .pair {
      display: grid;
      gap: 10px;
    }
    @media (min-width: 768px) {
      .pair {
        grid-template-columns: 1fr 1fr;
      }
    }
    label {
      display: grid;
      gap: 4px;
    }
    .lang {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--cx-text-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
  `,
})
export class LocalizedField implements FormValueControl<LocalizedText> {
  readonly value = model<LocalizedText>({ es: '' });
  readonly label = input.required<string>();
  readonly multiline = input(false);
  /** Per-language character limit. */
  readonly charLimit = input<number | undefined>(undefined);

  // Form state from [formField]
  readonly required = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  readonly touch = output<void>();

  protected readonly uid = `loc-${++nextId}`;
  protected readonly langs = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
  ] as const;

  protected set(lang: 'es' | 'en', text: string): void {
    this.value.update((v) => ({ ...v, [lang]: text }));
  }
}
