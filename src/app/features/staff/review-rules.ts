import { Car, PHOTO_ANGLES, PhotoAngle } from '../../domain/models';

/** Canned reasons shown to the owner in "Mis anuncios" (`rejection_reason`). */
export const REJECT_TEMPLATES = [
  'El precio no corresponde al mercado. Ajústalo y reenvía.',
  'La descripción no coincide con el auto de las fotos.',
  'Faltan documentos: trae la factura original a la sucursal.',
  'El auto no pasó la inspección de Carmexio.',
];

/**
 * Why an ad can't go live yet (API_NEEDED.md §0 rule 4 + `all_angles` check):
 * every angle photo, and an inspection report published first.
 */
export function approvalBlockers(car: Car, hasReport: boolean): string[] {
  const blockers: string[] = [];
  const missing = PHOTO_ANGLES.filter((a) => !car.imageAngles.includes(a.value));
  if (missing.length) {
    const count = missing.length === 1 ? 'Falta 1 foto' : `Faltan ${missing.length} fotos`;
    blockers.push(`${count}: ${missing.map((a) => a.label).join(', ')}.`);
  }
  if (!hasReport) blockers.push('Primero guarda el reporte de inspección.');
  return blockers;
}

/** Reason text for the owner: selected re-shoots first, then the free note. */
export function rejectionReason(reshoot: readonly PhotoAngle[], note: string): string {
  const labels = PHOTO_ANGLES.filter((a) => reshoot.includes(a.value)).map((a) => a.label);
  const parts = [
    labels.length ? `Vuelve a tomar estas fotos: ${labels.join(', ')}.` : '',
    note.trim(),
  ];
  return parts.filter(Boolean).join(' ');
}
