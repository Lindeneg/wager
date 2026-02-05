-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "result" TEXT NOT NULL,
    "started" DATETIME NOT NULL,
    "ended" DATETIME
);

-- CreateTable
CREATE TABLE "session_participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    CONSTRAINT "session_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "session_participant_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "started" DATETIME NOT NULL,
    "ended" DATETIME,
    CONSTRAINT "game_session_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_session_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_session_round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_session_id" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "wager" INTEGER NOT NULL,
    "active" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "game_session_round_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "game_session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "result" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "occured" DATETIME NOT NULL,
    CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_name_key" ON "user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "game_name_key" ON "game"("name");
