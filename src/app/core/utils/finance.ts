/** Estimated APR shown on the calculator (Carmexio's partner banks, Sep 2026). */
export const DEFAULT_ANNUAL_RATE = 14.9;
export const LOAN_TERMS = [12, 24, 36, 48, 60] as const;
export const MIN_DOWN_PCT = 10;
export const MAX_DOWN_PCT = 70;

export interface LoanQuote {
  downPayment: number;
  financed: number;
  monthly: number;
  totalInterest: number;
}

/**
 * French amortization (fixed monthly payment), rounded to whole pesos.
 * `annualRatePct` 0 → straight division.
 */
export function quoteLoan(
  price: number,
  downPct: number,
  months: number,
  annualRatePct = DEFAULT_ANNUAL_RATE,
): LoanQuote {
  const downPayment = Math.round((price * downPct) / 100);
  const financed = Math.max(0, price - downPayment);
  const r = annualRatePct / 100 / 12;
  const monthly = r === 0 ? financed / months : (financed * r) / (1 - Math.pow(1 + r, -months));
  return {
    downPayment,
    financed,
    monthly: Math.round(monthly),
    totalInterest: Math.round(monthly * months - financed),
  };
}
