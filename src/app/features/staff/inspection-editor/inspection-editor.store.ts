import { Injectable, computed, inject, signal } from '@angular/core';
import { newReport, suggestedScore } from '../../../domain/inspection-template';
import {
  BodyDefect,
  CarPanel,
  CheckStatus,
  DefectCode,
  InspectionCategory,
  InspectionReport,
  categoryScore,
} from '../../../domain/models';
import { STAFF_REPOSITORY } from '../../../domain/repositories';

/** Inspection editor ViewModel (provided per editor page). */
@Injectable()
export class InspectionEditorStore {
  private readonly staff = inject(STAFF_REPOSITORY);

  private readonly base = signal<InspectionReport | null>(null);
  readonly isNew = signal(true);
  readonly categories = signal<InspectionCategory[]>([]);
  readonly defects = signal<BodyDefect[]>([]);
  readonly summary = signal('');
  readonly inspectorName = signal('');
  /** Manual override; `null` follows the checklist suggestion. */
  readonly scoreOverride = signal<number | null>(null);
  readonly selectedPanel = signal<CarPanel | null>(null);
  readonly dirty = signal(false);
  readonly saving = signal(false);

  readonly loaded = computed(() => this.base() !== null);
  readonly suggested = computed(() => suggestedScore(this.categories()));
  readonly overallScore = computed(() => this.scoreOverride() ?? this.suggested());
  readonly categoryScores = computed(() => this.categories().map(categoryScore));
  readonly panelDefects = computed(() => {
    const panel = this.selectedPanel();
    return this.defects()
      .map((defect, index) => ({ defect, index }))
      .filter((d) => d.defect.panel === panel);
  });

  /** Starts from the saved report, or a blank checklist for this car's branch. */
  load(
    listingId: string,
    locationId: string,
    existing: InspectionReport | null,
    inspector: string,
  ) {
    const report = existing ?? newReport(listingId, locationId, inspector);
    this.base.set(report);
    this.isNew.set(!existing);
    this.categories.set(structuredClone(report.categories));
    this.defects.set(structuredClone(report.bodyDefects));
    this.summary.set(report.summary ?? '');
    this.inspectorName.set(report.inspectorName);
    this.scoreOverride.set(
      existing && existing.overallScore !== suggestedScore(existing.categories)
        ? existing.overallScore
        : null,
    );
    this.selectedPanel.set(null);
    this.dirty.set(false);
  }

  setStatus(category: number, item: number, status: CheckStatus): void {
    this.updateItem(category, item, { status });
  }

  setNote(category: number, item: number, note: string): void {
    this.updateItem(category, item, { note: note.trim() || undefined });
  }

  setScore(value: number | null): void {
    this.scoreOverride.set(value === null ? null : Math.min(10, Math.max(0, value)));
    this.dirty.set(true);
  }

  addDefect(code: DefectCode, note: string): void {
    const panel = this.selectedPanel();
    if (!panel) return;
    this.defects.update((list) => [...list, { panel, code, note: note.trim() || undefined }]);
    this.dirty.set(true);
  }

  removeDefect(index: number): void {
    this.defects.update((list) => list.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  edit(field: 'summary' | 'inspectorName', value: string): void {
    this[field].set(value);
    this.dirty.set(true);
  }

  /** Builds the report the DB stores; score rounded to one decimal (numeric(3,1)). */
  toReport(now = new Date().toISOString()): InspectionReport {
    const base = this.base();
    if (!base) throw new Error('InspectionEditorStore.load() was not called.');
    return {
      ...base,
      overallScore: Math.round(this.overallScore() * 10) / 10,
      summary: this.summary().trim() || undefined,
      inspectorName: this.inspectorName().trim() || base.inspectorName,
      inspectedAt: now,
      categories: this.categories(),
      bodyDefects: this.defects(),
    };
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const report = this.toReport();
      await this.staff.saveInspection(report);
      this.base.set(report);
      this.isNew.set(false);
      this.dirty.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  private updateItem(
    category: number,
    item: number,
    changes: Partial<InspectionCategory['items'][number]>,
  ): void {
    this.categories.update((list) =>
      list.map((c, ci) =>
        ci !== category
          ? c
          : { ...c, items: c.items.map((it, ii) => (ii === item ? { ...it, ...changes } : it)) },
      ),
    );
    this.dirty.set(true);
  }
}
