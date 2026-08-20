import { z } from 'zod';

export const GameStatus = z.enum(['NOT_STARTED', 'LIVE', 'COMPLETED']);
export type GameStatus = z.infer<typeof GameStatus>;

export const SubmissionMode = z.enum(['AUTOMATIC', 'MANUAL']);
export type SubmissionMode = z.infer<typeof SubmissionMode>;

export const gameSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  status: GameStatus.default('NOT_STARTED'),
  startAt: z.coerce.date().nullish(),
  endAt: z.coerce.date().nullish(),
  submissionMode: SubmissionMode.default('AUTOMATIC'),
});

export type Game = z.infer<typeof gameSchema>;
