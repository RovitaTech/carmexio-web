import { Component, inject, resource } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../core/auth/session.store';
import { ThemeMode, ThemeService } from '../core/theme/theme.service';
import { CATALOG_REPOSITORY } from '../domain/repositories';
import { ChatInboxStore } from '../features/chat/chat-inbox.store';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'cx-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(SessionStore);
  protected readonly inbox = inject(ChatInboxStore);
  protected readonly theme = inject(ThemeService);
  private readonly catalog = inject(CATALOG_REPOSITORY);

  protected readonly locations = resource({ loader: () => this.catalog.locations() });
  protected readonly year = new Date().getFullYear();

  protected setTheme(mode: string): void {
    this.theme.apply(mode as ThemeMode);
  }
}
