CREATE TABLE IF NOT EXISTS user
(
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game
(
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS session
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    result  TEXT DEFAULT NULL,
    started TIMESTAMP NOT NULL,
    ended   TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS session_participant
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_session
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER   NOT NULL,
    game_id    INTEGER   NOT NULL,
    result     TEXT      NOT NULL,
    rounds     INT       NOT NULL DEFAULT 1,
    wager      INT       NOT NULL,
    started    TIMESTAMP NOT NULL,
    ended      TIMESTAMP          DEFAULT NULL,
    FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game (id)
);

CREATE TABLE IF NOT EXISTS event
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER   NOT NULL,
    description TEXT      NOT NULL,
    occured     TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id)
);
