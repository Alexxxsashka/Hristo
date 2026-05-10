/**
 * Unit Tests: Cartesian Product Variant Generator
 * Tests the core algorithm for generating product variant combinations
 * from attribute options (e.g., Color × Size × Material).
 * This is a key business logic function for the ERP module.
 */
import { describe, it, expect } from 'vitest';

// Implementation of the cartesian product algorithm used in ProductForm
function generateVariants(attributes: { name: string; options: string[] }[]): Record<string, string>[] {
  if (attributes.length === 0) return [];
  
  return attributes.reduce<Record<string, string>[]>((acc, attr) => {
    if (acc.length === 0) {
      return attr.options.map(val => ({ [attr.name]: val }));
    }
    return acc.flatMap(item =>
      attr.options.map(val => ({ ...item, [attr.name]: val }))
    );
  }, []);
}

// SKU generator based on variant attributes
function generateSKU(productBase: string, attributes: Record<string, string>): string {
  const parts = Object.values(attributes)
    .map(v => v.substring(0, 3).toUpperCase());
  return `${productBase}-${parts.join('-')}`;
}

describe('Variant Generation (Cartesian Product)', () => {
  it('should generate variants for single attribute', () => {
    const attrs = [{ name: 'Color', options: ['Red', 'Blue', 'Green'] }];
    const variants = generateVariants(attrs);
    expect(variants).toHaveLength(3);
    expect(variants[0]).toEqual({ Color: 'Red' });
    expect(variants[2]).toEqual({ Color: 'Green' });
  });

  it('should generate cartesian product for two attributes', () => {
    const attrs = [
      { name: 'Color', options: ['Black', 'Tan'] },
      { name: 'Size', options: ['S', 'M', 'L'] }
    ];
    const variants = generateVariants(attrs);
    // 2 colors × 3 sizes = 6 combinations
    expect(variants).toHaveLength(6);
    expect(variants).toContainEqual({ Color: 'Black', Size: 'S' });
    expect(variants).toContainEqual({ Color: 'Tan', Size: 'L' });
  });

  it('should generate cartesian product for three attributes', () => {
    const attrs = [
      { name: 'Color', options: ['Black', 'OD Green'] },
      { name: 'Size', options: ['M', 'L'] },
      { name: 'Material', options: ['Nylon', 'Cordura'] }
    ];
    const variants = generateVariants(attrs);
    // 2 × 2 × 2 = 8 combinations
    expect(variants).toHaveLength(8);
  });

  it('should return empty array for no attributes', () => {
    expect(generateVariants([])).toEqual([]);
  });

  it('should handle single option per attribute', () => {
    const attrs = [
      { name: 'Color', options: ['Black'] },
      { name: 'Size', options: ['Universal'] }
    ];
    const variants = generateVariants(attrs);
    expect(variants).toHaveLength(1);
    expect(variants[0]).toEqual({ Color: 'Black', Size: 'Universal' });
  });
});

describe('SKU Generation', () => {
  it('should generate a valid SKU from attributes', () => {
    const sku = generateSKU('AK47', { Color: 'Black', Size: 'Large' });
    expect(sku).toBe('AK47-BLA-LAR');
  });

  it('should handle short attribute values', () => {
    const sku = generateSKU('M4', { Color: 'OD', Size: 'XL' });
    expect(sku).toBe('M4-OD-XL');
  });

  it('should uppercase all attribute parts', () => {
    const sku = generateSKU('gear', { Color: 'tan', Material: 'nylon' });
    expect(sku).toBe('gear-TAN-NYL');
  });
});
