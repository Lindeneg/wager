"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {formatDateTime} from "@/lib/format";
import type {GameSessionData} from "./types";

interface GameSessionsTableProps {
    gameSessions: GameSessionData[];
}

export function GameSessionsTable({gameSessions}: GameSessionsTableProps) {
    if (gameSessions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <SectionTitle>Game History</SectionTitle>
            <div className="rounded-lg border bg-white dark:bg-zinc-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Game</TableHead>
                            <TableHead>Rounds</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Ended</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gameSessions.map((gs) => (
                            <TableRow key={gs.id}>
                                <TableCell className="font-medium">
                                    {gs.gameName}
                                </TableCell>
                                <TableCell>{gs.rounds.length}</TableCell>
                                <TableCell>
                                    {formatDateTime(gs.started)}
                                </TableCell>
                                <TableCell>
                                    {gs.ended ? formatDateTime(gs.ended) : "—"}
                                </TableCell>
                                <TableCell>
                                    {gs.ended ? (
                                        <Badge variant="secondary">Ended</Badge>
                                    ) : (
                                        <Badge className="bg-green-600">
                                            Active
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
