import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { idFromSlug } from '../../core/utils/format';
import {
  CarPanel,
  DEFECT_CODES,
  DefectCode,
  InspectionCategory,
  categoryScore,
} from '../../domain/models';
import { CATALOG_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';
import { BodyDiagram, PANEL_LAYOUT, SEVERITY_COLOR } from '../../shared/ui/body-diagram';
import { EmptyState, ScoreRing, Skeleton } from '../../shared/ui/state-views';
import { optional } from '../../core/utils/resource';

@Component({
  selector: 'cx-inspection-page',
  imports: [RouterLink, DatePipe, BodyDiagram, EmptyState, ScoreRing, Skeleton],
  templateUrl: './inspection.page.html',
  styleUrl: './inspection.page.scss',
})
export class InspectionPage {
  readonly slug = input.required<string>();

  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);

  protected readonly report = resource({
    id: 'inspection:report',
    params: () => idFromSlug(this.slug()),
    loader: ({ params }) => this.listings.inspection(params),
  });
  protected readonly locations = resource({
    id: 'inspection:locations',
    loader: () => optional(this.catalog.locations(), []),
  });

  protected readonly showMinor = signal(true);
  protected readonly issuesOnly = signal(false);
  protected readonly selected = signal<CarPanel | null>(null);

  protected readonly branch = computed(() =>
    this.locations.value()?.find((l) => l.id === this.report.value()?.locationId),
  );
  protected readonly branchSuffix = computed(() => {
    const name = this.branch()?.name;
    return name ? ` · ${name}` : '';
  });
  protected readonly selectedDefects = computed(() => {
    const panel = this.selected();
    return panel ? (this.report.value()?.bodyDefects ?? []).filter((d) => d.panel === panel) : [];
  });
  protected readonly categories = computed(() =>
    (this.report.value()?.categories ?? [])
      .map((c) => ({
        ...c,
        score: categoryScore(c),
        items: this.issuesOnly() ? c.items.filter((i) => i.status !== 'ok') : c.items,
      }))
      .filter((c) => !this.issuesOnly() || c.items.length),
  );

  protected readonly legend = (Object.keys(DEFECT_CODES) as DefectCode[]).map((code) => ({
    code,
    ...DEFECT_CODES[code],
    color: SEVERITY_COLOR[DEFECT_CODES[code].severity],
  }));
  protected readonly panelLabel = (p: CarPanel) => PANEL_LAYOUT[p].label;
  protected readonly codeLabel = (c: DefectCode) => DEFECT_CODES[c].label;
  protected readonly statusIcon = { ok: '✓', attention: '!', fail: '✕' } as const;

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@inspection.reporte-de-inspeccion:Reporte de inspección`,
      description: $localize`:@@inspection.inspeccion-carmexio-de-150-puntos:Inspección Carmexio de 150 puntos: carrocería, motor, suspensión, interiores y documentos.`,
    });
  }

  protected barColor(category: InspectionCategory & { score: number }): string {
    return category.score >= 85
      ? 'var(--cx-success)'
      : category.score >= 65
        ? 'var(--cx-warning)'
        : 'var(--cx-error)';
  }
}
