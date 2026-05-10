/**
 * Unit Tests: Zod Validation Schemas
 * Tests for backend validation schemas ensuring data integrity
 * for orders, products, and authentication requests.
 */
import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '../backend/validation/order.schema';
import { productSchema } from '../backend/validation/product.schema';
import { registerSchema, loginSchema } from '../backend/validation/auth.schema';

describe('Order Validation Schema', () => {
  const validOrder = {
    body: {
      items: [
        { name: 'AK-47 AEG', price: 299.99, quantity: 1 }
      ],
      shipping: {
        firstName: 'Ivan',
        lastName: 'Petrov',
        email: 'ivan@example.com',
        phone: '+385912345678',
        city: 'Zagreb',
        address: 'Ilica 10',
        postalCode: '10000'
      },
      payment: { method: 'stripe' }
    }
  };

  it('should accept a valid order', () => {
    const result = createOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('should reject an order with no items', () => {
    const invalid = { body: { ...validOrder.body, items: [] } };
    const result = createOrderSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject an order without shipping email', () => {
    const invalid = {
      body: {
        ...validOrder.body,
        shipping: { ...validOrder.body.shipping, email: 'not-an-email' }
      }
    };
    const result = createOrderSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative quantity', () => {
    const invalid = {
      body: {
        ...validOrder.body,
        items: [{ name: 'Test', price: 10, quantity: -1 }]
      }
    };
    const result = createOrderSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('Product Validation Schema', () => {
  it('should accept a valid product', () => {
    const result = productSchema.safeParse({
      body: {
        name: 'M4A1 AEG',
        slug: 'm4a1-aeg',
        price: 349.99,
        stock: 15
      }
    });
    expect(result.success).toBe(true);
  });

  it('should reject a product with negative price', () => {
    const result = productSchema.safeParse({
      body: { name: 'Test', slug: 'test', price: -10, stock: 5 }
    });
    expect(result.success).toBe(false);
  });

  it('should reject a product with missing name', () => {
    const result = productSchema.safeParse({
      body: { slug: 'test', price: 10, stock: 5 }
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative stock', () => {
    const result = productSchema.safeParse({
      body: { name: 'Test', slug: 'test', price: 10, stock: -1 }
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid discount range 0-100', () => {
    const result = productSchema.safeParse({
      body: { name: 'Test', slug: 'test', price: 10, stock: 5, discount: 50 }
    });
    expect(result.success).toBe(true);
  });

  it('should reject discount above 100', () => {
    const result = productSchema.safeParse({
      body: { name: 'Test', slug: 'test', price: 10, stock: 5, discount: 150 }
    });
    expect(result.success).toBe(false);
  });
});

describe('Auth Validation Schemas', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      body: { email: 'user@test.com', password: 'securePass123', username: 'player1' }
    });
    expect(result.success).toBe(true);
  });

  it('should reject registration with short password', () => {
    const result = registerSchema.safeParse({
      body: { email: 'user@test.com', password: '12' }
    });
    expect(result.success).toBe(false);
  });

  it('should reject registration with invalid email', () => {
    const result = registerSchema.safeParse({
      body: { email: 'not-valid', password: 'securePass123' }
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      body: { email: 'user@test.com', password: 'pass123' }
    });
    expect(result.success).toBe(true);
  });

  it('should reject login with empty password', () => {
    const result = loginSchema.safeParse({
      body: { email: 'user@test.com', password: '' }
    });
    expect(result.success).toBe(false);
  });
});
