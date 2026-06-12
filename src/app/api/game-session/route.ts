import {NextRequest, NextResponse} from "next/server";
import z from "zod";
import {db} from "@/lib/db";
import HttpException from "@/lib/http-exception";
import {parseRequestBody} from "@/lib/parse";
import {createResultMap, stringifyResultMap} from "@/lib/result-map";
import {buildMixedNote, type MixedGameEntry} from "@/lib/mixed-game";

const createGameSessionSchema = z.object({
    sessionId: z.number().int().positive(),
    gameId: z.number().int().positive(),
    wager: z.number().int().positive(),
    note: z.string().optional(),
    mixedGameIds: z.array(z.number().int().positive()).min(3).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const parsed = await parseRequestBody(request, createGameSessionSchema);
        if (!parsed.ok) {
            return parsed.ctx.toNextResponse();
        }

        const {sessionId, gameId, wager, note, mixedGameIds} = parsed.data;

        // Check session exists and is active
        const session = await db.session.findUnique({
            where: {id: sessionId},
            include: {
                participants: true,
                gameSessions: {where: {ended: null}},
            },
        });

        if (!session) {
            return HttpException.notFound("Session not found").toNextResponse();
        }

        if (session.ended) {
            return HttpException.unprocessable(
                "Session has ended"
            ).toNextResponse();
        }

        if (session.gameSessions.length > 0) {
            return HttpException.unprocessable(
                "Session already has an active game"
            ).toNextResponse();
        }

        // Check game exists
        const game = await db.game.findUnique({where: {id: gameId}});
        if (!game) {
            return HttpException.notFound("Game not found").toNextResponse();
        }

        // Validate mixed game series and build the lineup note
        let mixedEntries: MixedGameEntry[] | null = null;
        let roundNote = note || null;
        if (mixedGameIds) {
            if (mixedGameIds.length % 2 === 0) {
                return HttpException.unprocessable(
                    "Mixed games must be an odd number of games"
                ).toNextResponse();
            }

            const mixedGames = await db.game.findMany({
                where: {id: {in: mixedGameIds}},
            });
            const gameNames = new Map(mixedGames.map((g) => [g.id, g.name]));

            if (!mixedGameIds.every((id) => gameNames.has(id))) {
                return HttpException.notFound(
                    "Mixed game not found"
                ).toNextResponse();
            }

            mixedEntries = mixedGameIds.map((id) => ({
                gameId: id,
                winnerId: null,
            }));
            roundNote = buildMixedNote(mixedEntries, gameNames, new Map());
        }

        const userIds = session.participants.map((p) => p.userId);
        const resultMap = createResultMap(userIds);

        // Create game session with first round
        const gameSession = await db.gameSession.create({
            data: {
                sessionId,
                gameId,
                result: stringifyResultMap(resultMap),
                started: new Date(),
                rounds: {
                    create: {
                        round: 1,
                        wager,
                        active: 1,
                        result: stringifyResultMap(resultMap),
                        note: roundNote,
                    },
                },
                ...(mixedEntries && {
                    mixedGame: {
                        create: {games: JSON.stringify(mixedEntries)},
                    },
                }),
            },
            include: {
                game: true,
                rounds: true,
            },
        });

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
                note: r.note,
            })),
        });
    } catch (err) {
        console.error("Game session create error:", err);
        return HttpException.internal().toNextResponse();
    }
}
