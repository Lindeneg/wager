import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";

interface Params {
    params: Promise<{id: string}>;
}

export interface GameRoundData {
    roundId: number;
    round: number;
    wager: number;
    result: string;
    note: string | null;
    gameSessionId: number;
    sessionId: number;
    sessionStarted: string;
}

export async function GET(request: NextRequest, {params}: Params) {
    try {
        const {id} = await params;
        const gameId = parseInt(id);

        if (isNaN(gameId)) {
            return HttpException.malformedBody().toNextResponse();
        }

        const game = await db.game.findUnique({where: {id: gameId}});
        if (!game) {
            return HttpException.notFound("Game not found").toNextResponse();
        }

        // Get all completed rounds for this game
        const gameSessions = await db.gameSession.findMany({
            where: {
                gameId,
                ended: {not: null},
            },
            include: {
                session: {
                    select: {id: true, started: true},
                },
                rounds: {
                    where: {active: 0},
                    orderBy: {round: "asc"},
                },
            },
            orderBy: {started: "asc"},
        });

        // Flatten rounds with session info
        const rounds: GameRoundData[] = [];
        for (const gs of gameSessions) {
            for (const round of gs.rounds) {
                rounds.push({
                    roundId: round.id,
                    round: round.round,
                    wager: round.wager,
                    result: round.result,
                    note: round.note,
                    gameSessionId: gs.id,
                    sessionId: gs.session.id,
                    sessionStarted: gs.session.started.toISOString(),
                });
            }
        }

        return NextResponse.json({
            gameId: game.id,
            gameName: game.name,
            rounds,
        });
    } catch (err) {
        console.error("Game rounds error:", err);
        return HttpException.internal().toNextResponse();
    }
}
