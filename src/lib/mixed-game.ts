// A mixed game is a "best of N" series of individual games played for a
// single wager within one game session round. The series is stored as an
// ordered JSON array on the mixed_game table.
// Example: [{"gameId": 3, "winnerId": 1}, {"gameId": 7, "winnerId": null}]

export interface MixedGameEntry {
    gameId: number;
    winnerId: number | null;
}

export function parseMixedGames(json: string): MixedGameEntry[] {
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? (parsed as MixedGameEntry[]) : [];
    } catch {
        return [];
    }
}

// Wins required to take a best-of-N series
export function winsNeeded(totalGames: number): number {
    return Math.floor(totalGames / 2) + 1;
}

// Returns the user holding a majority of game wins, or null if undecided
export function majorityWinner(entries: MixedGameEntry[]): number | null {
    const needed = winsNeeded(entries.length);
    const wins: Record<number, number> = {};

    for (const entry of entries) {
        if (entry.winnerId === null) continue;
        wins[entry.winnerId] = (wins[entry.winnerId] || 0) + 1;
        if (wins[entry.winnerId] >= needed) {
            return entry.winnerId;
        }
    }
    return null;
}

// Build the round note, e.g. "Fifa (Lars) | Golf (Yanis) | Poker (Lars)"
// with the winner's name. Games without a winner are listed bare, or
// dropped entirely when onlyDecided is set (a 2-0 series skips game 3).
export function buildMixedNote(
    entries: MixedGameEntry[],
    gameNames: Map<number, string>,
    userNames: Map<number, string>,
    onlyDecided = false
): string {
    const parts: string[] = [];

    for (const entry of entries) {
        const gameName = gameNames.get(entry.gameId) || "Unknown";
        const winnerName =
            entry.winnerId === null ? null : userNames.get(entry.winnerId);

        if (winnerName) {
            parts.push(`${gameName} (${winnerName})`);
        } else if (!onlyDecided) {
            parts.push(gameName);
        }
    }

    return parts.join(" | ");
}
