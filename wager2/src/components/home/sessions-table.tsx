"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import {useApi} from "@/hooks/use-api";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Session {
    id: number;
    users: string;
    gameSessionCount: number;
    started: string;
    ended: string | null;
    isActive: boolean;
}

interface Pagination {
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    prev: string | null;
}

interface SessionsResponse {
    sessions: Session[];
    pagination: Pagination;
}

const PAGE_SIZES = [10, 20, 50, 100];

export function SessionsTable() {
    const router = useRouter();
    const {get, loading} = useApi();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [pageSize, setPageSize] = useState(10);

    const fetchSessions = useCallback(
        async (url: string = `/api/session?limit=${pageSize}&offset=0`) => {
            const result = await get<SessionsResponse>(url);
            if (result.ok && result.data) {
                setSessions(result.data.sessions);
                setPagination(result.data.pagination);
            }
        },
        [get, pageSize]
    );

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    function handlePageSizeChange(value: string) {
        const newSize = parseInt(value);
        setPageSize(newSize);
        fetchSessions(`/api/session?limit=${newSize}&offset=0`);
    }

    function handlePrev() {
        if (pagination?.prev) {
            fetchSessions(pagination.prev);
        }
    }

    function handleNext() {
        if (pagination?.next) {
            fetchSessions(pagination.next);
        }
    }

    function handleRowClick(sessionId: number) {
        router.push(`/session/${sessionId}`);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const currentPage = pagination
        ? Math.floor(pagination.offset / pagination.limit) + 1
        : 1;
    const maxPage = pagination
        ? Math.ceil(pagination.total / pagination.limit)
        : 1;

    return (
        <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {pagination?.total ?? 0} Sessions
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="page-size"
                            className="text-sm text-zinc-600 dark:text-zinc-400">
                            Page Size
                        </label>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZES.map((size) => (
                                    <SelectItem
                                        key={size}
                                        value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Page {currentPage} / {maxPage}
                    </span>
                </div>
            </div>

            <div className="rounded-lg border bg-white dark:bg-zinc-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Users</TableHead>
                            <TableHead className="w-24 text-center">
                                Games
                            </TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Ended</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-zinc-500">
                                    No sessions yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => (
                                <TableRow
                                    key={session.id}
                                    onClick={() => handleRowClick(session.id)}
                                    className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                        session.isActive
                                            ? "bg-green-50 dark:bg-green-950/30"
                                            : ""
                                    }`}>
                                    <TableCell className="font-mono">
                                        {session.id}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {session.users}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {session.gameSessionCount}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(session.started)}
                                    </TableCell>
                                    <TableCell>
                                        {session.isActive ? (
                                            <Badge
                                                variant="default"
                                                className="bg-green-600">
                                                Active
                                            </Badge>
                                        ) : (
                                            formatDate(session.ended!)
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex justify-between">
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={!pagination?.prev || loading}>
                    Previous
                </Button>
                <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={!pagination?.next || loading}>
                    Next
                </Button>
            </div>
        </section>
    );
}
