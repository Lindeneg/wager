"use client";

import {useState} from "react";
import {SectionTitle} from "@/components/typography";
import {SessionHeader} from "./session-header";
import {ResultCard} from "./result-card";
import {ActiveGameSection} from "./active-game-section";
import {GameControls} from "./game-controls";
import {GameSessionsTable} from "./game-sessions-table";
import type {
    SessionData,
    User,
    Game,
    GameSessionData,
    Round,
    SessionState,
} from "./types";
import {getSessionState} from "./types";

interface SessionViewProps {
    session: SessionData;
    users: User[];
    games: Game[];
    gameSessions: GameSessionData[];
    activeGameSession: GameSessionData | null;
    activeRound: Round | null;
}

export function SessionView({
    session,
    users,
    games,
    gameSessions,
    activeGameSession,
    activeRound,
}: SessionViewProps) {
    const [selectedGameSession, setSelectedGameSession] =
        useState<GameSessionData | null>(null);
    const state: SessionState = getSessionState(
        session,
        activeGameSession,
        activeRound
    );

    const sessionResultData = JSON.parse(session.result || "{}");

    function onGameSessionTableClick(gameSession: GameSessionData) {
        if (
            activeGameSession?.id === gameSession.id ||
            selectedGameSession?.id === gameSession.id
        ) {
            return setSelectedGameSession(null);
        }
        setSelectedGameSession(gameSession);
    }

    function GameSection() {
        if (selectedGameSession) {
            return (
                <ActiveGameSection
                    gameSession={selectedGameSession}
                    users={users}
                    activeRound={null}
                />
            );
        }
        if (activeGameSession) {
            return (
                <ActiveGameSection
                    gameSession={activeGameSession}
                    users={users}
                    activeRound={activeRound}
                />
            );
        }
    }

    return (
        <div className="space-y-8">
            <SessionHeader
                sessionId={session.id}
                state={state}
                hasGameSessions={gameSessions.length > 0}
            />

            {/* Session Results */}
            <div className="space-y-4">
                <SectionTitle>Session Results</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <ResultCard
                            key={user.id}
                            user={user}
                            resultData={sessionResultData}
                            users={users}
                        />
                    ))}
                </div>
            </div>

            <GameSection />

            {!selectedGameSession && (
                <GameControls
                    sessionId={session.id}
                    state={state}
                    games={games}
                    users={users}
                    activeGameSession={activeGameSession}
                    activeRound={activeRound}
                />
            )}

            {/* Game History */}
            <GameSessionsTable
                gameSessions={gameSessions}
                selectedId={selectedGameSession?.id ?? null}
                onClick={onGameSessionTableClick}
            />
        </div>
    );
}
