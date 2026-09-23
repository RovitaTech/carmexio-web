import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AppError,
  BodyType,
  Car,
  FuelType,
  ListingDraft,
  PHOTO_ANGLES,
  PhotoAngle,
  Transmission,
} from '../../domain/models';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { resizeImage } from './resize-image';

export type SellStep = 'details' | 'photos' | 'pricing' | 'review';
export const SELL_STEPS: { id: SellStep; label: string }[] = [
  { id: 'details', label: 'Datos' },
  { id: 'photos', label: 'Fotos' },
  { id: 'pricing', label: 'Precio' },
  { id: 'review', label: 'Revisión' },
];

export interface AngleShot {
  preview?: string;
  url?: string;
  uploading?: boolean;
  error?: string;
}

/** Same values the app stores in `listings.features`. */
export const FEATURES: { value: string; label: string }[] = [
  ['Air conditioning', 'Aire acondicionado'],
  ['Leather seats', 'Asientos de piel'],
  ['Sunroof', 'Quemacocos'],
  ['Navigation', 'Navegación'],
  ['Apple CarPlay', 'Apple CarPlay'],
  ['Android Auto', 'Android Auto'],
  ['Rear camera', 'Cámara de reversa'],
  ['360° camera', 'Cámara 360°'],
  ['Parking sensors', 'Sensores de estacionamiento'],
  ['Cruise control', 'Control crucero'],
  ['Adaptive cruise', 'Crucero adaptativo'],
  ['Heated seats', 'Asientos con calefacción'],
  ['Keyless entry', 'Acceso sin llave'],
  ['Push start', 'Encendido por botón'],
  ['Alloy wheels', 'Rines de aluminio'],
  ['4x4', '4x4'],
  ['Tow hitch', 'Enganche'],
  ['Lane assist', 'Asistente de carril'],
  ['Blind spot monitor', 'Monitor de punto ciego'],
  ['Wireless charging', 'Carga inalámbrica'],
].map(([value, label]) => ({ value, label }));

/** Sell wizard ViewModel (provided per page instance). */
@Injectable()
export class SellStore {
  private readonly repo = inject(LISTING_REPOSITORY);

  readonly step = signal<SellStep>('details');
  readonly editingId = signal<string | null>(null);
  readonly shots = signal<Partial<Record<PhotoAngle, AngleShot>>>({});
  readonly brand = signal('');
  readonly model = signal('');
  readonly version = signal('');
  readonly year = signal<number | null>(null);
  readonly bodyType = signal<BodyType | null>(null);
  readonly fuelType = signal<FuelType>('gasoline');
  readonly transmission = signal<Transmission>('automatic');
  readonly mileageKm = signal<number | null>(null);
  readonly engineCc = signal<number | null>(null);
  readonly color = signal('');
  readonly price = signal<number | null>(null);
  readonly locationId = signal<string | null>(null);
  readonly description = signal('');
  readonly features = signal<string[]>([]);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly doneShots = computed(
    () => Object.values(this.shots()).filter((s) => s?.url && !s.uploading).length,
  );
  readonly missingAngles = computed(() => PHOTO_ANGLES.filter((a) => !this.shots()[a.value]?.url));
  readonly stepIndex = computed(() => SELL_STEPS.findIndex((s) => s.id === this.step()));

  load(car: Car): void {
    this.editingId.set(car.id);
    this.brand.set(car.brand);
    this.model.set(car.model);
    this.version.set(car.version ?? '');
    this.year.set(car.year);
    this.bodyType.set(car.bodyType);
    this.fuelType.set(car.fuelType);
    this.transmission.set(car.transmission);
    this.mileageKm.set(car.mileageKm);
    this.engineCc.set(car.engineCc ?? null);
    this.color.set(car.exteriorColor ?? '');
    this.price.set(car.price);
    this.locationId.set(car.locationId);
    this.description.set(car.description);
    this.features.set(car.features);
    // Tagged photos keep their angle; untagged legacy photos must be re-shot.
    const shots: Partial<Record<PhotoAngle, AngleShot>> = {};
    car.imageAngles.forEach((angle, i) => (shots[angle] = { url: car.images[i] }));
    this.shots.set(shots);
  }

