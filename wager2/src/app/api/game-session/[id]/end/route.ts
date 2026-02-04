import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {
    parseResultMap,
    stringifyResultMap,
    mergeResultMaps,
    resolveDebts,
} from "@/lib/result-map";

interface Params {
    params: Promise<{id: string}>;
}

export async function POST(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const gameSessionId = parseInt(id);

    if (isNaN(gameSessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const gameSession = await db.gameSession.findUnique({
        where: {id: gameSessionId},
        include: {
            session: {
                include: {participants: true},
            },
            rounds: true,
        },
    });

    if (!gameSession) {
        return HttpException.notFound().toNextResponse();
    }

    if (gameSession.ended) {
        return HttpException.unprocessable(
            "Game session has already ended"
        ).toNextResponse();
    }

    // Check no active round exists
    const activeRound = gameSession.rounds.find((r) => r.active === 1);
    if (activeRound) {
        return HttpException.unprocessable(
            "Cannot end game with active round"
        ).toNextResponse();
    }

    // End the game session
    await db.gameSession.update({
        where: {id: gameSessionId},
        data: {ended: new Date()},
    });

    // Update session result by merging game session result
    const userIds = gameSession.session.participants.map((p) => p.userId);
    const sessionResult = parseResultMap(gameSession.session.result);
    const gameSessionResult = parseResultMap(gameSession.result);

    const mergedResult = mergeResultMaps(
        userIds,
        sessionResult,
        gameSessionResult
    );
    resolveDebts(mergedResult);

    await db.session.update({
        where: {id: gameSession.sessionId},
        data: {result: stringifyResultMap(mergedResult)},
    });

    // Fetch updated game session
    const updated = await db.gameSession.findUnique({
        where: {id: gameSessionId},
        include: {
            game: true,
            rounds: {orderBy: {round: "asc"}},
        },
    });

    return NextResponse.json({
        id: updated!.id,
        gameId: updated!.gameId,
        gameName: updated!.game.name,
        result: updated!.result,
        started: updated!.started,
        ended: updated!.ended,
        rounds: updated!.rounds.map((r) => ({
            id: r.id,
            round: r.round,
            wager: r.wager,
            active: r.active === 1,
            result: r.result,
        })),
    });
}
