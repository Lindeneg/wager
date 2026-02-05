"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {ResultCard} from "./result-card";
import {mergeResultMaps, parseResultMap} from "@/lib/result-map";
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
    const rounds = gameSession.rounds;
    // -1 means showing total, >= 0 means showing specific round index
    const [roundIndex, setRoundIndex] = useState(
        activeRound ? rounds.findIndex((r) => r.id === activeRound.id) : -1
    );

    const isShowingTotal = roundIndex === -1;
    const currentRound = isShowingTotal ? null : rounds[roundIndex];
    const isActiveRound = currentRound?.active || false;

    const canGoPrev = roundIndex === -1 || roundIndex > 0;
    const canGoNext = !isShowingTotal;

    const resultJson = isShowingTotal
        ? gameSession.result
        : currentRound?.result || "{}";
    const resultData = JSON.parse(resultJson);

    // Calculate running total for completed rounds up to current index
    const runningTotalData = (() => {
        if (isShowingTotal || !currentRound) return null;

        // Get all completed (non-active) rounds up to and including current index
        const roundsUpToCurrent = rounds
            .slice(0, roundIndex + 1)
            .filter((r) => !r.active);

        // If only one round or viewing an active round, no running total needed
        if (roundsUpToCurrent.length <= 1) return null;

        const userIds = users.map((u) => u.id);
        const resultMaps = roundsUpToCurrent.map((r) => parseResultMap(r.result));
        return mergeResultMaps(userIds, ...resultMaps);
    })();

    function handlePrev() {
        if (canGoPrev) {
            setRoundIndex((prev) =>
                prev === -1 ? rounds.length - 1 : prev - 1
            );
        }
    }

    function handleNext() {
        if (canGoNext) {
            setRoundIndex((prev) =>
                prev >= rounds.length - 1 ? -1 : prev + 1
            );
        }
    }

    const displayText = isShowingTotal
        ? "Total"
        : `Round ${currentRound?.round}`;

    const isActive = isShowingTotal ? !gameSession.ended : isActiveRound;

    function RoundInfo() {
        if (!isShowingTotal && currentRound) {
            return (
                <div className="space-y-1 text-center">
                    <p className="text-sm text-zinc-500">
                        Wager: {currentRound.wager}
                    </p>
                    {currentRound.note && (
                        <p className="text-sm italic text-zinc-500">
                            {currentRound.note}
                        </p>
                    )}
                </div>
            );
        }
        if (isShowingTotal) {
            return (
                <p className="text-center text-sm text-zinc-500">
                    Total Wager:{" "}
                    {rounds.reduce((acc, cur) => {
                        if (!cur.active) {
                            acc += cur.wager;
                        }
                        return acc;
                    }, 0)}
                </p>
            );
        }
    }

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2">
                    <SectionTitle>Game Session #{gameSession.id}</SectionTitle>
                    <Badge variant="outline">{gameSession.gameName}</Badge>
                </div>
            </div>

            {/* Round Navigation */}
            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={!canGoPrev}>
                    Prev
                </Button>
                <span className="min-w-24 text-center font-medium">
                    {displayText}
                    {isActive && (
                        <span className="ml-1 text-green-600 dark:text-green-400">
                            *
                        </span>
                    )}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!canGoNext}>
                    Next
                </Button>
            </div>

            <RoundInfo />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                    <ResultCard
                        key={user.id}
                        user={user}
                        resultData={resultData}
                        users={users}
                        compact
                    />
                ))}
            </div>

            {/* Running Total (when viewing a specific completed round) */}
            {runningTotalData && (
                <div className="space-y-3 border-t pt-4">
                    <h4 className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Running Total (Rounds 1-{currentRound?.round})
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {users.map((user) => (
                            <ResultCard
                                key={user.id}
                                user={user}
                                resultData={runningTotalData}
                                users={users}
                                compact
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
