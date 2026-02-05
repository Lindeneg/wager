"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {useApi} from "@/hooks/use-api";
import {UserToggleSelect} from "@/components/user-toggle-select";
import {ApiErrorDisplay} from "@/components/api-error";
import type {Game, User, SessionState, GameSessionData, Round} from "./types";

interface GameControlsProps {
    sessionId: number;
    state: SessionState;
    games: Game[];
    users: User[];
    activeGameSession: GameSessionData | null;
    activeRound: Round | null;
}

export function GameControls({
    sessionId,
    state,
    games,
    users,
    activeGameSession,
    activeRound,
}: GameControlsProps) {
    const router = useRouter();
    const {post, del, loading, error} = useApi();

    const [selectedGame, setSelectedGame] = useState(
        activeGameSession?.gameId.toString() || games[0]?.id.toString() || ""
    );
    const [wager, setWager] = useState(activeRound?.wager.toString() || "100");
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);

    const canStartGame = state === "GAME_INACTIVE";
    const canNewRound = state === "GAME_IN_PROGRESS";
    const canEndGame = state === "GAME_IN_PROGRESS";
    const canCancelGame = state === "ROUND_IN_PROGRESS";
    const canEndRound = state === "ROUND_IN_PROGRESS" && selectedWinner !== null;
    const showWhoWon = state === "ROUND_IN_PROGRESS";

    async function handleStartGame() {
        const result = await post("/api/game-session", {
            sessionId,
            gameId: parseInt(selectedGame),
            wager: parseInt(wager),
        });
        if (result.ok) router.refresh();
    }

    async function handleNewRound() {
        if (!activeGameSession) return;
        const result = await post(
            `/api/game-session/${activeGameSession.id}/new-round`,
            {wager: parseInt(wager)}
        );
        if (result.ok) router.refresh();
    }

    async function handleEndRound() {
        if (!activeGameSession || selectedWinner === null) return;
        const result = await post(
            `/api/game-session/${activeGameSession.id}/end-round`,
            {winnerId: selectedWinner}
        );
        if (result.ok) {
            setSelectedWinner(null);
            router.refresh();
        }
    }

    async function handleEndGame() {
        if (!activeGameSession) return;
        const result = await post(
            `/api/game-session/${activeGameSession.id}/end`
        );
        if (result.ok) router.refresh();
    }

    async function handleCancelGame() {
        if (!activeGameSession) return;
        const result = await del(`/api/game-session/${activeGameSession.id}`);
        if (result.ok) router.refresh();
    }

    if (state === "SESSION_ENDED") return null;

    return (
        <div className="space-y-6 rounded-lg border bg-white p-6 dark:bg-zinc-900">
            <ApiErrorDisplay error={error} />

            {/* Game Config */}
            <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                    <Label>Game</Label>
                    <Select
                        value={selectedGame}
                        onValueChange={setSelectedGame}
                        disabled={!!activeGameSession}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {games.map((game) => (
                                <SelectItem
                                    key={game.id}
                                    value={game.id.toString()}>
                                    {game.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Wager</Label>
                    <Input
                        type="number"
                        value={wager}
                        onChange={(e) => setWager(e.target.value)}
                        className="w-28"
                        disabled={!!activeRound}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {canStartGame && (
                    <Button onClick={handleStartGame} disabled={loading}>
                        Start Game
                    </Button>
                )}
                {canNewRound && (
                    <Button onClick={handleNewRound} disabled={loading}>
                        New Round
                    </Button>
                )}
                {canEndGame && (
                    <Button
                        variant="secondary"
                        onClick={handleEndGame}
                        disabled={loading}>
                        End Game
                    </Button>
                )}
                {canCancelGame && (
                    <Button
                        variant="destructive"
                        onClick={handleCancelGame}
                        disabled={loading}>
                        Cancel Game
                    </Button>
                )}
            </div>

            {/* Who Won Section */}
            {showWhoWon && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Who Won?
                    </h3>
                    <UserToggleSelect
                        users={users}
                        selectedIds={selectedWinner !== null ? [selectedWinner] : []}
                        onToggle={(id) => setSelectedWinner(id)}
                        singleSelect
                    />
                    <Button
                        onClick={handleEndRound}
                        disabled={!canEndRound || loading}
                        className="mt-2">
                        End Round
                    </Button>
                </div>
            )}
        </div>
    );
}
