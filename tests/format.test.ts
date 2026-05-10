/**
 * Unit Tests: Text Formatting & Enum Display
 * Tests for formatLabel(), formatSKU(), formatEnum(), formatModelName()
 * used across admin panel and storefront UI.
 */
import { describe, it, expect } from 'vitest';
import { formatLabel, formatSKU } from '../src/utils/formatText';
import { formatEnum, formatModelName } from '../src/utils/format';

describe('formatLabel', () => {
  it('should convert snake_case to Title Case', () => {
    expect(formatLabel('airsoft_rifles')).toBe('Airsoft Rifles');
  });

  it('should handle single word', () => {
    expect(formatLabel('accessories')).toBe('Accessories');
  });

  it('should handle multiple underscores', () => {
    expect(formatLabel('long_range_sniper_scope')).toBe('Long Range Sniper Scope');
  });

  it('should return empty string for empty input', () => {
    expect(formatLabel('')).toBe('');
  });
});

describe('formatSKU', () => {
  it('should return SKU as-is (technical string)', () => {
    expect(formatSKU('AEG-M4-BLK-001')).toBe('AEG-M4-BLK-001');
  });

  it('should return N/A for empty SKU', () => {
    expect(formatSKU('')).toBe('N/A');
  });
});

describe('formatEnum', () => {
  it('should convert snake_case enum to display string', () => {
    expect(formatEnum('pending_approval')).toBe('Pending Approval');
  });

  it('should convert dash-separated strings', () => {
    expect(formatEnum('out-of-stock')).toBe('Out Of Stock');
  });

  it('should return empty for empty string', () => {
    expect(formatEnum('')).toBe('');
  });
});

describe('formatModelName', () => {
  it('should return plain filename if not a URL', () => {
    expect(formatModelName('ak47_model.glb')).toBe('ak47_model.glb');
  });

  it('should return "Upload GLB Model" for undefined', () => {
    expect(formatModelName(undefined)).toBe('Upload GLB Model');
  });

  it('should extract filename from Firebase URL', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/test/o/products%2F3d%2Fmodel.glb?alt=media';
    expect(formatModelName(url)).toBe('model.glb');
  });
});
