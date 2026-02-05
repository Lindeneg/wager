import {NextRequest, NextResponse} from "next/server";
import z from "zod";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {parseRequestBody} from "@/lib/parse";
import {createResultMap, stringifyResultMap} from "@/lib/result-map";

interface Params {
    params: Promise<{id: string}>;
}

const newRoundSchema = z.object({
    wager: z.number().int().positive(),
});

export async function POST(request: NextRequest, {params}: Params) {
    try {
        const {id} = await params;
        const gameSessionId = parseInt(id);

        if (isNaN(gameSessionId)) {
            return HttpException.malformedBody().toNextResponse();
        }

        const parsed = await parseRequestBody(request, newRoundSchema);
        if (!parsed.ok) {
            return parsed.ctx.toNextResponse();
        }

        const {wager} = parsed.data;

        const gameSession = await db.gameSession.findUnique({
            where: {id: gameSessionId},
            include: {
                session: {
                    include: {participants: true},
                },
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

        // Check no active round exists
        const activeRound = gameSession.rounds.find((r) => r.active === 1);
        if (activeRound) {
            return HttpException.unprocessable(
                "Already have an active round"
            ).toNextResponse();
        }

        const userIds = gameSession.session.participants.map((p) => p.userId);
        const resultMap = createResultMap(userIds);
        const nextRoundNumber = (gameSession.rounds[0]?.round || 0) + 1;

        const round = await db.gameSessionRound.create({
            data: {
                gameSessionId,
                round: nextRoundNumber,
                wager,
                active: 1,
                result: stringifyResultMap(resultMap),
            },
        });

        return NextResponse.json({
            id: round.id,
            round: round.round,
            wager: round.wager,
            active: round.active === 1,
            result: round.result,
        });
    } catch (err) {
        console.error("New round error:", err);
        return HttpException.internal().toNextResponse();
    }
}
