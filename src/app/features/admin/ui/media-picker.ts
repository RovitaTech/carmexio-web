import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { ToastStore } from '../../../core/ui/toast.store';
import { MediaAsset, MediaKind } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';

let nextId = 0;

/**
 * URL field backed by the media library: pick an existing photo/video or
 * upload a new one (it lands in the library too). Emits the asset so the
 * parent can react to its kind (image vs video).
 */
@Component({
  selector: 'cx-media-picker',
  template: `
    <div class="picker">
      <span class="label" [id]="uid">{{ label() }}</span>
      <div class="preview" [attr.aria-labelledby]="uid">
        @if (value()) {
          @if (isVideo()) {
            <video [src]="value()" muted playsinline controls preload="metadata"></video>
          } @else {
            <img [src]="value()" alt="" />
          }
        } @else {
          <span class="empty">Sin archivo</span>
        }
      </div>
      <div class="actions">
        <button class="btn outline" type="button" (click)="open()">Elegir de la biblioteca</button>
        <label class="btn outline upload" [class.busy]="uploading()">
          {{ uploading() ? 'Subiendo…' : 'Subir archivo' }}
          <input
            type="file"
            class="visually-hidden"
            [accept]="acceptAttr()"
            [disabled]="uploading()"
            (change)="upload($any($event.target))"
          />
        </label>
        @if (value() && !required()) {
          <button class="btn outline" type="button" (click)="value.set('')">Quitar</button>
        }
      </div>
    </div>

    <dialog
      #dialog
      class="card library"
      aria-labelledby="lib-title"
      (close)="dialogOpen.set(false)"
    >
      <header>
        <h2 id="lib-title">Biblioteca de medios</h2>
        <button type="button" class="close" aria-label="Cerrar" (click)="closeDialog()">✕</button>
      </header>
      @if (dialogOpen()) {
        @if (library.isLoading()) {
          <p class="muted">Cargando…</p>
        } @else {
          <ul class="grid">
            @for (m of filtered(); track m.id) {
              <li>
                <button type="button" [class.selected]="m.url === value()" (click)="choose(m)">
                  @if (m.kind === 'video') {
                    <video [src]="m.url" muted preload="metadata"></video>
                    <span class="kind">Video</span>
                  } @else {
                    <img [src]="m.url" [alt]="m.name" loading="lazy" />
                  }
                  <span class="name">{{ m.name }}</span>
                </button>
              </li>
            } @empty {
              <li class="muted">Aún no hay archivos. Sube uno.</li>
            }
          </ul>
        }
      }
    </dialog>
  `,
  styles: `
    .picker {
      display: grid;
      gap: 8px;
    }
    .label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--cx-text-2);
    }
    .preview {
      display: grid;
      place-items: center;
      aspect-ratio: 16 / 9;
      max-width: 420px;
      overflow: hidden;
      border: 1.4px dashed var(--cx-border);
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface-alt);
    }
    .preview img,
    .preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .empty {
      color: var(--cx-text-3);
      font-weight: 600;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .actions .btn {
      min-height: 40px;
      padding: 0 14px;
    }
    .upload:has(input:focus-visible) {
      outline: 3px solid var(--cx-primary);
      outline-offset: 2px;
    }
    .upload.busy {
      opacity: 0.6;
    }
    .library {
      width: min(920px, calc(100vw - 32px));
      max-height: calc(100vh - 64px);
      padding: 20px;
      border: 0;
      color: var(--cx-text);
    }
    .library::backdrop {
      background: rgb(10 15 28 / 60%);
    }
    .library header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .close {
      border: 0;
      background: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: inherit;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .grid button {
      position: relative;
      display: grid;
      gap: 4px;
      width: 100%;
      padding: 6px;
      border: 2px solid transparent;
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface-alt);
      color: inherit;
      cursor: pointer;
      text-align: left;
    }
    .grid button.selected {
      border-color: var(--cx-primary);
    }
    .grid img,
    .grid video {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: var(--cx-radius-sm);
    }
    .kind {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 2px 8px;
      border-radius: var(--cx-radius-pill);
      background: var(--cx-navy);
      color: var(--cx-on-dark);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .name {
      overflow: hidden;
      font-size: 0.75rem;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `,
})
export class MediaPicker implements FormValueControl<string> {
  readonly value = model('');
  readonly label = input.required<string>();
  readonly accept = input<MediaKind | 'any'>('image');
  readonly required = input(false);
  readonly picked = output<MediaAsset>();

  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly uid = `media-${++nextId}`;
  protected readonly dialogOpen = signal(false);
  protected readonly uploading = signal(false);
  /** The kind of the current value, as reported by the last pick/upload. */
  private readonly kind = signal<MediaKind | null>(null);

  protected readonly library = resource({
    params: () => (this.dialogOpen() ? true : undefined),
    loader: () => this.cms.media(),
  });
  protected readonly filtered = computed(() => {
    const accept = this.accept();
    const all = this.library.hasValue() ? this.library.value() : [];
    return accept === 'any' ? all : all.filter((m) => m.kind === accept);
  });
  protected readonly isVideo = computed(
    () => this.kind() === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(this.value()),
  );
  protected readonly acceptAttr = computed(() =>
    this.accept() === 'image'
      ? 'image/*'
      : this.accept() === 'video'
        ? 'video/*'
        : 'image/*,video/*',
  );

  protected open(): void {
    this.dialogOpen.set(true);
    const dialog = this.dialog().nativeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', ''); // environments without <dialog> support
  }

  protected closeDialog(): void {
    const dialog = this.dialog().nativeElement;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    this.dialogOpen.set(false);
  }

  protected choose(asset: MediaAsset): void {
    this.select(asset);
    this.closeDialog();
  }

  protected async upload(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    try {
      this.select(await this.cms.uploadMedia(file, file.name));
      this.toast.success('Archivo subido a la biblioteca.');
    } catch (e) {
      this.toast.error(e, 'No se pudo subir el archivo.');
    } finally {
      this.uploading.set(false);
    }
  }

  private select(asset: MediaAsset): void {
    this.kind.set(asset.kind);
    this.value.set(asset.url);
    this.picked.emit(asset);
  }
}
