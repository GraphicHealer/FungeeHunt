ALTER TABLE "SystemSettings" RENAME COLUMN "autoDeleteDays" TO "autoDeleteHours";
ALTER TABLE "SystemSettings" ALTER COLUMN "autoDeleteHours" SET DEFAULT 24;
UPDATE "SystemSettings" SET "autoDeleteHours" = "autoDeleteHours" * 24;
