import { Component, computed, effect, inject, input, resource, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/auth/session.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import { CarPanel, CheckStatus, DEFECT_CODES, DefectCode } from '../../../domain/models';
import { LISTING_REPOSITORY } from '../../../domain/repositories';
import { BodyDiagram, PANEL_LAYOUT } from '../../../shared/ui/body-diagram';
import { ErrorState, ScoreRing, Skeleton } from '../../../shared/ui/state-views';
import { InspectionEditorStore } from './inspection-editor.store';

/** Checklist (ok / attention / fail + note) and tap-on-diagram defects for one car. */
@Component({
  selector: 'cx-inspection-editor-page',
  imports: [RouterLink, BodyDiagram, ErrorState, ScoreRing, Skeleton],
  providers: [InspectionEditorStore],
  templateUrl: './inspection-editor.page.html',
  styleUrl: './inspection-editor.page.scss',
})
export class InspectionEditorPage {
  /** Route param `/staff/inspecciones/:id` (listing id). */
  readonly id = input.required<string>();

  protected readonly store = inject(InspectionEditorStore);
  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastStore);

  /** Car and its report (null when none yet) load together. */
  protected readonly source = resource({
    params: () => this.id(),
    loader: async ({ params }) => {
      const [car, report] = await Promise.all([
        this.listings.byId(params),
        this.listings.inspection(params),
      ]);
      return { car, report };
    },
  });
  protected readonly car = computed(() => valueOr(this.source, undefined)?.car);

  protected readonly statuses: { value: CheckStatus; label: string; icon: string }[] = [
    { value: 'ok', label: 'Bien', icon: '✓' },
    { value: 'attention', label: 'Atención', icon: '!' },
    { value: 'fail', label: 'Falla', icon: '✕' },
  ];
  protected readonly codes = (Object.keys(DEFECT_CODES) as DefectCode[]).map((code) => ({
    code,
    label: DEFECT_CODES[code].label,
  }));
  protected readonly panelLabel = (panel: CarPanel) => PANEL_LAYOUT[panel].label;

  constructor() {
    // (Re)initialise the form whenever a different car's data arrives.
    effect(() => {
      const data = valueOr(this.source, undefined);
      if (!data) return;
      untracked(() =>
        this.store.load(
          data.car.id,
          data.car.locationId,
          data.report,
          this.session.user()?.fullName ?? 'Carmexio',
        ),
      );
    });
  }

  protected addDefect(code: string, note: HTMLInputElement): void {
    if (!code) return;
    this.store.addDefect(code as DefectCode, note.value);
    note.value = '';
  }

  protected scoreInput(value: string): void {
    this.store.setScore(value === '' ? null : Number(value));
  }

  protected async save(): Promise<void> {
    try {
      await this.store.save();
      this.toast.success('Reporte guardado. La calificación ya aparece en el anuncio.');
    } catch (e) {
      this.toast.error(e, 'No pudimos guardar el reporte.');
    }
  }
}
