import { z } from 'zod';

export const ProofType = z.enum(['PHOTO', 'VIDEO', 'PHOTOS']);
export type ProofType = z.infer<typeof ProofType>;

export const taskSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number().int(),
  proofType: ProofType,
  photoCount: z.number().int().nullable().optional(),
  order: z.number().int(),
});

export type Task = z.infer<typeof taskSchema>;
