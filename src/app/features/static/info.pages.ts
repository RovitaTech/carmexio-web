import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { ChatInboxStore } from '../../core/state/chat-inbox.store';
import { SiteStore } from '../../core/state/site.store';
import { formatPrice } from '../../core/utils/format';
import { FinancingCalculator } from '../../shared/ui/financing-calculator';

const PAGE_STYLES = `
  .page { display: grid; gap: 16px; padding-block: 32px; }
  .lead { font-size: 1.1rem; color: var(--cx-text-2); max-width: 720px; }
  .cols { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start; }
  .block { display: grid; gap: 12px; padding: 24px; align-content: start; }
  ul, ol { display: grid; gap: 8px; margin: 0; padding-left: 20px; color: var(--cx-text-2); }
  .actions { display: flex; flex-wrap: wrap; gap: 10px; }
  a.link { color: var(--cx-primary-text); font-weight: 700; }
`;

/** Opens a chat with this site's branch (general enquiry), signing in first if needed. */
function useBranchChat() {
  const session = inject(SessionStore);
  const inbox = inject(ChatInboxStore);
  const router = inject(Router);
  const site = inject(SiteStore);
  const busy = signal(false);
  const open = async () => {
    if (!session.isSignedIn()) {
      await router.navigate(['/entrar'], { queryParams: { from: router.url } });
      return;
    }
    busy.set(true);
    try {
      await router.navigate(['/mensajes', await inbox.start({ locationId: site.site.branchId })]);
    } finally {
      busy.set(false);
    }
  };
  return { busy, open };
}

@Component({
  selector: 'cx-financing-page',
  imports: [RouterLink, FinancingCalculator],
  template: `
    <div class="container page">
      <h1 i18n="@@fin.title">Financiamiento</h1>
      <p class="lead" i18n="@@fin.lead">
        Estrena con un enganche y mensualidades. Calcula un estimado y te ayudamos con el trámite en
        la sucursal.
      </p>
      <div class="cols">
        <div class="card block">
          <label for="fin-price" i18n="@@fin.price">Precio del auto</label>
          <input
            id="fin-price"
            type="range"
            min="100000"
            max="2000000"
            step="10000"
            [value]="price()"
            (input)="price.set(+$any($event.target).value)"
          />
          <strong class="price">{{ money(price()) }}</strong>
          <cx-financing-calculator [price]="price()" (apply)="chat.open()" />
        </div>
        <section class="card block" aria-labelledby="fin-how">
          <h2 id="fin-how" i18n="@@fin.how">Cómo funciona</h2>
          <ol>
            <li i18n="@@fin.step1">Elige tu auto y calcula tu mensualidad.</li>
            <li i18n="@@fin.step2">Escríbenos: revisamos tu solicitud con la financiera.</li>
            <li i18n="@@fin.step3">Con la aprobación, firmas y recoges tu auto en Guanajuato.</li>
          </ol>
          <h2 i18n="@@fin.docs">Documentos habituales</h2>
          <ul>
            <li i18n="@@fin.doc1">Identificación oficial vigente (INE o pasaporte).</li>
            <li i18n="@@fin.doc2">Comprobante de domicilio reciente.</li>
            <li i18n="@@fin.doc3">Comprobantes de ingresos.</li>
          </ul>
          <p class="muted" i18n="@@fin.disclaimer">
            La mensualidad es una estimación. La tasa, el enganche y la aprobación dependen de la
            financiera y de tu perfil.
          </p>
          <div class="actions">
            <a class="btn primary" routerLink="/autos" i18n="@@nav.inventoryCta">Ver inventario</a>
            <a class="btn outline" routerLink="/contacto" i18n="@@nav.contact">Contacto</a>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    PAGE_STYLES,
    `
      input[type='range'] {
        width: 100%;
      }
      .price {
        font-size: 1.5rem;
      }
    `,
  ],
})
export class FinancingPage {
  protected readonly price = signal(450_000);
  protected readonly money = formatPrice;
  protected readonly chat = useBranchChat();

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@fin.title:Financiamiento`,
      description: $localize`:@@fin.seo:Calcula tu mensualidad y financia tu auto seminuevo con Carmexio Guanajuato.`,
    });
  }
}

@Component({
  selector: 'cx-about-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1 i18n="@@about.title">Nosotros</h1>
      <p class="lead" i18n="@@about.lead">
        Carmexio {{ region }} vende autos seminuevos revisados, con trato directo en la sucursal. Tú
        eliges, nosotros nos encargamos del resto.
      </p>
      <div class="cols">
        <section class="card block">
          <h2 i18n="@@about.verified">Autos verificados</h2>
          <p class="muted" i18n="@@about.verified.text">
            Cada auto pasa una inspección de 150 puntos y se publica con su reporte: sabes qué
            compras antes de venir.
          </p>
        </section>
        <section class="card block">
          <h2 i18n="@@about.pickup">Recoges en {{ region }}</h2>
          <p class="muted" i18n="@@about.pickup.text">
            Además de los autos en la sucursal, traemos autos de otras sucursales Carmexio para que
            los veas y los recojas aquí.
          </p>
        </section>
        <section class="card block">
          <h2 i18n="@@about.papers">Papeles en regla</h2>
          <p class="muted" i18n="@@about.papers.text">
            Revisamos contigo factura, tenencias y REPUVE, y te acompañamos en el pago o el
            financiamiento.
          </p>
        </section>
      </div>
      <div class="actions">
        <a class="btn primary" routerLink="/autos" i18n="@@nav.inventoryCta">Ver inventario</a>
        <a class="btn outline" routerLink="/contacto" i18n="@@nav.contact">Contacto</a>
      </div>
    </div>
  `,
  styles: PAGE_STYLES,
})
export class AboutPage {
  protected readonly region = inject(SiteStore).site.region;

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@about.title:Nosotros`,
      description: $localize`:@@about.seo:Carmexio Guanajuato: autos seminuevos verificados, con reporte de inspección y entrega en la sucursal.`,
    });
  }
}

