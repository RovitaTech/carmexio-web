import { Component, computed, inject } from '@angular/core';
import { PHOTO_ANGLES, PhotoAngle } from '../../domain/models';
import { SellStore } from './sell.store';

/**
 * One slot per mandatory angle. The slot is a <label> around a hidden file
 * input with `capture="environment"`, so tapping it opens the rear camera on
 * phones (file picker on desktop). Done slots turn grey with a check.
 */
@Component({
  selector: 'cx-angle-grid',
  template: `
    <div class="progress">
      <div class="bar"><span [style.width.%]="(store.doneShots() / total) * 100"></span></div>
      <strong>{{ store.doneShots() }} / {{ total }}</strong>
    </div>
    <ul class="grid">
      @for (a of slots(); track a.value) {
        <li class="slot" [class.done]="a.done" [class.failed]="a.shot?.error">
          <label [attr.aria-label]="a.label + (a.done ? ', listo' : ', tomar foto')">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="visually-hidden"
              [disabled]="a.shot?.uploading || a.done"
              (change)="onFile(a.value, $event)"
            />
            @if (a.image) {
              <img [src]="a.image" alt="" />
            } @else {
              <span class="empty" aria-hidden="true">📷<small>Toca para tomar</small></span>
            }
            @if (a.shot?.uploading) {
              <span class="overlay"><span class="spinner"></span></span>
            }
            @if (a.done) {
              <span class="check" aria-hidden="true">✓</span>
            }
            @if (a.shot?.error) {
              <span class="retry">Reintentar</span>
            }
          </label>
          <div class="meta">
            <strong>{{ a.label }}</strong>
            <small>{{ a.instruction }}</small>
            @if (a.done) {
              <label class="retake">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="visually-hidden"
                  (change)="onFile(a.value, $event)"
                />
                Volver a tomar
              </label>
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    .progress {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .bar {
      flex: 1;
      height: 8px;
      border-radius: 99px;
      background: var(--cx-surface-alt);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--cx-primary);
      transition: width 0.3s;
    }
    .grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .slot {
      overflow: hidden;
      border: 1.6px solid color-mix(in srgb, var(--cx-primary) 50%, transparent);
      border-radius: var(--cx-radius-lg);
      background: var(--cx-surface);
    }
    .slot.done {
      border-color: var(--cx-border);
      background: var(--cx-surface-alt);
    }
    .slot.failed {
      border-color: var(--cx-error);
    }
    .slot > label {
      position: relative;
      display: block;
      aspect-ratio: 4 / 3;
      cursor: pointer;
      background: var(--cx-primary-soft);
    }
    .slot.done > label {
      cursor: default;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .done img {
      filter: grayscale(1);
      opacity: 0.55;
    }
    .empty {
      display: grid;
      place-items: center;
      height: 100%;
      font-size: 1.8rem;
      color: var(--cx-primary-text);
    }
    .empty small {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: var(--cx-photo-overlay);
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--cx-on-dark);
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .check {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--cx-success-fill);
      color: var(--cx-on-dark);
      font-weight: 800;
    }
    .retry {
      position: absolute;
      inset: auto 0 10px;
      margin: auto;
      width: max-content;
      padding: 4px 10px;
      border-radius: 99px;
      background: var(--cx-error-fill);
      color: var(--cx-on-dark);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .meta {
      display: grid;
      gap: 2px;
      padding: 10px 12px;
    }
    .meta small {
      color: var(--cx-text-3);
      font-size: 0.72rem;
    }
    .done .meta strong {
      color: var(--cx-text-3);
    }
    .retake {
      color: var(--cx-primary-text);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 4px;
    }
  `,
})
export class AngleGrid {
  protected readonly store = inject(SellStore);
  protected readonly total = PHOTO_ANGLES.length;

  protected readonly slots = computed(() =>
    PHOTO_ANGLES.map((a) => {
      const shot = this.store.shots()[a.value];
      return {
        ...a,
        shot,
        image: shot?.preview ?? shot?.url,
        done: !!shot?.url && !shot.uploading,
      };
    }),
  );

  protected onFile(angle: PhotoAngle, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.store.capture(angle, file);
  }
}