  selectBrand(brand: string): void {
    if (brand !== this.brand()) this.model.set('');
    this.brand.set(brand);
  }

  toggleFeature(value: string): void {
    this.features.update((list) =>
      list.includes(value) ? list.filter((f) => f !== value) : [...list, value],
    );
  }

  /** Resizes and uploads the photo immediately after it is taken. */
  async capture(angle: PhotoAngle, file: File): Promise<void> {
    const preview = URL.createObjectURL(file);
    this.setShot(angle, { preview, uploading: true });
    try {
      const blob = await resizeImage(file, 1920, 0.8);
      const url = await this.repo.uploadPhoto(blob, `${angle}.jpg`);
      this.setShot(angle, { preview, url });
    } catch (e) {
      this.setShot(angle, {
        preview,
        error: e instanceof AppError ? e.message : 'No se pudo subir la foto.',
      });
    }
  }

  validate(step: SellStep): string | null {
    switch (step) {
      case 'details': {
        if (!this.brand()) return 'Elige la marca';
        if (!this.model().trim()) return 'Elige el modelo';
        if (!this.year()) return 'Elige el año';
        if (!this.bodyType()) return 'Elige la carrocería';
        const km = this.mileageKm();
        return km == null || km < 0 || km > 1_500_000 ? 'Ingresa un kilometraje válido' : null;
      }
      case 'photos': {
        if (Object.values(this.shots()).some((s) => s?.uploading))
          return 'Espera a que terminen de subir las fotos';
        const missing = this.missingAngles();
        return missing.length
          ? `Toma la foto: ${missing[0].label} (faltan ${missing.length})`
          : null;
      }
      case 'pricing': {
        const price = this.price();
        if (price == null || price < 20_000 || price > 50_000_000)
          return 'Ingresa un precio entre $20,000 y $50,000,000';
        if (!this.locationId()) return 'Elige una sucursal Carmexio';
        return this.description().trim().length < 20
          ? 'Describe tu auto en al menos 20 caracteres'
          : null;
      }
      case 'review':
        for (const s of SELL_STEPS.slice(0, 3)) {
          const error = this.validate(s.id);
          if (error) return error;
        }
        return null;
    }
  }

  next(): boolean {
    const error = this.validate(this.step());
    this.error.set(error);
    if (error) return false;
    const i = this.stepIndex();
    if (i < SELL_STEPS.length - 1) this.step.set(SELL_STEPS[i + 1].id);
    return true;
  }

  back(): void {
    this.error.set(null);
    const i = this.stepIndex();
    if (i > 0) this.step.set(SELL_STEPS[i - 1].id);
  }

  async submit(): Promise<Car | null> {
    const error = this.validate('review');
    this.error.set(error);
    if (error) return null;
    this.submitting.set(true);
    try {
      const draft = this.toDraft();
      const id = this.editingId();
      return await (id ? this.repo.update(id, draft) : this.repo.create(draft));
    } catch (e) {
      this.error.set(e instanceof AppError ? e.message : 'No pudimos enviar tu anuncio.');
      return null;
    } finally {
      this.submitting.set(false);
    }
  }

  private toDraft(): ListingDraft {
    const photos: Partial<Record<PhotoAngle, string>> = {};
    for (const [angle, shot] of Object.entries(this.shots())) {
      if (shot?.url) photos[angle as PhotoAngle] = shot.url;
    }
    return {
      brand: this.brand(),
      model: this.model().trim(),
      version: this.version().trim() || undefined,
      year: this.year()!,
      price: this.price()!,
      mileageKm: this.mileageKm()!,
      fuelType: this.fuelType(),
      transmission: this.transmission(),
      bodyType: this.bodyType()!,
      engineCc: this.engineCc() ?? undefined,
      exteriorColor: this.color().trim() || undefined,
      locationId: this.locationId()!,
      description: this.description().trim(),
      features: this.features(),
      photos,
    };
  }

  private setShot(angle: PhotoAngle, shot: AngleShot): void {
    this.shots.update((s) => ({ ...s, [angle]: shot }));
  }
}
