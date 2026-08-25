-- AlterTable
ALTER TABLE "Task" ADD COLUMN "category" TEXT;
UPDATE "Task" SET "category" = 'General';

-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN "taskCategories" TEXT;
UPDATE "SystemSettings" SET "taskCategories" = '["General","Team Photo"]';
