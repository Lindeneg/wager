"use client";

import {useEffect, useState} from "react";
import {useApi} from "@/hooks/use-api";
import {DataTable, type Column} from "@/components/data";
import {LoadingState} from "@/components/feedback";

interface GameStats {
    gameId: number;
    gameName: string;
    totalRounds: number;
    totalWagered: number;
    topWinner: {
        oderId: number;
        userName: string;
        netWinnings: number;
    } | null;
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
        key: "totalWagered",
        header: "Total Wagered",
        className: "w-32 text-center",
    },
    {
        key: "topWinner",
        header: "Top Winner",
        render(item) {
            if (!item.topWinner) {
                return <span className="text-zinc-400">-</span>;
            }
            return (
                <span>
                    {item.topWinner.userName}{" "}
                    <span className="text-green-600 dark:text-green-400">
                        (+{item.topWinner.netWinnings})
                    </span>
                </span>
            );
        },
    },
];

export function GameStatsTable() {
    const {get, loading} = useApi();
    const [games, setGames] = useState<GameStats[]>([]);

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

    return (
        <DataTable
            columns={columns}
            data={games}
            emptyMessage="No game data yet"
            getRowKey={(g) => g.gameId}
        />
    );
}