@Component({
  selector: 'cx-contact-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1 i18n="@@contact.title">Contacto</h1>
      <p class="lead" i18n="@@contact.lead">
        Escríbenos o ven a la sucursal: te mostramos el auto y resolvemos tus dudas.
      </p>
      <div class="cols">
        <section class="card block">
          <h2>Carmexio {{ store.site.region }}</h2>
          @if (store.branch(); as b) {
            <p>{{ b.address }}</p>
          }
          <p>
            <strong i18n="@@contact.hours">Horario:</strong>
            <span i18n="@@site.hours">Lun – Sáb 10 a 19 hrs</span>
          </p>
          <p>
            <strong i18n="@@contact.phones">Teléfonos:</strong>
            @for (phone of store.site.phones; track phone; let last = $last) {
              <a class="link" [href]="store.tel(phone)">{{ phone }}</a
              >{{ last ? '' : ' · ' }}
            }
          </p>
          <div class="actions">
            <button
              class="btn primary"
              type="button"
              [disabled]="chat.busy()"
              (click)="chat.open()"
              i18n="@@contact.chat"
            >
              Chatear con Carmexio
            </button>
            <a class="btn whatsapp" [href]="store.whatsappUrl" target="_blank" rel="noopener"
              >WhatsApp</a
            >
            <a class="btn outline" [href]="store.tel(store.site.phones[0])" i18n="@@contact.call"
              >Llamar</a
            >
            @if (store.branch(); as b) {
              <a
                class="btn outline"
                [href]="mapsUrl(b.latitude, b.longitude)"
                target="_blank"
                rel="noopener"
                i18n="@@contact.directions"
                >Cómo llegar</a
              >
            }
          </div>
        </section>
        <section class="card block">
          <h2 i18n="@@contact.visit">Antes de venir</h2>
          <ul>
            <li i18n="@@contact.tip1">Dinos qué auto te interesa para tenerlo listo.</li>
            <li i18n="@@contact.tip2">
              Si el auto está en otra sucursal, lo traemos a Guanajuato: pregúntanos el tiempo.
            </li>
            <li i18n="@@contact.tip3">Trae tu licencia para la prueba de manejo.</li>
          </ul>
          <a class="link" routerLink="/ayuda" i18n="@@contact.faq">Ver preguntas frecuentes →</a>
        </section>
      </div>
    </div>
  `,
  styles: PAGE_STYLES,
})
export class ContactPage {
  protected readonly store = inject(SiteStore);
  protected readonly chat = useBranchChat();

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@contact.title:Contacto`,
      description: $localize`:@@contact.seo:Teléfonos, horario y ubicación de Carmexio Guanajuato.`,
    });
  }

  protected mapsUrl(lat?: number, lng?: number): string {
    return lat !== undefined && lng !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : 'https://www.google.com/maps/search/?api=1&query=Carmexio+Guanajuato';
  }
}

@Component({
  selector: 'cx-help-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1 i18n="@@help.title">Ayuda</h1>
      <p class="lead" i18n="@@help.lead">Preguntas frecuentes sobre cómo comprar en Carmexio.</p>
      <div class="faq">
        @for (q of faqs; track q.q) {
          <details class="card">
            <summary>{{ q.q }}</summary>
            <p>{{ q.a }}</p>
          </details>
        }
      </div>
      <p>
        <ng-container i18n="@@help.more">¿No encuentras tu respuesta?</ng-container>
        <a class="link" routerLink="/contacto" i18n="@@help.contact">Contáctanos</a>
      </p>
    </div>
  `,
  styles: [
    PAGE_STYLES,
    `
      .faq {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }
      details {
        padding: 16px 20px;
      }
      summary {
        cursor: pointer;
        font-weight: 700;
      }
      details p {
        margin-top: 10px;
        color: var(--cx-text-2);
      }
    `,
  ],
})
export class HelpPage {
  protected readonly faqs = [
    {
      q: $localize`:@@help.q1:¿Puedo ver y probar el auto antes de comprarlo?`,
      a: $localize`:@@help.a1:Sí. Agenda tu visita por chat, WhatsApp o teléfono y haz tu prueba de manejo en la sucursal.`,
    },
    {
      q: $localize`:@@help.q2:¿Qué significa "puedes recoger en Guanajuato"?`,
      a: $localize`:@@help.a2:Que el auto está en otra sucursal Carmexio. Lo traemos a Guanajuato para que lo veas y lo recojas aquí; te decimos el tiempo de traslado al contactarnos.`,
    },
    {
      q: $localize`:@@help.q3:¿Los autos están revisados?`,
      a: $localize`:@@help.a3:Cada auto se inspecciona y, cuando tiene reporte, lo puedes consultar en su página con el detalle por categoría y la carrocería.`,
    },
    {
      q: $localize`:@@help.q4:¿Puedo pagar con financiamiento?`,
      a: $localize`:@@help.a4:Sí. Calcula una mensualidad estimada en la página del auto o en Financiamiento y te ayudamos con el trámite.`,
    },
    {
      q: $localize`:@@help.q5:¿Qué papeles me entregan?`,
      a: $localize`:@@help.a5:Revisamos contigo la factura, las tenencias y el REPUVE antes de cerrar la compra.`,
    },
  ];

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@help.title:Ayuda`,
      description: $localize`:@@help.seo:Preguntas frecuentes para comprar tu auto en Carmexio Guanajuato.`,
    });
  }
}
