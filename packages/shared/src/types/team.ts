import { z } from 'zod';

export const teamSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string().nullish(),
  managerId: z.string().nullish(),
});

export type Team = z.infer<typeof teamSchema>;
