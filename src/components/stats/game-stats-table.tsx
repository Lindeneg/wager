"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {useApi} from "@/hooks/use-api";
import {
    DataTable,
    type Column,
    type SortDirection,
} from "@/components/data";
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
    selectedGameId: number | null;
}

// Sort value per column; Top Winner sorts by the winner's net winnings
const sortValues: Record<string, (g: GameStats) => string | number> = {
    gameName: (g) => g.gameName,
    totalRounds: (g) => g.totalRounds,
    avgWager: (g) => g.avgWager,
    totalWagered: (g) => g.totalWagered,
    topWinners: (g) => g.topWinners[0]?.netWinnings ?? -Infinity,
};

const columns: Column<GameStats>[] = [
    {
        key: "gameName",
        header: "Game",
        sortable: true,
    },
    {
        key: "totalRounds",
        header: "Rounds",
        className: "w-24 text-center",
        sortable: true,
    },
    {
        key: "avgWager",
        header: "Avg Wager",
        className: "w-28 text-center",
        sortable: true,
    },
    {
        key: "totalWagered",
        header: "Total Wagered",
        className: "w-32 text-center",
        sortable: true,
    },
    {
        key: "topWinners",
        header: "Top Winner",
        sortable: true,
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

export function GameStatsTable({users, selectedGameId}: GameStatsTableProps) {
    const router = useRouter();
    const {get, loading} = useApi();
    const [games, setGames] = useState<GameStats[]>([]);
    const [sort, setSort] = useState<{
        key: string;
        dir: SortDirection;
    } | null>(null);

    useEffect(() => {
        get<{games: GameStats[]}>("/api/stats/games").then((res) => {
            if (res.ok && res.data) {
                setGames(res.data.games);
            }
        });
    }, [get]);

    const sortedGames = useMemo(() => {
        if (!sort) return games;
        const value = sortValues[sort.key];
        const factor = sort.dir === "asc" ? 1 : -1;
        return [...games].sort((a, b) => {
            const va = value(a);
            const vb = value(b);
            if (typeof va === "string" && typeof vb === "string") {
                return va.localeCompare(vb) * factor;
            }
            return ((va as number) - (vb as number)) * factor;
        });
    }, [games, sort]);

    function handleSortChange(key: string) {
        setSort((prev) => {
            if (prev?.key === key) {
                return {key, dir: prev.dir === "asc" ? "desc" : "asc"};
            }
            // text sorts A-Z first, numbers biggest first
            return {key, dir: key === "gameName" ? "asc" : "desc"};
        });
    }

    if (loading && games.length === 0) {
        return <LoadingState />;
    }

    if (selectedGameId !== null) {
        return <GameRoundsViewer gameId={selectedGameId} users={users} />;
    }

    return (
        <DataTable
            columns={columns}
            data={sortedGames}
            emptyMessage="No game data yet"
            getRowKey={(g) => g.gameId}
            onRowClick={(g) => router.push(`/stats?game=${g.gameId}`)}
            sortKey={sort?.key ?? null}
            sortDir={sort?.dir}
            onSortChange={handleSortChange}
        />
    );
}
