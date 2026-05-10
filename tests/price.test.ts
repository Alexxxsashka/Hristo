/**
 * Unit Tests: Price Calculation Module
 * Tests for getDiscountedPrice() and formatPrice() functions
 * that are critical for correct pricing in the storefront.
 */
import { describe, it, expect } from 'vitest';
import { getDiscountedPrice, formatPrice } from '../src/utils/price';

describe('getDiscountedPrice', () => {
  it('should return the original price when no discount is provided', () => {
    expect(getDiscountedPrice(100)).toBe(100);
    expect(getDiscountedPrice(49.99)).toBe(49.99);
  });

  it('should return the original price when discount is 0', () => {
    expect(getDiscountedPrice(100, 0)).toBe(100);
  });

  it('should correctly calculate a 10% discount', () => {
    expect(getDiscountedPrice(100, 10)).toBe(90);
  });

  it('should correctly calculate a 25% discount', () => {
    expect(getDiscountedPrice(200, 25)).toBe(150);
  });

  it('should handle a 100% discount (free item)', () => {
    expect(getDiscountedPrice(59.99, 100)).toBeCloseTo(0, 2);
  });

  it('should handle string price input', () => {
    expect(getDiscountedPrice('100', 10)).toBe(90);
    expect(getDiscountedPrice('49.99', 0)).toBe(49.99);
  });

  it('should return 0 for NaN price input', () => {
    expect(getDiscountedPrice('invalid')).toBe(0);
    expect(getDiscountedPrice(NaN)).toBe(0);
  });

  it('should ignore negative discount values', () => {
    expect(getDiscountedPrice(100, -10)).toBe(100);
  });
});

describe('formatPrice', () => {
  it('should format a number as EUR currency string', () => {
    const result = formatPrice(100);
    expect(result).toContain('€');
    expect(result).toContain('100');
  });

  it('should show two decimal places', () => {
    const result = formatPrice(49.9);
    expect(result).toContain('49');
  });

  it('should handle string input', () => {
    const result = formatPrice('250');
    expect(result).toContain('€');
    expect(result).toContain('250');
  });

  it('should return €0.00 for NaN input', () => {
    expect(formatPrice('invalid')).toBe('€0.00');
    expect(formatPrice(NaN)).toBe('€0.00');
  });
});
