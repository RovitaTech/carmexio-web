import { Component, computed, input } from '@angular/core';

/** Bundled marks in `public/brands` (Simple Icons, see its README) + brand colour. */
const LOGOS: Record<string, { file: string; hex: string }> = {
  toyota: { file: 'toyota', hex: '#EB0A1E' },
  nissan: { file: 'nissan', hex: '#C3002F' },
  chevrolet: { file: 'chevrolet', hex: '#CD9834' },
  ford: { file: 'ford', hex: '#00274E' },
  volkswagen: { file: 'volkswagen', hex: '#151F5D' },
  ram: { file: 'ram', hex: '#000000' },
  mazda: { file: 'mazda', hex: '#101010' },
  honda: { file: 'honda', hex: '#E40521' },
  kia: { file: 'kia', hex: '#05141F' },
  hyundai: { file: 'hyundai', hex: '#002C5E' },
  jeep: { file: 'jeep', hex: '#000000' },
  bmw: { file: 'bmw', hex: '#0066B1' },
  audi: { file: 'audi', hex: '#BB0A30' },
  porsche: { file: 'porsche', hex: '#B12B28' },
};

/** Brand accent for hover glows; `undefined` for makes without a bundled mark. */
export function brandColor(name: string): string | undefined {
  return LOGOS[name.toLowerCase().replace(/[^a-z]/g, '')]?.hex;
}

/** Relative luminance (WCAG) of a #RRGGBB colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A car make's logo: the admin-set `logoUrl` (brands.logo_url) wins, then the
 * bundled mark, then a monogram. Decorative — the brand name is always shown
 * next to it.
 */
@Component({
  selector: 'cx-brand-logo',
  template: `
    @if (logoUrl()) {
      <img [src]="logoUrl()" alt="" [width]="size()" [height]="size()" loading="lazy" />
    } @else if (bundled(); as b) {
      <span
        class="mark"
        [style.mask-image]="'url(/brands/' + b.file + '.svg)'"
        [style.--brand]="b.hover"
      ></span>
    } @else {
      <span class="mono">{{ initials() }}</span>
    }
  `,
  host: { 'aria-hidden': 'true', '[style.--size.px]': 'size()' },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: var(--size);
      height: var(--size);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .mark {
      width: 100%;
      height: 100%;
      background-color: var(--cx-text);
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      transition: background-color 0.2s ease;
    }
    :host-context(a:hover) .mark,
    :host-context(a:focus-visible) .mark {
      background-color: var(--brand);
    }
    .mono {
      font-weight: 800;
      font-size: calc(var(--size) * 0.36);
    }
  `,
})
export class BrandLogo {
  readonly name = input.required<string>();
  readonly logoUrl = input<string | undefined>(undefined);
  readonly size = input(32);

  protected readonly bundled = computed(() => {
    const logo =
      LOGOS[
        this.name()
          .toLowerCase()
          .replace(/[^a-z]/g, '')
      ];
    if (!logo) return null;
    // Near-black brand colours would vanish in dark mode: keep the text colour.
    return { file: logo.file, hover: luminance(logo.hex) > 0.03 ? logo.hex : 'var(--cx-text)' };
  });
  protected readonly initials = computed(() => this.name().slice(0, 2).toUpperCase());
}
