import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, min, required, submit, validate } from '@angular/forms/signals';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import {
  AD_PLACEMENTS,
  AdPlacement,
  Advertisement,
  MediaAsset,
  MediaKind,
} from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { fromLocalInput, toLocalInput } from '../ui/dates';
import { TextModel, dateRangeRule, fromTextModel, linkRule, toTextModel } from '../ui/form-helpers';
import { LocalizedField } from '../ui/localized-field';
import { MediaPicker } from '../ui/media-picker';
import { AD_PLACEMENT_HINTS, AD_PLACEMENT_LABELS } from './ad-placements';

interface AdModel {
  placement: AdPlacement;
  mediaKind: MediaKind;
  mediaUrl: string;
  posterUrl: string;
  title: TextModel;
  subtitle: TextModel;
  ctaLabel: TextModel;
  link: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
}

const BLANK: AdModel = {
  placement: 'home_hero',
  mediaKind: 'image',
  mediaUrl: '',
  posterUrl: '',
  title: { es: '', en: '' },
  subtitle: { es: '', en: '' },
  ctaLabel: { es: '', en: '' },
  link: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
  sortOrder: 0,
};

/** Create (`/admin/anuncios/nuevo`) or edit an ad, with a live preview. */
@Component({
  selector: 'cx-admin-ad-editor',
  imports: [RouterLink, FormField, LocalizedField, MediaPicker, ErrorState, Skeleton],
  templateUrl: './ad-editor.page.html',
  styleUrls: ['../ui/admin-page.scss', './ad-editor.page.scss'],
})
export class AdEditorPage {
  /** Route param: an ad id, or `nuevo`. */
  readonly id = input.required<string>();

  private readonly cms = inject(CMS_REPOSITORY);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly isNew = computed(() => this.id() === 'nuevo');
  protected readonly existing = resource({
    params: () => (this.isNew() ? undefined : this.id()),
    loader: async ({ params }) => {
      const ad = (await this.cms.ads()).find((a) => a.id === params);
      if (!ad) throw new Error('Este anuncio ya no existe.');
      return ad;
    },
  });

  protected readonly model = signal<AdModel>(BLANK);
  protected readonly ad = form(this.model, (p) => {
    required(p.title.es, { message: 'El título en español es obligatorio.' });
    required(p.mediaUrl, { message: 'Elige una imagen o un video.' });
    validate(p.posterUrl, ({ value, valueOf }) =>
      valueOf(p.mediaKind) === 'video' && !value()
        ? { kind: 'poster', message: 'Los videos necesitan una imagen de portada.' }
        : undefined,
    );
    linkRule(p.link);
    dateRangeRule(p.startsAt, p.endsAt);
    min(p.sortOrder, 0, { message: 'Usa 0 o más.' });
  });

  protected readonly placements = AD_PLACEMENTS.map((id) => ({
    id,
    label: AD_PLACEMENT_LABELS[id],
  }));
  protected readonly hint = computed(() => AD_PLACEMENT_HINTS[this.model().placement]);
  protected readonly preview = computed(() => {
    const m = this.model();
    return {
      title: m.title.es || 'Título del anuncio',
      subtitle: m.subtitle.es,
      cta: m.ctaLabel.es,
      image: m.mediaKind === 'video' ? m.posterUrl : m.mediaUrl,
      video: m.mediaKind === 'video' ? m.mediaUrl : '',
    };
  });
  protected readonly loaded = computed(() => this.isNew() || this.existing.hasValue());

  constructor() {
    effect(() => {
      const ad = valueOr(this.existing, undefined);
      this.model.set(ad ? toModel(ad) : BLANK);
    });
  }

  /** Picking a video from the library switches the ad to video mode. */
  protected mediaPicked(asset: MediaAsset): void {
    this.model.update((m) => ({ ...m, mediaKind: asset.kind }));
  }

  protected save(): Promise<boolean> {
    return submit(this.ad, async () => {
      try {
        await this.cms.saveAd(toAd(this.isNew() ? '' : this.id(), this.model()));
        this.content.reload();
        this.toast.success('Anuncio guardado.');
        await this.router.navigateByUrl('/admin/anuncios');
      } catch (e) {
        this.toast.error(e, 'No se pudo guardar el anuncio.');
      }
    });
  }
}

function toModel(ad: Advertisement): AdModel {
  return {
    placement: ad.placement,
    mediaKind: ad.mediaKind,
    mediaUrl: ad.mediaUrl,
    posterUrl: ad.posterUrl ?? '',
    title: toTextModel(ad.title),
    subtitle: toTextModel(ad.subtitle),
    ctaLabel: toTextModel(ad.ctaLabel),
    link: ad.link ?? '',
    startsAt: toLocalInput(ad.startsAt),
    endsAt: toLocalInput(ad.endsAt),
    isActive: ad.isActive,
    sortOrder: ad.sortOrder,
  };
}

function toAd(id: string, m: AdModel): Advertisement {
  return {
    id,
    placement: m.placement,
    mediaKind: m.mediaKind,
    mediaUrl: m.mediaUrl,
    posterUrl: m.mediaKind === 'video' ? m.posterUrl || undefined : undefined,
    title: fromTextModel(m.title) ?? { es: '' },
    subtitle: fromTextModel(m.subtitle),
    ctaLabel: fromTextModel(m.ctaLabel),
    link: m.link.trim() || undefined,
    startsAt: fromLocalInput(m.startsAt),
    endsAt: fromLocalInput(m.endsAt),
    isActive: m.isActive,
    sortOrder: m.sortOrder,
  };
}
