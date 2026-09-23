import { AppError } from '../../domain/models';
import { check, toAppError, unwrap } from './supabase-errors';

describe('supabase error mapping (same as the Flutter app)', () => {
  it.each([
    [{ code: 'PGRST116', message: 'no rows' }, 'notFound'],
    [{ code: '42501', message: 'rls' }, 'auth'],
    [{ code: '23514', message: 'check' }, 'validation'],
    [{ code: 'invalid_credentials', message: 'x', status: 400 }, 'auth'],
    [{ message: 'x', status: 401 }, 'auth'],
    [new TypeError('Failed to fetch'), 'network'],
    [{ message: 'boom' }, 'server'],
  ])('%o → %s', (error, kind) => {
    const mapped = toAppError(error);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.kind).toBe(kind);
  });

  it('unwrap returns data, throws mapped errors and treats null as not found', () => {
    expect(unwrap({ data: [1], error: null })).toEqual([1]);
    expect(() => unwrap({ data: null, error: { code: '42501' } })).toThrow(AppError);
    expect(() => unwrap({ data: null, error: null })).toThrow('No encontramos');
    expect(() => check({ error: null })).not.toThrow();
  });
});
