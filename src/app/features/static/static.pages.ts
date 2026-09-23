import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'cx-how-it-works-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1 i18n="@@static.como-funciona-carmexio">Cómo funciona Carmexio</h1>
      <p class="lead" i18n="@@static.carmexio-es-la-agencia-verificamos">
        Carmexio es la agencia: verificamos cada auto y atendemos a cada comprador.
      </p>
      <div class="cols">
        <section class="card block">
          <h2 i18n="@@static.si-vendes">Si vendes</h2>
          <ol>
            <li i18n="@@static.crea-tu-cuenta-y-publica">
              Crea tu cuenta y publica tu auto gratis.
            </li>
            <li i18n="@@static.toma-las-11-fotos-guiadas">
              Toma las 11 fotos guiadas (frente, costados, tablero, motor…).
            </li>
            <li i18n="@@static.elige-la-sucursal-carmexio-y">
              Elige la sucursal Carmexio y lleva el auto a inspección.
            </li>
            <li i18n="@@static.publicamos-tu-auto-con-reporte">
              Publicamos tu auto con reporte verificado.
            </li>
            <li i18n="@@static.atendemos-a-los-compradores-y">
              Atendemos a los compradores y coordinamos visitas y pago.
            </li>
          </ol>
          <a class="btn primary" routerLink="/vender" i18n="@@static.vender-mi-auto"
            >Vender mi auto</a
          >
        </section>
        <section class="card block">
          <h2 i18n="@@static.si-compras">Si compras</h2>
          <ol>
            <li i18n="@@static.explora-autos-verificados-con-reporte">
              Explora autos verificados con reporte de inspección.
            </li>
            <li i18n="@@static.chatea-llama-o-escribe-por">
              Chatea, llama o escribe por WhatsApp a la sucursal.
            </li>
            <li i18n="@@static.agendamos-tu-visita-y-prueba">
              Agendamos tu visita y prueba de manejo.
            </li>
            <li i18n="@@static.revisamos-papeles-factura-tenencias-repuve">
              Revisamos papeles (factura, tenencias, REPUVE) contigo.
            </li>
          </ol>
          <a class="btn outline" routerLink="/autos" i18n="@@static.ver-autos">Ver autos</a>
        </section>
      </div>
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 16px;
      padding-block: 32px;
    }
    .lead {
      font-size: 1.1rem;
    }
    .cols {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
    .block {
      display: grid;
      gap: 12px;
      padding: 24px;
      align-content: start;
      justify-items: start;
    }
    ol {
      display: grid;
      gap: 8px;
      padding-left: 20px;
      margin: 0;
      color: var(--cx-text-2);
    }
  `,
})
export class HowItWorksPage {
  constructor() {
    inject(SeoService).set({
      title: $localize`:@@static.como-funciona:Cómo funciona`,
      description: $localize`:@@static.vende-tu-auto-con-carmexio:Vende tu auto con Carmexio o compra un seminuevo verificado e inspeccionado.`,
    });
  }
}

@Component({
  selector: 'cx-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1>404</h1>
      <p i18n="@@static.esta-pagina-no-existe">Esta página no existe.</p>
      <a class="btn primary" routerLink="/" i18n="@@static.ir-al-inicio">Ir al inicio</a>
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 12px;
      justify-items: center;
      padding-block: 80px;
      text-align: center;
    }
    h1 {
      font-size: 4rem;
    }
  `,
})
export class NotFoundPage {
  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: $localize`:@@static.pagina-no-encontrada:Página no encontrada`,
      noindex: true,
    });
    seo.setStatus(404);
  }
}
