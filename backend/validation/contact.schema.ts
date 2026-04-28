import { z } from 'zod';

export const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().optional(),
    message: z.string().min(10)
  })
});

export type ContactInput = z.infer<typeof contactSchema>['body'];
