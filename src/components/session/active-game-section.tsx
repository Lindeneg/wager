"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {SectionTitle} from "@/components/typography";
import {ResultCard} from "./result-card";
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

    function RoundWager() {
        if (!isShowingTotal && currentRound) {
            return (
                <p className="text-center text-sm text-zinc-500">
                    Wager: {currentRound.wager}
                </p>
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

            <RoundWager />

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
        </div>
    );
}
