import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { dateRangeRule, fromTextModel, linkRule, toTextModel } from './form-helpers';

describe('admin form helpers', () => {
  it('round-trips localized text and drops empty values', () => {
    expect(toTextModel({ es: 'Hola' })).toEqual({ es: 'Hola', en: '' });
    expect(fromTextModel({ es: ' Hola ', en: ' ' })).toEqual({ es: 'Hola', en: undefined });
    expect(fromTextModel({ es: '', en: 'Hi' })).toBeUndefined();
  });

  it('validates links and date ranges', () => {
    TestBed.runInInjectionContext(() => {
      const model = signal({ link: 'autos', start: '2026-10-02T10:00', end: '2026-10-01T10:00' });
      const f = form(model, (p) => {
        linkRule(p.link);
        dateRangeRule(p.start, p.end);
      });
      expect(f.link().invalid()).toBe(true);
      expect(f.end().invalid()).toBe(true);
      model.set({ link: '/autos?body=suv', start: '2026-10-01T10:00', end: '2026-10-02T10:00' });
      expect(f.link().invalid()).toBe(false);
      expect(f.end().invalid()).toBe(false);
      model.update((m) => ({ ...m, link: 'https://wa.me/52' }));
      expect(f.link().invalid()).toBe(false);
    });
  });
});
