"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {useApi} from "@/hooks/use-api";
import {ApiErrorDisplay} from "@/components/api-error";
import type {SessionState} from "./types";

interface SessionHeaderProps {
    sessionId: number;
    state: SessionState;
    hasGameSessions: boolean;
}

export function SessionHeader({
    sessionId,
    state,
    hasGameSessions,
}: SessionHeaderProps) {
    const router = useRouter();
    const {post, del, loading, error} = useApi();

    const canEndSession = state === "GAME_INACTIVE";
    const canCancelSession = state === "GAME_INACTIVE" && !hasGameSessions;
    const isEnded = state === "SESSION_ENDED";

    async function handleEndSession() {
        const result = await post(`/api/session/${sessionId}/end`);
        if (result.ok) {
            router.refresh();
        }
    }

    async function handleCancelSession() {
        const result = await del(`/api/session/${sessionId}`);
        if (result.ok) {
            router.push("/");
        }
    }

    return (
        <header className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Session #{sessionId}
                </h1>
                <Badge
                    variant={isEnded ? "secondary" : "default"}
                    className={isEnded ? "" : "bg-green-600"}>
                    {isEnded ? "Ended" : "Active"}
                </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
                {!isEnded && (
                    <>
                        <Button
                            onClick={handleEndSession}
                            disabled={!canEndSession || loading}>
                            End Session
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelSession}
                            disabled={!canCancelSession || loading}>
                            Cancel Session
                        </Button>
                    </>
                )}
                <Button variant="outline" onClick={() => router.push("/")}>
                    Go Back
                </Button>
            </div>
            </div>
            <ApiErrorDisplay error={error} />
        </header>
    );
}
