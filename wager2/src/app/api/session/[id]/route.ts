import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

interface Params {
    params: Promise<{id: string}>;
}

export async function GET(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const session = await db.session.findUnique({
        where: {id: sessionId},
        include: {
            participants: {
                include: {user: {select: {id: true, name: true}}},
            },
            gameSessions: {
                include: {
                    game: true,
                    rounds: {orderBy: {round: "asc"}},
                },
                orderBy: {started: "desc"},
            },
        },
    });

    if (!session) {
        return HttpException.notFound().toNextResponse();
    }

    const users = session.participants.map((p) => p.user);
    const activeGameSession = session.gameSessions.find((gs) => !gs.ended);
    const activeRound = activeGameSession?.rounds.find((r) => r.active === 1);

    return NextResponse.json({
        id: session.id,
        result: session.result,
        started: session.started,
        ended: session.ended,
        users,
        gameSessions: session.gameSessions.map((gs) => ({
            id: gs.id,
            gameId: gs.gameId,
            gameName: gs.game.name,
            result: gs.result,
            started: gs.started,
            ended: gs.ended,
            rounds: gs.rounds.map((r) => ({
                id: r.id,
                round: r.round,
                wager: r.wager,
                active: r.active === 1,
                result: r.result,
            })),
        })),
        activeGameSession: activeGameSession
            ? {
                  id: activeGameSession.id,
                  gameId: activeGameSession.gameId,
                  gameName: activeGameSession.game.name,
              }
            : null,
        activeRound: activeRound
            ? {
                  id: activeRound.id,
                  round: activeRound.round,
                  wager: activeRound.wager,
              }
            : null,
    });
}

export async function DELETE(_request: NextRequest, {params}: Params) {
    const {id} = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
        return HttpException.malformedBody().toNextResponse();
    }

    const session = await db.session.findUnique({
        where: {id: sessionId},
        include: {gameSessions: true},
    });

    if (!session) {
        return HttpException.notFound().toNextResponse();
    }

    // Can only cancel if no game sessions
    if (session.gameSessions.length > 0) {
        return HttpException.unprocessable(
            "Cannot cancel session with game sessions"
        ).toNextResponse();
    }

    await db.session.delete({where: {id: sessionId}});

    return new NextResponse(null, {status: 204});
}
