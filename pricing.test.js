import { describe, expect, it } from 'vitest';
import { applyDiscount, calculateCheckoutTotal, getDiscountRate } from './pricing.js';

describe('discount pricing', () => {
  it('applies a 15% discount when SMILE15 is entered', () => {
    const subtotal = 200;
    const discounted = applyDiscount(subtotal, 'SMILE15');

    expect(discounted.discount).toBeCloseTo(30, 5);
    expect(discounted.total).toBeCloseTo(170, 5);
  });

  it('accepts the discount code case-insensitively', () => {
    expect(getDiscountRate('smile15')).toBe(0.15);
    expect(calculateCheckoutTotal(60, [57.49], 'smile15').total).toBeCloseTo(246.4915, 4);
  });

  it('does not apply a discount for invalid or missing codes', () => {
    const noDiscount = applyDiscount(200, 'SAVE10');
    const blankDiscount = applyDiscount(200, '');

    expect(noDiscount.discount).toBe(0);
    expect(noDiscount.total).toBe(200);
    expect(blankDiscount.discount).toBe(0);
    expect(blankDiscount.total).toBe(200);
  });
});
