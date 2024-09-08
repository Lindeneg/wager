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
    result  TEXT NOT NULL,
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
    started    TIMESTAMP NOT NULL,
    ended      TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES game (id)
);

CREATE TABLE IF NOT EXISTS game_session_round
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_session_id INTEGER   NOT NULL,
    result          TEXT      NOT NULL,
    round           INT       NOT NULL,
    wager           INT       NOT NULL,
    active          INT       NOT NULL DEFAULT 1,
    FOREIGN KEY (game_session_id) REFERENCES game_session (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS result
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    data            TEXT      NOT NULL
);

CREATE TABLE IF NOT EXISTS event
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER   NOT NULL,
    description TEXT      NOT NULL,
    occured     TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id)
);
