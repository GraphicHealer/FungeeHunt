-- CreateEnum (idempotent)
DO $$
BEGIN
    ALTER TYPE "ProofType" ADD VALUE 'PHOTOS';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "photoCount" INTEGER;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "proofUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
