import { z } from 'zod';

export const ProofType = z.enum(['PHOTO', 'VIDEO', 'EITHER']);
export type ProofType = z.infer<typeof ProofType>;

export const taskSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  title: z.string(),
  description: z.string(),
  points: z.number().int(),
  proofType: ProofType,
  order: z.number().int(),
});

export type Task = z.infer<typeof taskSchema>;
