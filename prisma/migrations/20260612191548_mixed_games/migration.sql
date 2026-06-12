-- CreateTable
CREATE TABLE "mixed_game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_session_id" INTEGER NOT NULL,
    "games" TEXT NOT NULL,
    CONSTRAINT "mixed_game_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "game_session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "mixed_game_game_session_id_key" ON "mixed_game"("game_session_id");
