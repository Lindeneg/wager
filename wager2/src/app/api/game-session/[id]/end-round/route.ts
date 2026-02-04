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
    userExists,
} from "@/lib/result-map";

interface Params {
    params: Promise<{id: string}>;
}

const endRoundSchema = z.object({
    winnerId: z.number().int().positive(),
});

export async function POST(request: NextRequest, {params}: Params) {
    const {id} = await params;
    const gameSessionId = parseInt(id);

    if (isNaN(gameSessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const parsed = await parseRequestBody(request, endRoundSchema);
    if (!parsed.ok) {
        return parsed.ctx.toNextResponse();
    }

    const {winnerId} = parsed.data;

    const gameSession = await db.gameSession.findUnique({
        where: {id: gameSessionId},
        include: {
            rounds: {orderBy: {round: "desc"}},
        },
    });

    if (!gameSession) {
        return HttpException.notFound().toNextResponse();
    }

    if (gameSession.ended) {
        return HttpException.unprocessable(
            "Game session has ended"
        ).toNextResponse();
    }

    const gameSessionResult = parseResultMap(gameSession.result);

    // Check winner is a participant
    if (!userExists(gameSessionResult, winnerId)) {
        return HttpException.unprocessable(
            "Winner is not a participant"
        ).toNextResponse();
    }

    // Find active round
    const activeRound = gameSession.rounds.find((r) => r.active === 1);
    if (!activeRound) {
        return HttpException.unprocessable("No active round").toNextResponse();
    }

    // Update round result
    const roundResult = parseResultMap(activeRound.result);
    addWinner(roundResult, winnerId, activeRound.wager);

    await db.gameSessionRound.update({
        where: {id: activeRound.id},
        data: {
            active: 0,
            result: stringifyResultMap(roundResult),
        },
    });

    // Update game session result
    addWinner(gameSessionResult, winnerId, activeRound.wager);
    resolveDebts(gameSessionResult);

    await db.gameSession.update({
        where: {id: gameSessionId},
        data: {
            result: stringifyResultMap(gameSessionResult),
        },
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
