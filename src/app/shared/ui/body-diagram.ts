import { Component, computed, input, output } from '@angular/core';
import { BodyDefect, CarPanel, DEFECT_CODES, DefectSeverity } from '../../domain/models';

/** Panel layout on a 320×420 canvas — same as the Flutter `BodyDiagram`. */
export const PANEL_LAYOUT: Record<
  CarPanel,
  { x: number; y: number; w: number; h: number; label: string }
> = {
  front_bumper: {
    x: 100,
    y: 0,
    w: 120,
    h: 26,
    label: $localize`:@@panel.front_bumper:Defensa delantera`,
  },
  hood: { x: 95, y: 32, w: 130, h: 88, label: $localize`:@@panel.hood:Cofre` },
  roof: { x: 105, y: 170, w: 110, h: 104, label: $localize`:@@panel.roof:Toldo` },
  trunk: { x: 100, y: 322, w: 120, h: 62, label: $localize`:@@panel.trunk:Cajuela` },
  rear_bumper: {
    x: 100,
    y: 392,
    w: 120,
    h: 26,
    label: $localize`:@@panel.rear_bumper:Defensa trasera`,
  },
  front_left_fender: {
    x: 22,
    y: 36,
    w: 60,
    h: 84,
    label: $localize`:@@panel.front_left_fender:Salpicadera del. izq.`,
  },
  front_left_door: {
    x: 22,
    y: 126,
    w: 60,
    h: 92,
    label: $localize`:@@panel.front_left_door:Puerta del. izq.`,
  },
  rear_left_door: {
    x: 22,
    y: 224,
    w: 60,
    h: 88,
    label: $localize`:@@panel.rear_left_door:Puerta tras. izq.`,
  },
  rear_left_quarter: {
    x: 22,
    y: 318,
    w: 60,
    h: 84,
    label: $localize`:@@panel.rear_left_quarter:Costado tras. izq.`,
  },
  left_rocker: { x: 4, y: 126, w: 12, h: 186, label: $localize`:@@panel.left_rocker:Estribo izq.` },
  front_right_fender: {
    x: 238,
    y: 36,
    w: 60,
    h: 84,
    label: $localize`:@@panel.front_right_fender:Salpicadera del. der.`,
  },
  front_right_door: {
    x: 238,
    y: 126,
    w: 60,
    h: 92,
    label: $localize`:@@panel.front_right_door:Puerta del. der.`,
  },
  rear_right_door: {
    x: 238,
    y: 224,
    w: 60,
    h: 88,
    label: $localize`:@@panel.rear_right_door:Puerta tras. der.`,
  },
  rear_right_quarter: {
    x: 238,
    y: 318,
    w: 60,
    h: 84,
    label: $localize`:@@panel.rear_right_quarter:Costado tras. der.`,
  },
  right_rocker: {
    x: 304,
    y: 126,
    w: 12,
    h: 186,
    label: $localize`:@@panel.right_rocker:Estribo der.`,
  },
};

export const SEVERITY_COLOR: Record<DefectSeverity, string> = {
  minor: 'var(--cx-gold)',
  moderate: 'var(--cx-warning)',
  major: 'var(--cx-error)',
};

const ORDER: DefectSeverity[] = ['minor', 'moderate', 'major'];

/** Exploded top-down car body with defect codes; panels are buttons. */
@Component({
  selector: 'cx-body-diagram',
  template: `
    <svg
      viewBox="-4 -4 328 428"
      role="group"
      i18n-aria-label="@@diagram.label"
      aria-label="Diagrama de carrocería"
    >
      <rect x="102" y="126" width="116" height="38" rx="10" class="glass" />
      <rect x="106" y="280" width="108" height="36" rx="10" class="glass" />
      @for (p of panels(); track p.id) {
        <g
          class="panel"
          tabindex="0"
          role="button"
          [attr.aria-label]="p.label + (p.codes.length ? ': ' + p.codes.join(', ') : ': sin daños')"
          (click)="panelSelected.emit(p.id)"
          (keydown.enter)="panelSelected.emit(p.id)"
        >
          <rect
            [attr.x]="p.x"
            [attr.y]="p.y"
            [attr.width]="p.w"
            [attr.height]="p.h"
            [attr.rx]="p.w < 20 ? 4 : 14"
            [style.fill]="p.fill"
          />
          @for (code of p.codes; track $index) {
            <text
              [attr.x]="p.x + p.w / 2"
              [attr.y]="p.y + p.h / 2 + 5 + ($index - (p.codes.length - 1) / 2) * 15"
              text-anchor="middle"
              [attr.font-size]="p.w < 20 ? 9 : 13"
              [style.fill]="p.colors[$index]"
            >
              {{ code }}
            </text>
          }
        </g>
      }
      @for (c of wheels; track $index) {
        <circle [attr.cx]="c[0]" [attr.cy]="c[1]" r="8" class="wheel" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      max-width: 360px;
      margin-inline: auto;
    }
    svg {
      width: 100%;
      height: auto;
    }
    .glass {
      fill: color-mix(in srgb, var(--cx-primary) 12%, transparent);
      stroke: var(--cx-text-2);
      stroke-width: 1.4;
    }
    .panel rect {
      stroke: var(--cx-text-2);
      stroke-width: 1.4;
      cursor: pointer;
      transition: filter 0.15s;
    }
    .panel:hover rect,
    .panel:focus-visible rect {
      filter: brightness(0.95);
      stroke: var(--cx-primary);
      stroke-width: 2.4;
    }
    .panel:focus {
      outline: none;
    }
    text {
      font-weight: 800;
      pointer-events: none;
    }
    .wheel {
      fill: none;
      stroke: var(--cx-text-3);
      stroke-width: 1.4;
    }
  `,
})
export class BodyDiagram {
  readonly defects = input<BodyDefect[]>([]);
  readonly showMinor = input(true);
  readonly panelSelected = output<CarPanel>();

  protected readonly wheels = [
    [52, 22],
    [268, 22],
    [52, 412],
    [268, 412],
  ];

  protected readonly panels = computed(() => {
    const visible = this.defects().filter(
      (d) => this.showMinor() || DEFECT_CODES[d.code].severity !== 'minor',
    );
    return (Object.keys(PANEL_LAYOUT) as CarPanel[]).map((id) => {
      const onPanel = visible.filter((d) => d.panel === id);
      const severities = onPanel.map((d) => DEFECT_CODES[d.code].severity);
      const worst = severities.sort((a, b) => ORDER.indexOf(b) - ORDER.indexOf(a))[0];
      return {
        id,
        ...PANEL_LAYOUT[id],
        codes: onPanel.map((d) => d.code),
        colors: onPanel.map((d) => SEVERITY_COLOR[DEFECT_CODES[d.code].severity]),
        fill: worst
          ? `color-mix(in srgb, ${SEVERITY_COLOR[worst]} 22%, var(--cx-surface))`
          : 'var(--cx-surface)',
      };
    });
  });
}
