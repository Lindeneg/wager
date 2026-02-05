"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import {useApi} from "@/hooks/use-api";
import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {DataTable, PageSizeSelect, Pagination, type Column} from "@/components/data";
import {formatDate} from "@/lib/format";

interface Session {
    id: number;
    users: string;
    gameSessionCount: number;
    started: string;
    ended: string | null;
    isActive: boolean;
}

interface PaginationData {
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    prev: string | null;
}

interface SessionsResponse {
    sessions: Session[];
    pagination: PaginationData;
}

const columns: Column<Session>[] = [
    {
        key: "id",
        header: "ID",
        className: "w-16 text-center font-mono",
    },
    {
        key: "users",
        header: "Users",
    },
    {
        key: "gameSessionCount",
        header: "Games",
        className: "w-20 text-center",
    },
    {
        key: "started",
        header: "Started",
        render: (session) => formatDate(session.started),
    },
    {
        key: "ended",
        header: "Ended",
        render: (session) =>
            session.isActive ? (
                <Badge variant="default" className="bg-green-600">
                    Active
                </Badge>
            ) : (
                formatDate(session.ended!)
            ),
    },
];

export function SessionsTable() {
    const router = useRouter();
    const {get, loading} = useApi();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
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

    function handlePageSizeChange(size: number) {
        setPageSize(size);
        fetchSessions(`/api/session?limit=${size}&offset=0`);
    }

    function handleRowClick(session: Session) {
        router.push(`/session/${session.id}`);
    }

    const currentPage = pagination
        ? Math.floor(pagination.offset / pagination.limit) + 1
        : 1;
    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.limit)
        : 1;

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle>{pagination?.total ?? 0} Sessions</SectionTitle>
                <div className="flex items-center gap-4">
                    <PageSizeSelect
                        value={pageSize}
                        onChange={handlePageSizeChange}
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Page {currentPage} / {totalPages}
                    </span>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={sessions}
                loading={loading}
                emptyMessage="No sessions yet"
                onRowClick={handleRowClick}
                getRowKey={(s) => s.id}
                rowClassName={(s) =>
                    s.isActive ? "bg-green-50 dark:bg-green-950/30" : ""
                }
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={() => pagination?.prev && fetchSessions(pagination.prev)}
                onNext={() => pagination?.next && fetchSessions(pagination.next)}
                hasPrev={!!pagination?.prev}
                hasNext={!!pagination?.next}
                loading={loading}
            />
        </section>
    );
}
