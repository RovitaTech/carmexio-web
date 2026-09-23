import { Component, inject, resource } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../core/auth/session.store';
import { ThemeMode, ThemeService } from '../core/theme/theme.service';
import { CATALOG_REPOSITORY } from '../domain/repositories';
import { ChatInboxStore } from '../core/state/chat-inbox.store';
import { Logo } from '../shared/ui/logo';
import { ToastOutlet } from '../shared/ui/toast-outlet';
import { RouteProgress } from './route-progress';
import { optional } from '../core/utils/resource';

@Component({
  selector: 'cx-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, RouteProgress, ToastOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(SessionStore);
  protected readonly inbox = inject(ChatInboxStore);
  protected readonly theme = inject(ThemeService);
  private readonly catalog = inject(CATALOG_REPOSITORY);

  protected readonly locations = resource({
    id: 'shell:locations',
    loader: () => optional(this.catalog.locations(), []),
  });
  protected readonly year = new Date().getFullYear();

  protected setTheme(mode: string): void {
    this.theme.apply(mode as ThemeMode);
  }
}
