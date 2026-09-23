import { TestBed } from '@angular/core/testing';
import { provideDummyData } from '../../../data/providers';
import { AUTH_REPOSITORY, LISTING_REPOSITORY } from '../../../domain/repositories';
import { InspectionEditorStore } from './inspection-editor.store';

describe('InspectionEditorStore', () => {
  let store: InspectionEditorStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideDummyData({ latencyMs: 0 }), InspectionEditorStore],
    });
    await TestBed.inject(AUTH_REPOSITORY).signIn('staff@carmexio.mx', 'carmexio123');
    store = TestBed.inject(InspectionEditorStore);
  });

  it('starts a blank checklist that scores 10 and follows the checklist', () => {
    store.load('car-x', 'loc-cdmx', null, 'Ana');
    expect(store.isNew()).toBe(true);
    expect(store.categories().length).toBe(7);
    expect(store.overallScore()).toBe(10);

    store.setStatus(0, 0, 'fail');
    expect(store.categoryScores()[0]).toBe(80);
    expect(store.overallScore()).toBeLessThan(10);
    expect(store.dirty()).toBe(true);

    store.setScore(12);
    expect(store.overallScore()).toBe(10);
    store.setScore(null);
    expect(store.overallScore()).toBe(store.suggested());
  });

  it('adds defects only to the selected panel', () => {
    store.load('car-x', 'loc-cdmx', null, 'Ana');
    store.addDefect('A1', 'no panel');
    expect(store.defects()).toEqual([]);
    store.selectedPanel.set('hood');
    store.addDefect('A2', '  Rayón en cofre ');
    expect(store.panelDefects()).toEqual([
      { index: 0, defect: { panel: 'hood', code: 'A2', note: 'Rayón en cofre' } },
    ]);
    store.removeDefect(0);
    expect(store.defects()).toEqual([]);
  });

  it('saves and the listing picks up the score', async () => {
    const listings = TestBed.inject(LISTING_REPOSITORY);
    const existing = await listings.inspection('car-1');
    store.load('car-1', 'loc-cdmx', existing, 'Ana');
    expect(store.isNew()).toBe(false);
    store.setScore(6.25);
    await store.save();
    expect(store.dirty()).toBe(false);
    expect((await listings.byId('car-1')).inspectionScore).toBe(6.3);
  });
});
