import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ContentStore } from '../../core/state/content.store';
import { compactPrice } from '../../core/utils/format';
import { webLink } from '../../core/utils/links';
import { SiteTextKey } from '../../domain/content';
import { BODY_LABELS, BodyType } from '../../domain/models';
import { Icon } from '../../shared/ui/icon';

const AUTOPLAY_MS = 7000;

/**
 * Full-bleed hero: admin-managed slides (image or video) behind the headline,
 * a glass search card and the trust stats. Autoplay pauses on hover/focus,
 * when the tab is hidden, with reduced motion, and via the pause button
 * (WCAG 2.2.2).
 */
@Component({
  selector: 'cx-home-hero',
  imports: [RouterLink, NgOptimizedImage, Icon],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.scss',
  host: {
    '(mouseenter)': 'hovering.set(true)',
    '(mouseleave)': 'hovering.set(false)',
    '(focusin)': 'hovering.set(true)',
    '(focusout)': 'hovering.set(false)',
  },
})
export class HomeHero {
  protected readonly content = inject(ContentStore);
  private readonly router = inject(Router);

  protected readonly slides = computed(() => this.content.ads('home_hero'));
  protected readonly index = signal(0);
  protected readonly active = computed(
    () => this.slides()[this.index() % (this.slides().length || 1)],
  );
  protected readonly link = computed(() => webLink(this.active()?.link));

  protected readonly paused = signal(false);
  protected readonly hovering = signal(false);

  protected readonly bodies = (Object.keys(BODY_LABELS) as BodyType[]).map((value) => ({
    value,
    label: BODY_LABELS[value],
  }));
  protected readonly budgets = [250_000, 400_000, 600_000, 1_000_000, 2_000_000].map((max) => ({
    max,
    label: compactPrice(max),
  }));
  protected readonly stats = [
    { value: 'home.stats.1.value', label: 'home.stats.1.label' },
    { value: 'home.stats.2.value', label: 'home.stats.2.label' },
    { value: 'home.stats.3.value', label: 'home.stats.3.label' },
  ] as const satisfies readonly { value: SiteTextKey; label: SiteTextKey }[];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) this.paused.set(true);
      const timer = setInterval(() => {
        if (!this.paused() && !this.hovering() && !document.hidden) this.go(1);
      }, AUTOPLAY_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  protected go(step: number): void {
    const count = this.slides().length;
    if (count > 1) this.index.update((i) => (i + step + count) % count);
  }

  protected counter(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected search(query: string, body: string, maxPrice: string): void {
    const params: Record<string, string> = {};
    if (query.trim()) params['q'] = query.trim();
    if (body) params['body'] = body;
    if (maxPrice) params['maxPrice'] = maxPrice;
    void this.router.navigate(['/autos'], { queryParams: params });
  }
}
