import { z } from 'zod';

const orderItemSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().optional(),
  productId: z.string().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  configuration: z.any().optional(),
  selectedVariant: z.any().optional()
}).passthrough();

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1),
    shipping: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(5),
      city: z.string().min(1),
      address: z.string().min(1),
      postalCode: z.string().min(1)
    }).passthrough(),
    payment: z.object({
      method: z.string(),
      status: z.string().optional()
    }).passthrough().optional(),
    shipping_cost: z.number().optional(),
    shippingCost: z.number().optional(),
    discountAmount: z.number().optional(),
    discount_amount: z.number().optional(),
    notes: z.string().optional(),
    pointsEarned: z.number().optional()
  }).passthrough()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
