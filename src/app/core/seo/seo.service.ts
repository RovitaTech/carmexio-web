import { DOCUMENT, Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description?: string;
  image?: string;
  /** JSON-LD object for rich results (Car, AutoDealer…). */
  jsonLd?: object;
}

/** Per-page title, meta, Open Graph and JSON-LD (rendered on the server). */
@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(data: SeoData): void {
    const title = `${data.title} · Carmexio`;
    this.title.setTitle(title);
    this.meta.updateTag({ property: 'og:title', content: title });
    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
    }
    if (data.image) this.meta.updateTag({ property: 'og:image', content: data.image });

    this.document.getElementById('cx-jsonld')?.remove();
    if (data.jsonLd) {
      const script = this.document.createElement('script');
      script.id = 'cx-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data.jsonLd);
      this.document.head.appendChild(script);
    }
  }
}
