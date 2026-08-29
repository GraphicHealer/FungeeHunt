CREATE TABLE "SpectatorSession" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "gameId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpectatorSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpectatorSession_code_key" ON "SpectatorSession"("code");
CREATE INDEX "SpectatorSession_gameId_idx" ON "SpectatorSession"("gameId");

ALTER TABLE "SpectatorSession" ADD CONSTRAINT "SpectatorSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
