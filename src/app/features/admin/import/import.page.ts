import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastStore } from '../../../core/ui/toast.store';
import { carSlug } from '../../../core/utils/format';
import {
  AppError,
  BODY_LABELS,
  DealerLocation,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from '../../../domain/models';
import { CATALOG_REPOSITORY, STOCK_IMPORT_REPOSITORY } from '../../../domain/repositories';
import { STOCK_IMPORT_BATCH, StockImportOutcome, StockItem } from '../../../domain/stock-import';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { ImportRow, StockDraft, draftProblems, readCatalog, toStockItem } from './catalog-rows';
import { parseDelimited } from './delimited';
import { ImportTable, DraftEdit } from './import-table';
import { TEMPLATE_CSV } from './template';

type FillField = 'locationId' | 'fuelType' | 'transmission' | 'bodyType';

/**
 * /admin/importar — Carmexio stock from the WhatsApp Business catalog: read the file in
 * the browser, fix what's missing in the preview, then publish in batches through
 * carmexio-BE (which copies the photos and saves the cars).
 */
@Component({
  selector: 'cx-admin-import-page',
  imports: [ImportTable, ErrorState, Skeleton, RouterLink],
  templateUrl: './import.page.html',
  styleUrls: ['../ui/admin-page.scss', './import.page.scss'],
})
export class ImportPage {
  private readonly catalogRepo = inject(CATALOG_REPOSITORY);
  private readonly importer = inject(STOCK_IMPORT_REPOSITORY);
  private readonly toast = inject(ToastStore);

  protected readonly maxYear = new Date().getFullYear() + 1;
  protected readonly templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;
  protected readonly catalog = resource({
    loader: async () => {
      const [brands, locations] = await Promise.all([
        this.catalogRepo.brands(),
        this.catalogRepo.locations(),
      ]);
      return { brands, locations };
    },
  });

  protected readonly pasted = signal('');
  protected readonly dragging = signal(false);
  protected readonly reading = signal(false);
  protected readonly fileName = signal<string | null>(null);
  protected readonly rows = signal<ImportRow[]>([]);
  protected readonly ignoredColumns = signal<string[]>([]);
  protected readonly onlyProblems = signal(false);
  protected readonly results = signal<Record<number, StockImportOutcome>>({});
  protected readonly progress = signal<{ done: number; total: number } | null>(null);

  protected readonly locations = computed<DealerLocation[]>(() =>
    this.catalog.hasValue() ? this.catalog.value().locations : [],
  );
  private readonly problems = computed(() =>
    this.rows().map((r) => ({ row: r, missing: draftProblems(r.draft, this.maxYear) })),
  );
  protected readonly blockedCount = computed(
    () => this.problems().filter((p) => p.missing.length).length,
  );
  /** Complete, not yet imported, last row wins for a repeated catalog id. */
  protected readonly ready = computed(() => {
    const byId = new Map<string, { line: number; item: StockItem }>();
    for (const row of this.rows()) {
      const item = toStockItem(row.draft, this.maxYear);
      const done = this.results()[row.line]?.status;
      if (item && done !== 'created' && done !== 'updated')
        byId.set(item.externalId, { line: row.line, item });
    }
    return [...byId.values()];
  });
  protected readonly visibleRows = computed(() =>
    this.onlyProblems()
      ? this.problems()
          .filter((p) => p.missing.length || this.results()[p.row.line]?.status === 'failed')
          .map((p) => p.row)
      : this.rows(),
  );
  protected readonly summary = computed(() => {
    const all = Object.values(this.results());
    return {
      created: all.filter((r) => r.status === 'created').length,
      updated: all.filter((r) => r.status === 'updated').length,
      failed: all.filter((r) => r.status === 'failed').length,
    };
  });
  protected readonly published = computed(() =>
    this.rows()
      .map((r) => ({ row: r, result: this.results()[r.line] }))
      .filter((x) => x.result?.listingId && x.result.status !== 'failed'),
  );

  /** Bulk fill for the enum columns (branch has its own select, fed by the catalog). */
  protected readonly fills: {
    field: FillField;
    label: string;
    options: { value: string; label: string }[];
  }[] = [
    { field: 'fuelType', label: 'Combustible', options: opts(FUEL_LABELS) },
    { field: 'transmission', label: 'Transmisión', options: opts(TRANSMISSION_LABELS) },
    { field: 'bodyType', label: 'Carrocería', options: opts(BODY_LABELS) },
  ];

  protected async readFile(files: FileList | null | undefined): Promise<void> {
    const file = files?.[0];
    if (!file) return;
    this.reading.set(true);
    try {
      const table = /\.xlsx$/i.test(file.name)
        ? await (await import('./xlsx')).readXlsx(await file.arrayBuffer())
        : parseDelimited(await file.text());
      this.load(table, file.name);
    } catch (e) {
      this.toast.error(e, 'No pudimos leer el archivo. Guárdalo como CSV o Excel (.xlsx).');
    } finally {
      this.reading.set(false);
    }
  }

  protected readPasted(): void {
    this.load(parseDelimited(this.pasted()), 'Texto pegado');
  }

  private load(table: string[][], name: string): void {
    if (!this.catalog.hasValue()) return;
    if (table.length < 2) {
      this.toast.error(
        new AppError('El archivo no tiene filas de autos (¿falta el encabezado?).', 'validation'),
      );
      return;
    }
    const parsed = readCatalog(table, { ...this.catalog.value(), maxYear: this.maxYear });
    this.rows.set(parsed.rows);
    this.ignoredColumns.set(parsed.columns.ignored);
    this.results.set({});
    this.fileName.set(name);
    this.onlyProblems.set(this.blockedCount() > 0);
  }

  protected edit({ line, patch }: DraftEdit): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.line === line ? { ...r, draft: { ...r.draft, ...patch } } : r)),
    );
  }

  /** Bulk fill one field on every row that doesn't have it yet. */
  protected fillMissing(field: FillField, value: string): void {
    if (!value) return;
    const patch = { [field]: value } as Partial<StockDraft>;
    this.rows.update((rows) =>
      rows.map((r) => (r.draft[field] ? r : { ...r, draft: { ...r.draft, ...patch } })),
    );
    this.toast.success('Listo: se completó en los autos que no lo tenían.');
  }

  protected reset(): void {
    this.rows.set([]);
    this.results.set({});
    this.fileName.set(null);
    this.pasted.set('');
  }

  protected async importReady(): Promise<void> {
    const queue = this.ready();
    if (!queue.length || this.progress()) return;
    this.progress.set({ done: 0, total: queue.length });
    try {
      for (let i = 0; i < queue.length; i += STOCK_IMPORT_BATCH) {
        const batch = queue.slice(i, i + STOCK_IMPORT_BATCH);
        let outcomes: StockImportOutcome[];
        try {
          outcomes = await this.importer.importBatch(batch.map((b) => b.item));
        } catch (e) {
          if (e instanceof AppError && e.kind === 'auth') throw e;
          const message = e instanceof AppError ? e.message : 'Error del servidor';
          outcomes = batch.map((b) => failure(b.item.externalId, message));
        }
        this.results.update((r) => ({
          ...r,
          ...Object.fromEntries(batch.map((b, j) => [b.line, outcomes[j]])),
        }));
        this.progress.set({ done: Math.min(i + batch.length, queue.length), total: queue.length });
      }
      const s = this.summary();
      // Show the outcome of every row, unless there are errors left to fix.
      this.onlyProblems.set(s.failed > 0);
      this.toast.success(
        `Importación lista: ${s.created} nuevos, ${s.updated} actualizados, ${s.failed} con error.`,
      );
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.progress.set(null);
    }
  }

  protected carLink(row: ImportRow, id: string): string {
    return `/autos/${carSlug({ id, brand: row.draft.brand, model: row.draft.model, year: row.draft.year ?? 0 })}`;
  }
}

const failure = (externalId: string, message: string): StockImportOutcome => ({
  externalId,
  status: 'failed',
  listingId: null,
  photos: { copied: 0, failed: 0, reused: 0 },
  error: { code: 'BATCH_FAILED', message },
});

const opts = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
