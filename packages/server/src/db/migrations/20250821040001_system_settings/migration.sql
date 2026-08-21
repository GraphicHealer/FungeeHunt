-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "foodDriveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "foodDrivePointsPerItem" INTEGER NOT NULL DEFAULT 1,
    "foodDrivePermissible" TEXT,
    "foodDriveSuggested" TEXT,
    "returnBonusEnabled" BOOLEAN NOT NULL DEFAULT true,
    "returnBonusWindowMinutes" INTEGER NOT NULL DEFAULT 10,
    "returnBonusPoints" INTEGER NOT NULL DEFAULT 100,
    "defaultRules" TEXT,
    "defaultTasks" TEXT,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
