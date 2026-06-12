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
import {Badge} from "@/components/ui/badge";
import {useApi} from "@/hooks/use-api";
import {winsNeeded} from "@/lib/mixed-game";
import {ToggleSelect} from "@/components/toggle-select";
import {ApiErrorDisplay} from "@/components/api-error";
import type {Game, User, SessionState, GameSessionData, Round} from "./types";

const RANDOM_GAME = "random";
const MIXED_GAMES_NAME = "Mixed Games";
const MIXED_GAME_COUNTS = ["3", "5", "7", "9"];

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
    const [note, setNote] = useState("");
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [poolIds, setPoolIds] = useState(() => games.map((g) => g.id));
    const [rolledGameId, setRolledGameId] = useState<number | null>(null);
    const [mixedSlots, setMixedSlots] = useState<string[]>(["", "", ""]);

    const isRandomMode = selectedGame === RANDOM_GAME;
    const rolledGame =
        rolledGameId === null
            ? null
            : (games.find((g) => g.id === rolledGameId) ?? null);

    const mixedGamesGame =
        games.find((g) => g.name === MIXED_GAMES_NAME) ?? null;
    const isMixedSelected =
        mixedGamesGame !== null &&
        selectedGame === mixedGamesGame.id.toString();
    const mixedReady = mixedSlots.every((s) => s !== "");
    const activeMixed = activeGameSession?.mixed ?? null;

    const canStartGame = state === "GAME_INACTIVE";
    const canNewRound = state === "GAME_IN_PROGRESS";
    const canEndGame = state === "GAME_IN_PROGRESS";
    const canCancelGame = state === "ROUND_IN_PROGRESS";
    const canEndRound = state === "ROUND_IN_PROGRESS" && selectedWinner !== null;
    // mixed games settle automatically via game winners, no manual Who Won
    const showWhoWon = state === "ROUND_IN_PROGRESS" && !activeMixed;
    const showMixedWinners = state === "ROUND_IN_PROGRESS" && !!activeMixed;

    function togglePoolGame(id: number) {
        if (id === rolledGameId) setRolledGameId(null);
        setPoolIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    }

    function handleRoll() {
        // re-rolling never lands on the current game again
        const candidates = games.filter(
            (g) => poolIds.includes(g.id) && g.id !== rolledGameId
        );
        if (candidates.length === 0) return;
        const rolled =
            candidates[Math.floor(Math.random() * candidates.length)];
        setRolledGameId(rolled.id);
    }

    function handleMixedCountChange(value: string) {
        const n = parseInt(value);
        setMixedSlots((prev) => Array.from({length: n}, (_, i) => prev[i] || ""));
    }

    function setMixedSlot(index: number, value: string) {
        setMixedSlots((prev) =>
            prev.map((s, i) => (i === index ? value : s))
        );
    }

    function rollMixedSlot(index: number) {
        // roll among games not picked in any slot; never repeats the current pick
        const taken = new Set(mixedSlots.filter((s, i) => s && i !== index));
        const candidates = games.filter(
            (g) =>
                g.id !== mixedGamesGame?.id &&
                g.id.toString() !== mixedSlots[index] &&
                !taken.has(g.id.toString())
        );
        if (candidates.length === 0) return;
        const rolled =
            candidates[Math.floor(Math.random() * candidates.length)];
        setMixedSlot(index, rolled.id.toString());
    }

    async function handleMixedGameWinner(index: number, userId: number) {
        if (!activeGameSession || !activeMixed) return;
        const current = activeMixed[index]?.winnerId;
        const result = await post(
            `/api/game-session/${activeGameSession.id}/mixed-winner`,
            {index, winnerId: current === userId ? null : userId}
        );
        if (result.ok) router.refresh();
    }

    async function handleStartGame() {
        const gameId = isRandomMode ? rolledGameId : parseInt(selectedGame);
        if (gameId === null || Number.isNaN(gameId)) return;
        const result = await post("/api/game-session", {
            sessionId,
            gameId,
            wager: parseInt(wager),
            // mixed game notes are generated server-side from the series
            note: isMixedSelected ? undefined : note.trim() || undefined,
            mixedGameIds: isMixedSelected
                ? mixedSlots.map((s) => parseInt(s))
                : undefined,
        });
        if (result.ok) {
            setNote("");
            setSelectedGame(gameId.toString());
            setRolledGameId(null);
            router.refresh();
        }
    }

    async function handleNewRound() {
        if (!activeGameSession) return;
        const result = await post(
            `/api/game-session/${activeGameSession.id}/new-round`,
            {wager: parseInt(wager), note: note.trim() || undefined}
        );
        if (result.ok) {
            setNote("");
            router.refresh();
        }
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
                            {games.length > 1 && (
                                <SelectItem value={RANDOM_GAME}>
                                    Random
                                </SelectItem>
                            )}
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

                {!(isMixedSelected && canStartGame) && (
                    <div className="space-y-2">
                        <Label>Note (optional)</Label>
                        <Input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g., Payout reason"
                            className="w-48"
                            disabled={!!activeRound}
                        />
                    </div>
                )}
            </div>

            {/* Mixed Games Config */}
            {canStartGame && mixedGamesGame && isMixedSelected && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Mixed Games
                    </h3>
                    <div className="space-y-2">
                        <Label>Number of Games</Label>
                        <Select
                            value={mixedSlots.length.toString()}
                            onValueChange={handleMixedCountChange}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MIXED_GAME_COUNTS.map((n) => (
                                    <SelectItem key={n} value={n}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        {mixedSlots.map((slot, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Label className="w-16">Game {i + 1}</Label>
                                <Select
                                    value={slot}
                                    onValueChange={(v) => setMixedSlot(i, v)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Pick game" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {games
                                            .filter(
                                                (g) =>
                                                    g.id !== mixedGamesGame.id
                                            )
                                            .map((game) => (
                                                <SelectItem
                                                    key={game.id}
                                                    value={game.id.toString()}>
                                                    {game.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => rollMixedSlot(i)}>
                                    Roll
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Random Game Roll */}
            {canStartGame && isRandomMode && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Game Pool
                    </h3>
                    <ToggleSelect
                        items={games}
                        selectedIds={poolIds}
                        onToggle={togglePoolGame}
                        emptyMessage="No games available"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleRoll}
                            disabled={poolIds.length < 2}>
                            {rolledGame ? "Re-roll" : "Roll"}
                        </Button>
                        {rolledGame && (
                            <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                Rolled: <Badge>{rolledGame.name}</Badge>
                            </span>
                        )}
                        {poolIds.length < 2 && (
                            <p className="text-sm text-zinc-500">
                                Select at least two games to roll
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {canStartGame && (
                    <Button
                        onClick={handleStartGame}
                        disabled={
                            loading ||
                            (isRandomMode && !rolledGame) ||
                            (isMixedSelected && !mixedReady)
                        }>
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

            {/* Mixed Game Winners */}
            {showMixedWinners && activeMixed && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Game Winners
                    </h3>
                    {activeMixed.map((entry, i) => (
                        <div
                            key={i}
                            className="flex flex-wrap items-center gap-3">
                            <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400">
                                {games.find((g) => g.id === entry.gameId)
                                    ?.name || "Unknown"}
                            </span>
                            <ToggleSelect
                                items={users}
                                selectedIds={
                                    entry.winnerId !== null
                                        ? [entry.winnerId]
                                        : []
                                }
                                onToggle={(id) => handleMixedGameWinner(i, id)}
                                singleSelect
                            />
                        </div>
                    ))}
                    <p className="text-sm text-zinc-500">
                        First to {winsNeeded(activeMixed.length)} wins takes
                        the wager — the round and game end automatically.
                    </p>
                </div>
            )}

            {/* Who Won Section */}
            {showWhoWon && (
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        Who Won?
                    </h3>
                    <ToggleSelect
                        items={users}
                        selectedIds={selectedWinner !== null ? [selectedWinner] : []}
                        onToggle={(id) => setSelectedWinner(id)}
                        singleSelect
                        emptyMessage="No users available"
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
