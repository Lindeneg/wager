"use client";

import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {RoundNavigator} from "@/components/round-navigator";
import type {GameSessionData, Round, User} from "./types";

interface ActiveGameSectionProps {
    gameSession: GameSessionData;
    users: User[];
    activeRound: Round | null;
}

export function ActiveGameSection({
    gameSession,
    users,
    activeRound,
}: ActiveGameSectionProps) {
    const rounds = gameSession.rounds.map((r) => ({
        id: r.id,
        round: r.round,
        wager: r.wager,
        result: r.result,
        note: r.note,
        active: r.active,
    }));

    const initialIndex = activeRound
        ? rounds.findIndex((r) => r.id === activeRound.id)
        : -1;

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                    <SectionTitle>Game Session #{gameSession.id}</SectionTitle>
                    <Badge variant="outline">{gameSession.gameName}</Badge>
                </div>
            </div>

            <RoundNavigator
                rounds={rounds}
                users={users}
                totalResult={gameSession.result}
                initialIndex={initialIndex}
                showActiveIndicator
                isGameEnded={!!gameSession.ended}
            />
        </div>
    );
}
