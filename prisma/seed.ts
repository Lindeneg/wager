import "dotenv/config";
import bcrypt from "bcrypt";
import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {PrismaClient} from "../src/generated/prisma";
import {
    createResultMap,
    addWinner,
    resolveDebts,
    mergeResultMaps,
    stringifyResultMap,
    type ResultMap,
} from "../src/lib/result-map";
import {
    buildMixedNote,
    majorityWinner,
    type MixedGameEntry,
} from "../src/lib/mixed-game";

const USER_NAMES = ["Lars", "Fedte", "Yanis"];
const PASSWORD = "password";

const GAME_NAMES = [
    "Mixed Games",
    "Fifa",
    "Golf",
    "Poker",
    "Darts",
    "Pool",
    "Chess",
    "Backgammon",
    "Mario Kart",
    "Table Tennis",
];

const SESSION_COUNT = 15;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "",
});
const db = new PrismaClient({adapter});

function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
    const copy = [...arr];
    const picked: T[] = [];
    while (picked.length < count && copy.length > 0) {
        picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return picked;
}

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }

    console.log("wiping existing data");
    await db.session.deleteMany({});
    await db.event.deleteMany({});
    await db.result.deleteMany({});
    await db.game.deleteMany({});
    await db.user.deleteMany({});

    console.log("creating users");
    const password = await bcrypt.hash(PASSWORD, 10);
    const users = [];
    for (const name of USER_NAMES) {
        users.push(await db.user.create({data: {name, password}}));
    }
    const userNames = new Map(users.map((u) => [u.id, u.name]));

    console.log("creating games");
    const games = [];
    for (const name of GAME_NAMES) {
        games.push(await db.game.create({data: {name}}));
    }
    const gameNames = new Map(games.map((g) => [g.id, g.name]));
    const mixedGamesGame = games.find((g) => g.name === "Mixed Games")!;
    const regularGames = games.filter((g) => g.id !== mixedGamesGame.id);

    const allUserIds = users.map((u) => u.id);
    let globalResult = createResultMap(allUserIds);
    let gameSessionCount = 0;
    let mixedCount = 0;

    // Sessions spread over the last ~6 months, oldest first
    for (let i = 0; i < SESSION_COUNT; i++) {
        const participants =
            Math.random() < 0.4 ? users : pickMany(users, 2);
        const participantIds = participants.map((u) => u.id);

        const sessionStart = new Date(
            Date.now() -
                (SESSION_COUNT - i) * 12 * DAY +
                randInt(0, 6 * 24) * 60 * MINUTE
        );
        let cursor = new Date(sessionStart);

        const session = await db.session.create({
            data: {
                result: stringifyResultMap(createResultMap(participantIds)),
                started: sessionStart,
                participants: {
                    create: participantIds.map((userId) => ({userId})),
                },
            },
        });

        const gameSessionResults: ResultMap[] = [];
        const count = randInt(6, 9);

        for (let j = 0; j < count; j++) {
            const started = new Date(cursor);
            cursor = new Date(cursor.getTime() + randInt(20, 60) * MINUTE);
            const ended = new Date(cursor);
            cursor = new Date(cursor.getTime() + randInt(5, 15) * MINUTE);

            const gsResult = createResultMap(participantIds);
            const isMixed = Math.random() < 0.15;

            if (isMixed) {
                // Best-of-N series for a single big wager
                const seriesLength = pick([3, 5]);
                const seriesGames = pickMany(regularGames, seriesLength);
                const wager = pick([500, 1000, 1500]);

                const entries: MixedGameEntry[] = seriesGames.map((g) => ({
                    gameId: g.id,
                    winnerId: null,
                }));

                let seriesWinner: number | null = null;
                for (const entry of entries) {
                    entry.winnerId = pick(participantIds);
                    seriesWinner = majorityWinner(entries);
                    if (seriesWinner !== null) break;
                }

                // With an odd series and random winners a majority can
                // stay out of reach for 3 players; force a sweep then
                if (seriesWinner === null) {
                    seriesWinner = pick(participantIds);
                    for (const entry of entries) {
                        entry.winnerId = seriesWinner;
                    }
                }

                const roundResult = createResultMap(participantIds);
                addWinner(roundResult, seriesWinner, wager);
                addWinner(gsResult, seriesWinner, wager);
                resolveDebts(gsResult);

                await db.gameSession.create({
                    data: {
                        sessionId: session.id,
                        gameId: mixedGamesGame.id,
                        result: stringifyResultMap(gsResult),
                        started,
                        ended,
                        rounds: {
                            create: {
                                round: 1,
                                wager,
                                active: 0,
                                result: stringifyResultMap(roundResult),
                                note: buildMixedNote(
                                    entries,
                                    gameNames,
                                    userNames,
                                    true
                                ),
                            },
                        },
                        mixedGame: {
                            create: {games: JSON.stringify(entries)},
                        },
                    },
                });
                mixedCount++;
            } else {
                const game = pick(regularGames);
                const roundCount = randInt(1, 4);
                const rounds = [];

                for (let k = 0; k < roundCount; k++) {
                    const wager = randInt(1, 6) * 50;
                    const winnerId = pick(participantIds);
                    const roundResult = createResultMap(participantIds);
                    addWinner(roundResult, winnerId, wager);
                    addWinner(gsResult, winnerId, wager);
                    rounds.push({
                        round: k + 1,
                        wager,
                        active: 0,
                        result: stringifyResultMap(roundResult),
                        note: null,
                    });
                }
                resolveDebts(gsResult);

                await db.gameSession.create({
                    data: {
                        sessionId: session.id,
                        gameId: game.id,
                        result: stringifyResultMap(gsResult),
                        started,
                        ended,
                        rounds: {create: rounds},
                    },
                });
            }

            gameSessionResults.push(gsResult);
            gameSessionCount++;
        }

        const sessionResult = mergeResultMaps(
            participantIds,
            ...gameSessionResults
        );
        resolveDebts(sessionResult);

        await db.session.update({
            where: {id: session.id},
            data: {
                result: stringifyResultMap(sessionResult),
                ended: new Date(cursor.getTime() + 10 * MINUTE),
            },
        });

        // Mirror what POST /api/session/[id]/end does with the ledger
        globalResult = mergeResultMaps(allUserIds, globalResult, sessionResult);
        resolveDebts(globalResult);
    }

    await db.result.create({
        data: {data: stringifyResultMap(globalResult)},
    });

    console.log(
        `seeded ${users.length} users, ${games.length} games, ` +
            `${SESSION_COUNT} sessions, ${gameSessionCount} game sessions ` +
            `(${mixedCount} mixed)`
    );
    console.log(`all users have the password "${PASSWORD}"`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
