import { z } from 'zod';

export const PlayerType = z.enum(['APP', 'OFFLINE']);
export type PlayerType = z.infer<typeof PlayerType>;

export const playerSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  displayName: z.string(),
  type: PlayerType,
  sessionToken: z.string().nullish(),
  teamId: z.string().nullish(),
});

export type Player = z.infer<typeof playerSchema>;
