CREATE TYPE "SubmissionVideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

ALTER TABLE "Submission" ADD COLUMN "videoStatus" "SubmissionVideoStatus" NOT NULL DEFAULT 'READY';
