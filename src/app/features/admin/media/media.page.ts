import { Component, computed, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import { MediaAsset, MediaKind } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui/state-views';

const MAX_BYTES = { image: 10 * 1024 * 1024, video: 50 * 1024 * 1024 };

/** Photos and videos for ads, offers and the hero (bucket `site-media`). */
@Component({
  selector: 'cx-admin-media-page',
  imports: [DatePipe, EmptyState, ErrorState, Skeleton],
  template: `
    <header class="head">
      <div>
        <h1>Medios</h1>
        <p class="muted">Imágenes hasta 10 MB · videos hasta 50 MB (mp4/webm).</p>
      </div>
    </header>

    <label
      class="drop card"
      [class.over]="dragging()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="$event.preventDefault(); dragging.set(false); uploadAll($event.dataTransfer?.files)"
    >
      <input
        type="file"
        class="visually-hidden"
        accept="image/*,video/mp4,video/webm"
        multiple
        (change)="uploadAll($any($event.target).files); $any($event.target).value = ''"
      />
      <strong>{{
        uploading() ? 'Subiendo ' + uploading() + '…' : 'Arrastra archivos aquí'
      }}</strong>
      <span class="muted">o haz clic para elegir fotos y videos</span>
    </label>

    <div class="chips" role="group" aria-label="Filtrar por tipo">
      @for (f of filters; track f.label) {
        <button
          type="button"
          class="chip"
          [class.active]="filter() === f.value"
          [attr.aria-pressed]="filter() === f.value"
          (click)="filter.set(f.value)"
        >
          {{ f.label }}
        </button>
      }
    </div>

    @if (media.error()) {
      <cx-error-state [error]="media.error()" (retry)="media.reload()" />
    } @else if (!media.hasValue()) {
      <cx-skeleton height="240px" radius="20px" />
    } @else {
      <ul class="grid">
        @for (m of visible(); track m.id) {
          <li class="card tile">
            @if (m.kind === 'video') {
              <video [src]="m.url" muted controls preload="metadata"></video>
            } @else {
              <img [src]="m.url" [alt]="m.name" loading="lazy" />
            }
            <div class="meta">
              <strong [title]="m.name">{{ m.name }}</strong>
              <small class="muted">
                {{ m.kind === 'video' ? 'Video' : 'Imagen' }} · {{ size(m.sizeBytes) }} ·
                {{ m.createdAt | date: 'mediumDate' }}
              </small>
              <div class="actions">
                <button type="button" class="link-btn" (click)="copy(m)">Copiar URL</button>
                <button type="button" class="link-btn danger" (click)="remove(m)">Eliminar</button>
              </div>
            </div>
          </li>
        } @empty {
          <cx-empty-state icon="🖼" title="Sin archivos" message="Sube tu primera foto o video." />
        }
      </ul>
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
  styles: `
    .drop {
      display: grid;
      justify-items: center;
      gap: 4px;
      padding: 32px 16px;
      border: 2px dashed var(--cx-border);
      text-align: center;
      cursor: pointer;
    }
    .drop.over,
    .drop:hover {
      border-color: var(--cx-primary);
    }
    .drop:has(input:focus-visible) {
      outline: 3px solid var(--cx-primary);
      outline-offset: 2px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .tile {
      overflow: hidden;
    }
    .tile img,
    .tile video {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      background: var(--cx-surface-alt);
    }
    .meta {
      display: grid;
      gap: 4px;
      padding: 10px 12px 12px;
    }
    .meta strong {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .actions {
      display: flex;
      justify-content: space-between;
    }
  `,
})
export class MediaPage {
  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);

  protected readonly media = resource({ loader: () => this.cms.media() });
  protected readonly filter = signal<MediaKind | null>(null);
  protected readonly dragging = signal(false);
  /** Name of the file being uploaded, or '' when idle. */
  protected readonly uploading = signal('');

  protected readonly filters: { value: MediaKind | null; label: string }[] = [
    { value: null, label: 'Todos' },
    { value: 'image', label: 'Imágenes' },
    { value: 'video', label: 'Videos' },
  ];
  protected readonly visible = computed(() => {
    const kind = this.filter();
    const all = valueOr(this.media, []);
    return kind ? all.filter((m) => m.kind === kind) : all;
  });

  /** Uploads one by one so each failure is reported with its file name. */
  protected async uploadAll(files: FileList | null | undefined): Promise<void> {
    const list = Array.from(files ?? []);
    let done = 0;
    for (const file of list) {
      const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image';
      if (file.size > MAX_BYTES[kind]) {
        this.toast.show(`${file.name}: el archivo es demasiado grande.`, 'error');
        continue;
      }
      this.uploading.set(file.name);
      try {
        await this.cms.uploadMedia(file, file.name);
        done++;
      } catch (e) {
        this.toast.error(e, `${file.name}: no se pudo subir.`);
      }
    }
    this.uploading.set('');
    if (done) {
      this.toast.success(done === 1 ? 'Archivo subido.' : `${done} archivos subidos.`);
      this.media.reload();
    }
  }

  protected async copy(asset: MediaAsset): Promise<void> {
    try {
      await navigator.clipboard.writeText(asset.url);
      this.toast.success('URL copiada.');
    } catch {
      this.toast.show(asset.url);
    }
  }

  protected async remove(asset: MediaAsset): Promise<void> {
    if (!confirm(`¿Eliminar ${asset.name}? Los anuncios que lo usen se quedarán sin imagen.`)) {
      return;
    }
    try {
      await this.cms.deleteMedia(asset.id);
      this.toast.success('Archivo eliminado.');
      this.media.reload();
    } catch (e) {
      this.toast.error(e);
    }
  }

  protected size(bytes: number): string {
    if (!bytes) return '—';
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;
  }
}
