CREATE TYPE "RecapVideoStatus" AS ENUM ('PENDING','RENDERING','READY','FAILED');

ALTER TABLE "Game" ADD COLUMN "recapVideoStatus" "RecapVideoStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Game" ADD COLUMN "recapVideoUrl" TEXT;

ALTER TABLE "Submission" ADD COLUMN "isHighlight" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "StyleProfile" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "musicPath" TEXT,
  "transitions" TEXT[] NOT NULL DEFAULT '{}',
  "photoHold" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  "energy" TEXT NOT NULL DEFAULT 'medium',
  "font" TEXT NOT NULL DEFAULT 'Arial',
  "textColor" TEXT NOT NULL DEFAULT '#ffffff',
  "overlay" TEXT NOT NULL DEFAULT 'lower_third',
  CONSTRAINT "StyleProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StyleProfile_category_key" ON "StyleProfile"("category");
