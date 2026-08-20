import { z } from 'zod';

export const SubmissionStatus = z.enum(['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'INCOMPLETE']);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

export const submissionSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  teamId: z.string(),
  proofUrl: z.string(),
  status: SubmissionStatus.default('SUBMITTED'),
  reason: z.string().nullish(),
  submittedAt: z.coerce.date(),
  reviewedAt: z.coerce.date().nullish(),
});

export type Submission = z.infer<typeof submissionSchema>;
