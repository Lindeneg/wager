"use client";

import {useEffect, useState} from "react";
import {useApi} from "@/hooks/use-api";
import {DataTable, type Column} from "@/components/data";
import {LoadingState} from "@/components/feedback";
import {GameRoundsViewer} from "./game-rounds-viewer";

interface TopWinner {
    userId: number;
    userName: string;
    netWinnings: number;
}

interface GameStats {
    gameId: number;
    gameName: string;
    totalRounds: number;
    totalWagered: number;
    avgWager: number;
    topWinners: TopWinner[];
}

interface User {
    id: number;
    name: string;
}

interface GameStatsTableProps {
    users: User[];
}

const columns: Column<GameStats>[] = [
    {
        key: "gameName",
        header: "Game",
    },
    {
        key: "totalRounds",
        header: "Rounds",
        className: "w-24 text-center",
    },
    {
        key: "avgWager",
        header: "Avg Wager",
        className: "w-28 text-center",
    },
    {
        key: "totalWagered",
        header: "Total Wagered",
        className: "w-32 text-center",
    },
    {
        key: "topWinners",
        header: "Top Winner",
        render(item) {
            if (item.topWinners.length === 0) {
                return <span className="text-zinc-400">-</span>;
            }
            const names = item.topWinners.map((w) => w.userName).join(", ");
            const winnings = item.topWinners[0].netWinnings;
            return (
                <span>
                    {names}{" "}
                    <span className="text-green-600 dark:text-green-400">
                        (+{winnings})
                    </span>
                </span>
            );
        },
    },
];

export function GameStatsTable({users}: GameStatsTableProps) {
    const {get, loading} = useApi();
    const [games, setGames] = useState<GameStats[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

    useEffect(() => {
        get<{games: GameStats[]}>("/api/stats/games").then((res) => {
            if (res.ok && res.data) {
                setGames(res.data.games);
            }
        });
    }, [get]);

    if (loading && games.length === 0) {
        return <LoadingState />;
    }

    if (selectedGameId !== null) {
        return (
            <GameRoundsViewer
                gameId={selectedGameId}
                users={users}
                onClose={() => setSelectedGameId(null)}
            />
        );
    }

    return (
        <DataTable
            columns={columns}
            data={games}
            emptyMessage="No game data yet"
            getRowKey={(g) => g.gameId}
            onRowClick={(g) => setSelectedGameId(g.gameId)}
        />
    );
}
