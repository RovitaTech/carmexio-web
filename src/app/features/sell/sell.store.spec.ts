import { TestBed } from '@angular/core/testing';
import { PHOTO_ANGLES } from '../../domain/models';
import { provideDummyData } from '../../data/providers';
import { SellStore } from './sell.store';

describe('SellStore', () => {
  let store: SellStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideDummyData({ latencyMs: 0 }), SellStore] });
    store = TestBed.inject(SellStore);
  });

  function fillDetails() {
    store.selectBrand('Toyota');
    store.model.set('Hilux');
    store.year.set(2022);
    store.bodyType.set('pickup');
    store.mileageKm.set(1000);
  }

  it('walks details → photos → pricing → review with validation', async () => {
    expect(store.next()).toBe(false);
    expect(store.error()).toBe('Elige la marca');

    fillDetails();
    expect(store.next()).toBe(true);
    expect(store.step()).toBe('photos');

    expect(store.next()).toBe(false);
    expect(store.error()).toContain(`faltan ${PHOTO_ANGLES.length}`);

    for (const a of PHOTO_ANGLES) {
      await store.capture(a.value, new File(['x'], `${a.value}.jpg`, { type: 'image/jpeg' }));
    }
    expect(store.doneShots()).toBe(PHOTO_ANGLES.length);
    expect(store.next()).toBe(true);

    store.price.set(100);
    expect(store.next()).toBe(false);
    store.price.set(550000);
    expect(store.next()).toBe(false);
    expect(store.error()).toBe('Elige una sucursal Carmexio');
    store.locationId.set('loc-cdmx');
    store.description.set('Un dueño, servicios de agencia.');
    expect(store.next()).toBe(true);
    expect(store.step()).toBe('review');
  });

  it('changing brand clears the model', () => {
    store.selectBrand('Ford');
    store.model.set('Lobo');
    store.selectBrand('RAM');
    expect(store.model()).toBe('');
  });
});
