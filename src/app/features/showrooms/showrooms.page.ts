import { Component, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { DealerLocation } from '../../domain/models';
import { CATALOG_REPOSITORY } from '../../domain/repositories';
import { ChatInboxStore } from '../chat/chat-inbox.store';

@Component({
  selector: 'cx-showrooms-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1>Nuestras sucursales</h1>
      <p>Cada auto se inspecciona y se entrega en una sucursal Carmexio.</p>
      <div class="grid">
        @for (l of locations.value() ?? []; track l.id) {
          <article class="card">
            <img [src]="l.imageUrl" alt="" loading="lazy" />
            <div class="body">
              <h2>{{ l.name }}</h2>
              <p>{{ l.address }}</p>
              <p>{{ l.hours }} · {{ l.phone }}</p>
              <div class="actions">
                <button class="btn primary" type="button" (click)="chat(l)">Chatear</button>
                <a
                  class="btn whatsapp"
                  [href]="'https://wa.me/' + l.whatsapp"
                  target="_blank"
                  rel="noopener"
                  >WhatsApp</a
                >
                <a class="btn outline" [href]="mapsUrl(l)" target="_blank" rel="noopener"
                  >Cómo llegar</a
                >
                <a class="btn outline" routerLink="/autos" [queryParams]="{ city: l.city }"
                  >Ver inventario</a
                >
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 12px;
      padding-block: 32px;
    }
    h1 {
      font-size: clamp(1.8rem, 3vw, 2.4rem);
    }
    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      margin-top: 12px;
    }
    article {
      overflow: hidden;
    }
    img {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }
    .body {
      display: grid;
      gap: 8px;
      padding: 18px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
  `,
})
export class ShowroomsPage {
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly session = inject(SessionStore);
  private readonly inbox = inject(ChatInboxStore);
  private readonly router = inject(Router);

  protected readonly locations = resource({ loader: () => this.catalog.locations() });

  constructor() {
    inject(SeoService).set({
      title: 'Sucursales',
      description: 'Sucursales Carmexio en CDMX, Guadalajara, Querétaro y Tijuana.',
    });
  }

  protected mapsUrl(l: DealerLocation): string {
    const query = l.latitude != null ? `${l.latitude},${l.longitude}` : `${l.name} ${l.address}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  protected async chat(l: DealerLocation): Promise<void> {
    if (!this.session.isSignedIn()) {
      await this.router.navigate(['/entrar'], { queryParams: { from: '/sucursales' } });
      return;
    }
    const id = await this.inbox.start({ locationId: l.id });
    await this.router.navigate(['/mensajes', id]);
  }
}
