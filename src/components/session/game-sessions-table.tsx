"use client";

import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {formatDateTime, formatDuration} from "@/lib/format";
import {DataTable, type Column} from "@/components/data";
import type {GameSessionData} from "./types";

interface GameSessionsTableProps {
    gameSessions: GameSessionData[];
    selectedId: number | null;
    onClick: (gameSession: GameSessionData) => void;
}

const columns: Column<GameSessionData>[] = [
    {
        key: "gameName",
        header: "Game",
    },
    {
        key: "rounds",
        header: "Rounds",
        className: "w-20 text-center",
        render(item) {
            return item.rounds.length;
        },
    },
    {
        key: "started",
        header: "Started",
        render(item) {
            return formatDateTime(item.started);
        },
    },
    {
        key: "ended",
        header: "Ended",
        render(item) {
            if (item.ended) return formatDateTime(item.ended);
            return <Badge className="bg-green-600">Active</Badge>;
        },
    },
    {
        key: "duration",
        header: "Duration",
        className: "w-28",
        render(item) {
            if (item.ended) return formatDuration(item.started, item.ended);
            return <span className="text-zinc-400">-</span>;
        },
    },
];

export function GameSessionsTable({
    gameSessions,
    selectedId,
    onClick,
}: GameSessionsTableProps) {
    if (gameSessions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <SectionTitle>Game History</SectionTitle>

            <DataTable
                columns={columns}
                data={gameSessions}
                emptyMessage="No sessions yet"
                onRowClick={onClick}
                getRowKey={(s) => s.id}
                rowClassName={(s) => {
                    if (
                        (selectedId !== null && s.id === selectedId) ||
                        (selectedId === null && !s.ended)
                    ) {
                        return "bg-green-50 dark:bg-green-950/30";
                    }
                    return "";
                }}
            />
        </div>
    );
}
