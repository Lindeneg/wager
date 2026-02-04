export interface User {
    id: number;
    name: string;
}

export interface Game {
    id: number;
    name: string;
}

export interface Round {
    id: number;
    round: number;
    wager: number;
    active: boolean;
    result: string;
}

export interface GameSessionData {
    id: number;
    gameId: number;
    gameName: string;
    result: string;
    started: string;
    ended: string | null;
    rounds: Round[];
}

export interface SessionData {
    id: number;
    result: string;
    started: string;
    ended: string | null;
}

export type SessionState =
    | "SESSION_ENDED"
    | "GAME_INACTIVE"
    | "ROUND_IN_PROGRESS"
    | "GAME_IN_PROGRESS";

export function getSessionState(
    session: SessionData,
    activeGameSession: GameSessionData | null,
    activeRound: Round | null
): SessionState {
    if (session.ended) return "SESSION_ENDED";
    if (!activeGameSession) return "GAME_INACTIVE";
    if (activeRound) return "ROUND_IN_PROGRESS";
    return "GAME_IN_PROGRESS";
}
