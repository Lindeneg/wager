import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {parseMixedGames} from "@/lib/mixed-game";
import {PageLayout, PageContainer} from "@/components/layout";
import {SessionView} from "@/components/session";

interface Params {
    params: Promise<{id: string}>;
}

async function getSessionData(id: number) {
    const session = await db.session.findUnique({
        where: {id},
        include: {
            participants: {
                include: {user: {select: {id: true, name: true}}},
            },
            gameSessions: {
                include: {
                    game: true,
                    rounds: {orderBy: {round: "asc"}},
                    mixedGame: true,
                },
                orderBy: {started: "desc"},
            },
        },
    });

    if (!session) return null;

    const games = await db.game.findMany({orderBy: {name: "asc"}});

    return {session, games};
}

export default async function SessionPage({params}: Params) {
    const {id} = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
        notFound();
    }

    const data = await getSessionData(sessionId);

    if (!data) {
        notFound();
    }

    const {session, games} = data;

    const users = session.participants.map((p) => p.user);
    const gameSessions = session.gameSessions.map((gs) => ({
        id: gs.id,
        gameId: gs.gameId,
        gameName: gs.game.name,
        result: gs.result,
        started: gs.started,
        ended: gs.ended,
        mixed: gs.mixedGame ? parseMixedGames(gs.mixedGame.games) : null,
        rounds: gs.rounds.map((r) => ({
            id: r.id,
            round: r.round,
            wager: r.wager,
            active: r.active === 1,
            result: r.result,
            note: r.note,
        })),
    }));

    const activeGameSession = gameSessions.find((gs) => !gs.ended) || null;
    const activeRound =
        activeGameSession?.rounds.find((r) => r.active) || null;

    return (
        <PageLayout>
            <PageContainer>
                <SessionView
                    session={{
                        id: session.id,
                        result: session.result,
                        started: session.started.toISOString(),
                        ended: session.ended?.toISOString() || null,
                    }}
                    users={users}
                    games={games}
                    gameSessions={gameSessions}
                    activeGameSession={activeGameSession}
                    activeRound={activeRound}
                />
            </PageContainer>
        </PageLayout>
    );
}
