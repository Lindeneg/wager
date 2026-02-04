import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

interface Params {
    params: Promise<{id: string}>;
}

export async function GET(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const gameSessionId = parseInt(id);

    if (isNaN(gameSessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const gameSession = await db.gameSession.findUnique({
        where: {id: gameSessionId},
        include: {
            game: true,
            rounds: {orderBy: {round: "asc"}},
        },
    });

    if (!gameSession) {
        return HttpException.notFound().toNextResponse();
    }

    return NextResponse.json({
        id: gameSession.id,
        gameId: gameSession.gameId,
        gameName: gameSession.game.name,
        result: gameSession.result,
        started: gameSession.started,
        ended: gameSession.ended,
        rounds: gameSession.rounds.map((r) => ({
            id: r.id,
            round: r.round,
            wager: r.wager,
            active: r.active === 1,
            result: r.result,
        })),
    });
}

export async function DELETE(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const gameSessionId = parseInt(id);

    if (isNaN(gameSessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const gameSession = await db.gameSession.findUnique({
        where: {id: gameSessionId},
        include: {rounds: true},
    });

    if (!gameSession) {
        return HttpException.notFound().toNextResponse();
    }

    if (gameSession.ended) {
        return HttpException.unprocessable(
            "Cannot cancel ended game session"
        ).toNextResponse();
    }

    // Can only cancel if there's only one round (the initial one)
    if (gameSession.rounds.length > 1) {
        return HttpException.unprocessable(
            "Cannot cancel game session with multiple rounds"
        ).toNextResponse();
    }

    await db.gameSession.delete({where: {id: gameSessionId}});

    return new NextResponse(null, {status: 204});
}
