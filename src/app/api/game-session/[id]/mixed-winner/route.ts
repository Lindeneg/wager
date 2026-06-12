import {NextRequest, NextResponse} from "next/server";
import z from "zod";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {parseRequestBody} from "@/lib/parse";
import {
    parseResultMap,
    stringifyResultMap,
    addWinner,
    resolveDebts,
    mergeResultMaps,
} from "@/lib/result-map";
import {parseMixedGames, majorityWinner, buildMixedNote} from "@/lib/mixed-game";

interface Params {
    params: Promise<{id: string}>;
}

const mixedWinnerSchema = z.object({
    index: z.number().int().min(0),
    winnerId: z.number().int().positive().nullable(),
});

export async function POST(request: NextRequest, {params}: Params) {
    try {
        const {id} = await params;
        const gameSessionId = parseInt(id);

        if (isNaN(gameSessionId)) {
            return HttpException.malformedBody().toNextResponse();
        }

        const parsed = await parseRequestBody(request, mixedWinnerSchema);
        if (!parsed.ok) {
            return parsed.ctx.toNextResponse();
        }

        const {index, winnerId} = parsed.data;

        const gameSession = await db.gameSession.findUnique({
            where: {id: gameSessionId},
            include: {
                mixedGame: true,
                session: {
                    include: {
                        participants: {
                            include: {user: {select: {id: true, name: true}}},
                        },
                    },
                },
                rounds: true,
            },
        });

        if (!gameSession) {
            return HttpException.notFound().toNextResponse();
        }

        if (!gameSession.mixedGame) {
            return HttpException.unprocessable(
                "Not a mixed game session"
            ).toNextResponse();
        }

        if (gameSession.ended) {
            return HttpException.unprocessable(
                "Game session has ended"
            ).toNextResponse();
        }

        const entries = parseMixedGames(gameSession.mixedGame.games);

        if (index >= entries.length) {
            return HttpException.unprocessable(
                "Invalid game index"
            ).toNextResponse();
        }

        const participants = gameSession.session.participants;
        if (
            winnerId !== null &&
            !participants.some((p) => p.userId === winnerId)
        ) {
            return HttpException.unprocessable(
                "Winner is not a participant"
            ).toNextResponse();
        }

        entries[index].winnerId = winnerId;
        const seriesWinner = majorityWinner(entries);

        // Series undecided: just persist the recorded game winner
        if (seriesWinner === null) {
            await db.mixedGame.update({
                where: {id: gameSession.mixedGame.id},
                data: {games: JSON.stringify(entries)},
            });

            return NextResponse.json({settled: false, games: entries});
        }

        // Series decided: settle everything. The winner takes the round
        // wager, the round and game session end, and the note records the
        // series, e.g. "Fifa (C) | Golf (J) | Poker (C)"
        const activeRound = gameSession.rounds.find((r) => r.active === 1);
        if (!activeRound) {
            return HttpException.unprocessable(
                "No active round"
            ).toNextResponse();
        }

        const mixedGames = await db.game.findMany({
            where: {id: {in: entries.map((e) => e.gameId)}},
        });
        const gameNames = new Map(mixedGames.map((g) => [g.id, g.name]));
        const userNames = new Map(
            participants.map((p) => [p.user.id, p.user.name])
        );
        const note = buildMixedNote(entries, gameNames, userNames, true);

        const roundResult = parseResultMap(activeRound.result);
        addWinner(roundResult, seriesWinner, activeRound.wager);

        const gameSessionResult = parseResultMap(gameSession.result);
        addWinner(gameSessionResult, seriesWinner, activeRound.wager);
        resolveDebts(gameSessionResult);

        const userIds = participants.map((p) => p.userId);
        const sessionResult = mergeResultMaps(
            userIds,
            parseResultMap(gameSession.session.result),
            gameSessionResult
        );
        resolveDebts(sessionResult);

        await db.$transaction([
            db.mixedGame.update({
                where: {id: gameSession.mixedGame.id},
                data: {games: JSON.stringify(entries)},
            }),
            db.gameSessionRound.update({
                where: {id: activeRound.id},
                data: {
                    active: 0,
                    result: stringifyResultMap(roundResult),
                    note,
                },
            }),
            db.gameSession.update({
                where: {id: gameSessionId},
                data: {
                    result: stringifyResultMap(gameSessionResult),
                    ended: new Date(),
                },
            }),
            db.session.update({
                where: {id: gameSession.sessionId},
                data: {result: stringifyResultMap(sessionResult)},
            }),
        ]);

        return NextResponse.json({
            settled: true,
            winnerId: seriesWinner,
            games: entries,
        });
    } catch (err) {
        console.error("Mixed winner error:", err);
        return HttpException.internal().toNextResponse();
    }
}
