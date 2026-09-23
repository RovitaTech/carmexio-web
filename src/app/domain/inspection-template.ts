import { CheckStatus, InspectionCategory, InspectionReport, categoryScore } from './models';

/**
 * Default checklist for a new report — the categories Carmexio inspects today
 * (API_NEEDED.md §3.3). Names are stored as-is in `inspection_reports.categories`.
 */
const TEMPLATE: Record<string, string[]> = {
  'Exterior & body': [
    'Panel alignment',
    'Paint condition',
    'Glass & mirrors',
    'Lights & lenses',
    'Chassis / frame',
  ],
  'Engine & transmission': [
    'Engine start & idle',
    'Oil leaks',
    'Coolant level & leaks',
    'Belts & hoses',
    'Gear shifting',
    'Exhaust smoke',
  ],
  'Suspension & steering': [
    'Shock absorbers',
    'Steering play',
    'Wheel alignment',
    'Bushings & joints',
  ],
  'Tires & brakes': ['Tire tread depth', 'Brake pads', 'Brake discs', 'Spare tire & tools'],
  Interior: ['Seats & upholstery', 'Dashboard & trim', 'Headliner', 'Carpets & odors'],
  'Electrical & AC': [
    'Battery',
    'Air conditioning',
    'Infotainment',
    'Power windows & locks',
    'Warning lights',
  ],
  Documents: ['Factura (title)', 'REPUVE / theft check', 'Tenencias paid', 'Verificación'],
};

export function blankChecklist(status: CheckStatus = 'ok'): InspectionCategory[] {
  return Object.entries(TEMPLATE).map(([name, items]) => ({
    name,
    items: items.map((item) => ({ name: item, status })),
  }));
}

/** Suggested overall score (0–10, one decimal) from the checklist percentages. */
export function suggestedScore(categories: InspectionCategory[]): number {
  if (!categories.length) return 0;
  const average = categories.reduce((sum, c) => sum + categoryScore(c), 0) / categories.length;
  return Math.round(average) / 10;
}

export function newReport(
  listingId: string,
  locationId: string,
  inspectorName: string,
  now = new Date().toISOString(),
): InspectionReport {
  return {
    listingId,
    locationId,
    inspectorName,
    inspectedAt: now,
    overallScore: 10,
    categories: blankChecklist(),
    bodyDefects: [],
  };
}
