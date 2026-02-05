"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {LoadingState} from "@/components/feedback";
import {RoundNavigator} from "@/components/round-navigator";
import {useApi} from "@/hooks/use-api";
import {formatDate} from "@/lib/format";
import {mergeResultMaps, parseResultMap, stringifyResultMap} from "@/lib/result-map";

interface User {
    id: number;
    name: string;
}

interface GameRoundData {
    roundId: number;
    round: number;
    wager: number;
    result: string;
    note: string | null;
    gameSessionId: number;
    sessionId: number;
    sessionStarted: string;
}

interface GameRoundsResponse {
    gameId: number;
    gameName: string;
    rounds: GameRoundData[];
}

interface GameRoundsViewerProps {
    gameId: number;
    users: User[];
    onClose: () => void;
}

export function GameRoundsViewer({gameId, users, onClose}: GameRoundsViewerProps) {
    const {get, loading} = useApi();
    const [data, setData] = useState<GameRoundsResponse | null>(null);

    useEffect(() => {
        get<GameRoundsResponse>(`/api/stats/games/${gameId}/rounds`).then((res) => {
            if (res.ok && res.data) {
                setData(res.data);
            }
        });
    }, [get, gameId]);

    if (loading || !data) {
        return (
            <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
                <LoadingState />
            </div>
        );
    }

    const {rounds: apiRounds, gameName} = data;

    if (apiRounds.length === 0) {
        return (
            <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <SectionTitle>{gameName}</SectionTitle>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
                <p className="text-center text-zinc-500">No completed rounds</p>
            </div>
        );
    }

    // Transform API rounds to RoundNavigator format
    const rounds = apiRounds.map((r, idx) => ({
        id: r.roundId,
        round: idx + 1, // Sequential round number across all sessions
        wager: r.wager,
        result: r.result,
        note: r.note,
        active: false,
        // Extra data for renderRoundInfo
        sessionId: r.sessionId,
        sessionStarted: r.sessionStarted,
    }));

    // Calculate total result by merging all rounds
    const userIds = users.map((u) => u.id);
    const allMaps = apiRounds.map((r) => parseResultMap(r.result));
    const totalResult = stringifyResultMap(mergeResultMaps(userIds, ...allMaps));

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                    <SectionTitle>{gameName}</SectionTitle>
                    <Badge variant="outline">{rounds.length} rounds</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>

            <RoundNavigator
                rounds={rounds}
                users={users}
                totalResult={totalResult}
                renderRoundInfo={(round) => {
                    const r = round as typeof rounds[number];
                    return (
                        <p className="text-xs text-zinc-400">
                            {formatDate(r.sessionStarted)} •{" "}
                            <Link
                                href={`/session/${r.sessionId}`}
                                className="text-blue-600 hover:underline dark:text-blue-400">
                                View Session #{r.sessionId}
                            </Link>
                        </p>
                    );
                }}
            />
        </div>
    );
}
