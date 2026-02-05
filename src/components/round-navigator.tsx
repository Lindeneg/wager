"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {ResultCard} from "@/components/session/result-card";
import {mergeResultMaps, parseResultMap} from "@/lib/result-map";

interface User {
    id: number;
    name: string;
}

interface RoundData {
    id: number;
    round: number;
    wager: number;
    result: string;
    note: string | null;
    active?: boolean;
}

interface RoundNavigatorProps {
    rounds: RoundData[];
    users: User[];
    totalResult: string;
    initialIndex?: number; // -1 for total view
    showActiveIndicator?: boolean;
    isGameEnded?: boolean;
    renderRoundInfo?: (round: RoundData, index: number) => React.ReactNode;
}

export function RoundNavigator({
    rounds,
    users,
    totalResult,
    initialIndex = -1,
    showActiveIndicator = false,
    isGameEnded = true,
    renderRoundInfo,
}: RoundNavigatorProps) {
    const [roundIndex, setRoundIndex] = useState(initialIndex);

    const isShowingTotal = roundIndex === -1;
    const currentRound = isShowingTotal ? null : rounds[roundIndex];
    const isActiveRound = currentRound?.active || false;

    const canGoPrev = roundIndex === -1 || roundIndex > 0;
    const canGoNext = !isShowingTotal;

    const resultJson = isShowingTotal
        ? totalResult
        : currentRound?.result || "{}";
    const resultData = JSON.parse(resultJson);

    // Calculate running total for completed rounds up to current index
    const runningTotalData = (() => {
        if (isShowingTotal || !currentRound) return null;

        const roundsUpToCurrent = rounds
            .slice(0, roundIndex + 1)
            .filter((r) => !r.active);

        if (roundsUpToCurrent.length <= 1) return null;

        const userIds = users.map((u) => u.id);
        const resultMaps = roundsUpToCurrent.map((r) => parseResultMap(r.result));
        return mergeResultMaps(userIds, ...resultMaps);
    })();

    function handlePrev() {
        if (canGoPrev) {
            setRoundIndex((prev) => (prev === -1 ? rounds.length - 1 : prev - 1));
        }
    }

    function handleNext() {
        if (canGoNext) {
            setRoundIndex((prev) => (prev >= rounds.length - 1 ? -1 : prev + 1));
        }
    }

    const displayText = isShowingTotal ? "Total" : `Round ${currentRound?.round}`;
    const isActive = isShowingTotal ? !isGameEnded : isActiveRound;

    const totalWager = rounds.reduce((acc, cur) => {
        if (!cur.active) acc += cur.wager;
        return acc;
    }, 0);

    return (
        <div className="space-y-4">
            {/* Navigation */}
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
                    {showActiveIndicator && isActive && (
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

            {/* Round Info */}
            <div className="space-y-1 text-center">
                {isShowingTotal ? (
                    <p className="text-sm text-zinc-500">Total Wager: {totalWager}</p>
                ) : (
                    <>
                        <p className="text-sm text-zinc-500">
                            Wager: {currentRound!.wager}
                        </p>
                        {currentRound!.note && (
                            <p className="text-sm italic text-zinc-500">
                                {currentRound!.note}
                            </p>
                        )}
                        {renderRoundInfo?.(currentRound!, roundIndex)}
                    </>
                )}
            </div>

            {/* Result Cards */}
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

            {/* Running Total */}
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
