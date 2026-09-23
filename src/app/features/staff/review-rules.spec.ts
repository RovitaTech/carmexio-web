import { Car, PHOTO_ANGLES } from '../../domain/models';
import { approvalBlockers, rejectionReason } from './review-rules';

const car = (angles: string[]) => ({ imageAngles: angles }) as unknown as Car;
const ALL = PHOTO_ANGLES.map((a) => a.value);

describe('review rules', () => {
  it('needs all 11 angles and an inspection report to approve', () => {
    expect(approvalBlockers(car(ALL), true)).toEqual([]);
    expect(approvalBlockers(car(ALL), false)).toEqual(['Primero guarda el reporte de inspección.']);
    const [first] = approvalBlockers(car(ALL.filter((a) => a !== 'engine')), true);
    expect(first).toBe('Falta 1 foto: Motor.');
  });

  it('builds the owner-facing reason in canonical angle order', () => {
    expect(rejectionReason(['engine', 'front'], '  Foto borrosa. ')).toBe(
      'Vuelve a tomar estas fotos: Frente, Motor. Foto borrosa.',
    );
    expect(rejectionReason([], 'Precio fuera de mercado.')).toBe('Precio fuera de mercado.');
    expect(rejectionReason([], '  ')).toBe('');
  });
});
