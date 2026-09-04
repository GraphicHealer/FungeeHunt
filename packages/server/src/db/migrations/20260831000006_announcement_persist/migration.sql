ALTER TABLE "Game" ADD COLUMN "lastAnnouncement" JSONB;
ALTER TABLE "Game" ADD COLUMN "lastAnnouncementAt" TIMESTAMP(3);
ALTER TABLE "Player" ADD COLUMN "lastAnnouncementReadAt" TIMESTAMP(3);
