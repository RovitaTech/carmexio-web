import { PHOTO_ANGLES, categoryScore } from '../../domain/models';
import { draftToRow } from '../mappers';
import { DummyDb } from './dummy-db';
import { DummyAuthRepository, DummyChatRepository } from './dummy-account.repositories';
import { DummyListingRepository } from './dummy-listing.repository';
import { DummyStaffRepository } from './dummy-staff.repository';

describe('dummy repositories (same seed as the Flutter app)', () => {
  let db: DummyDb;
  let listings: DummyListingRepository;
  let auth: DummyAuthRepository;

  beforeEach(() => {
    db = new DummyDb(0);
    listings = new DummyListingRepository(db);
    auth = new DummyAuthRepository(db);
  });

  it('only lists active cars, each with its Carmexio branch', async () => {
    const page = await listings.search({}, 0, 100);
    expect(page.items.length).toBeGreaterThan(20);
    expect(
      page.items.every((c) => c.status === 'active' && c.location?.name.startsWith('Carmexio')),
    ).toBe(true);
  });

  it('filters and sorts', async () => {
    const page = await listings.search({ bodyType: 'pickup', sort: 'priceLow' }, 0, 50);
    const prices = page.items.map((c) => c.price);
    expect(page.items.every((c) => c.bodyType === 'pickup')).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('paginates', async () => {
    const first = await listings.search({}, 0, 12);
    expect(first.items).toHaveLength(12);
    expect(first.hasMore).toBe(true);
  });

  it('loads inspection reports with category scores', async () => {
    const report = await listings.inspection('car-1');
    expect(report?.categories.length).toBeGreaterThan(0);
    expect(report!.categories.every((c) => categoryScore(c) <= 100)).toBe(true);
  });

  it('signs in the demo user and shows every status in My Ads', async () => {
    await auth.signIn('demo@carmexio.mx', 'carmexio123');
    const mine = await listings.mine();
    expect(new Set(mine.map((c) => c.status))).toEqual(
      new Set(['active', 'pending', 'sold', 'rejected']),
    );
    expect(mine.find((c) => c.status === 'rejected')?.rejectionReason).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    await expect(auth.signIn('demo@carmexio.mx', 'nope')).rejects.toThrow('incorrectos');
  });

  it('new ads go to review with photos in angle order', async () => {
    await auth.signIn('demo@carmexio.mx', 'carmexio123');
    const photos = Object.fromEntries(
      PHOTO_ANGLES.map((a) => [a.value, `https://cdn/${a.value}.jpg`]),
    );
    const car = await listings.create({
      brand: 'Mazda',
      model: 'CX-30',
      year: 2023,
      price: 480000,
      mileageKm: 8000,
      fuelType: 'gasoline',
      transmission: 'automatic',
      bodyType: 'suv',
      locationId: 'loc-qro',
      description: 'Like new, still under warranty.',
      features: [],
      photos,
    });
    expect(car.status).toBe('pending');
    expect(car.city).toBe('Querétaro');
    expect(car.imageAngles).toEqual(PHOTO_ANGLES.map((a) => a.value));

    const staff = new DummyStaffRepository(db);
    await expect(staff.reviewQueue()).rejects.toMatchObject({ kind: 'auth' });
    await auth.signIn('staff@carmexio.mx', 'carmexio123');
    expect((await staff.reviewQueue('loc-qro')).some((c) => c.id === car.id)).toBe(true);
    await staff.approve(car.id);
    expect((await listings.byId(car.id)).status).toBe('active');
  });

  it('owners can only mark live ads as sold, and relisting goes back to review', async () => {
    await auth.signIn('demo@carmexio.mx', 'carmexio123');
    const [mine] = await listings.mine();
    const pending = (await listings.mine()).find((c) => c.status !== 'active');
    if (pending) {
      await expect(listings.setStatus(pending.id, 'sold')).rejects.toMatchObject({
        kind: 'validation',
      });
    }
    await listings.setStatus(mine.id, 'pending');
    expect((await listings.byId(mine.id)).status).toBe('pending');
    await expect(listings.setStatus('car-1', 'sold')).rejects.toMatchObject({ kind: 'auth' });
  });

  it('staff reject needs a reason and saving a report syncs the score', async () => {
    const staff = new DummyStaffRepository(db);
    await auth.signIn('staff@carmexio.mx', 'carmexio123');
    const [queued] = await staff.reviewQueue();
    await expect(staff.reject(queued.id, '  ')).rejects.toMatchObject({ kind: 'validation' });
    await staff.reject(queued.id, 'Foto del tablero borrosa.');
    expect((await listings.byId(queued.id)).rejectionReason).toBe('Foto del tablero borrosa.');

    const report = (await listings.inspection('car-1'))!;
    await staff.saveInspection({ ...report, overallScore: 9.9 });
    expect((await listings.byId('car-1')).inspectionScore).toBe(9.9);
    expect((await listings.inspection('car-1'))!.overallScore).toBe(9.9);
  });

  it('draftToRow keeps canonical angle order', () => {
    const row = draftToRow({
      brand: 'Kia',
      model: 'Rio',
      year: 2021,
      price: 1,
      mileageKm: 1,
      fuelType: 'gasoline',
      transmission: 'manual',
      bodyType: 'sedan',
      locationId: 'loc-cdmx',
      description: '',
      features: [],
      photos: { rear: 'r.jpg', front: 'f.jpg' },
    });
    expect(row['image_angles']).toEqual(['front', 'rear']);
    expect(row['images']).toEqual(['f.jpg', 'r.jpg']);
  });

  it('chats go to the Carmexio branch and reuse threads', async () => {
    const chat = new DummyChatRepository(db);
    await auth.signIn('demo@carmexio.mx', 'carmexio123');
    expect(await chat.start({ listingId: 'car-1' })).toBe('conv-1');
    const general = await chat.start({ locationId: 'loc-tij' });
    const conversation = await chat.conversation(general);
    expect(conversation.listingId).toBeUndefined();
    expect(conversation.location.city).toBe('Tijuana');
  });
});
