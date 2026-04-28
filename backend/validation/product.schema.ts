import { z } from 'zod';

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    category_id: z.string().optional().nullable(),
    description: z.string().optional(),
    image_url: z.string().optional(),
    discount: z.number().min(0).max(100).optional(),
    characteristics: z.array(z.any()).optional(),
    variants: z.array(z.any()).optional(),
    model_3d_url: z.string().optional().nullable(),
    status: z.enum(['active', 'hidden', 'out_of_stock']).optional()
  })
});

export type ProductInput = z.infer<typeof productSchema>['body'];
