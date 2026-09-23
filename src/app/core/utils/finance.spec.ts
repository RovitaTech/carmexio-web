import { quoteLoan } from './finance';

describe('quoteLoan', () => {
  it('amortizes with a fixed monthly payment', () => {
    // $500,000 car, 20% down → $400,000 over 48 months at 14.9% APR.
    const q = quoteLoan(500_000, 20, 48, 14.9);
    expect(q.downPayment).toBe(100_000);
    expect(q.financed).toBe(400_000);
    expect(q.monthly).toBe(11_112);
    expect(q.totalInterest).toBeGreaterThan(130_000);
    expect(q.totalInterest).toBeLessThan(135_000);
  });

  it('handles 0% and full down payments', () => {
    expect(quoteLoan(120_000, 0, 12, 0).monthly).toBe(10_000);
    expect(quoteLoan(120_000, 100, 12)).toEqual({
      downPayment: 120_000,
      financed: 0,
      monthly: 0,
      totalInterest: 0,
    });
  });
});
