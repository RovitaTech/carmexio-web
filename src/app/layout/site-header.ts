import {
  Component,
  ElementRef,
  computed,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { SessionStore } from '../core/auth/session.store';
import { ChatInboxStore } from '../core/state/chat-inbox.store';
import { ThemeMode, ThemeService } from '../core/theme/theme.service';
import { scrolledPast } from '../core/ui/scroll';
import { compactPrice } from '../core/utils/format';
import { optional } from '../core/utils/resource';
import { BODY_LABELS, BodyType } from '../domain/models';
import { CATALOG_REPOSITORY } from '../domain/repositories';
import { BrandLogo } from '../shared/ui/brand-logo';
import { Icon } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';
import { LangSwitch } from './lang-switch';

/** Does any route in the active branch ask for the transparent hero header? */
function wantsOverlay(route: ActivatedRouteSnapshot | null): boolean {
  for (let r = route; r; r = r.firstChild) if (r.data['overlayHeader']) return true;
  return false;
}

@Component({
  selector: 'cx-site-header',
  imports: [RouterLink, RouterLinkActive, BrandLogo, Icon, Logo, LangSwitch],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  host: {
    '(document:keydown.escape)': 'closeMenus()',
    '(document:click)': 'outsideClick($event)',
  },
})
export class SiteHeader {
  protected readonly session = inject(SessionStore);
  protected readonly inbox = inject(ChatInboxStore);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly drawer = viewChild<ElementRef<HTMLDialogElement>>('drawer');

  protected readonly scrolled = scrolledPast(24);
  protected readonly buyOpen = signal(false);
  private readonly overlayRoute = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => wantsOverlay(this.router.routerState.snapshot.root)),
    ),
    { initialValue: wantsOverlay(this.router.routerState.snapshot.root) },
  );
  /** Transparent over the hero; solid once scrolled or a menu is open. */
  protected readonly overlay = computed(
    () => this.overlayRoute() && !this.scrolled() && !this.buyOpen(),
  );

  /** Brands load the first time the mega menu opens. */
  private readonly menuUsed = signal(false);
  protected readonly brands = resource({
    params: () => (this.menuUsed() ? true : undefined),
    loader: () => optional(this.catalog.brands(), []),
  });
  protected readonly topBrands = computed(() =>
    (this.brands.hasValue() ? this.brands.value() : [])
      .filter((b) => b.listingsCount > 0)
      .sort((a, b) => b.listingsCount - a.listingsCount)
      .slice(0, 8),
  );
  protected readonly bodies = (Object.keys(BODY_LABELS) as BodyType[]).map((value) => ({
    value,
    label: BODY_LABELS[value],
  }));
  protected readonly budgets = [250_000, 400_000, 600_000, 1_000_000].map((max) => ({
    max,
    label: $localize`:@@nav.budget.upTo:Hasta ${compactPrice(max)}:amount:`,
  }));
  protected readonly themeModes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: $localize`:@@theme.system:Sistema` },
    { value: 'light', label: $localize`:@@theme.light:Claro` },
    { value: 'dark', label: $localize`:@@theme.dark:Oscuro` },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenus());
  }

  protected toggleBuy(): void {
    this.menuUsed.set(true);
    this.buyOpen.update((open) => !open);
  }

  protected openDrawer(): void {
    this.menuUsed.set(true);
    const dialog = this.drawer()?.nativeElement;
    if (typeof dialog?.showModal === 'function') dialog.showModal();
    else dialog?.setAttribute('open', '');
  }

  protected closeDrawer(): void {
    const dialog = this.drawer()?.nativeElement;
    if (typeof dialog?.close === 'function') dialog.close();
    else dialog?.removeAttribute('open');
  }

  protected closeMenus(): void {
    this.buyOpen.set(false);
    if (this.drawer()?.nativeElement.hasAttribute('open')) this.closeDrawer();
  }

  protected outsideClick(event: MouseEvent): void {
    const menu = this.host.nativeElement.querySelector('.buy');
    if (this.buyOpen() && menu && !menu.contains(event.target as Node)) this.buyOpen.set(false);
  }

  protected setTheme(mode: string): void {
    this.theme.apply(mode as ThemeMode);
  }
}
