import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'cx-how-it-works-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1>Cómo funciona Carmexio</h1>
      <p class="lead">
        Carmexio es la agencia: verificamos cada auto y atendemos a cada comprador.
      </p>
      <div class="cols">
        <section class="card block">
          <h2>Si vendes</h2>
          <ol>
            <li>Crea tu cuenta y publica tu auto gratis.</li>
            <li>Toma las 11 fotos guiadas (frente, costados, tablero, motor…).</li>
            <li>Elige la sucursal Carmexio y lleva el auto a inspección.</li>
            <li>Publicamos tu auto con reporte verificado.</li>
            <li>Atendemos a los compradores y coordinamos visitas y pago.</li>
          </ol>
          <a class="btn primary" routerLink="/vender">Vender mi auto</a>
        </section>
        <section class="card block">
          <h2>Si compras</h2>
          <ol>
            <li>Explora autos verificados con reporte de inspección.</li>
            <li>Chatea, llama o escribe por WhatsApp a la sucursal.</li>
            <li>Agendamos tu visita y prueba de manejo.</li>
            <li>Revisamos papeles (factura, tenencias, REPUVE) contigo.</li>
          </ol>
          <a class="btn outline" routerLink="/autos">Ver autos</a>
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
      title: 'Cómo funciona',
      description: 'Vende tu auto con Carmexio o compra un seminuevo verificado e inspeccionado.',
    });
  }
}

@Component({
  selector: 'cx-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="container page">
      <h1>404</h1>
      <p>Esta página no existe.</p>
      <a class="btn primary" routerLink="/">Ir al inicio</a>
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
    inject(SeoService).set({ title: 'Página no encontrada' });
  }
}
