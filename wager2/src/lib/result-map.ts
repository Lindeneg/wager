// ResultMap is a structure where each user ID maps to an object of user IDs they owe money to
// Example: { "1": { "2": 100, "3": 50 }, "2": { "1": 0, "3": 25 }, "3": { "1": 0, "2": 0 } }
// This means user 1 owes user 2 $100 and user 3 $50

export type ResultOwe = Record<string, number>;
export type ResultMap = Record<string, ResultOwe>;

export function createResultMap(userIds: number[]): ResultMap {
    const map: ResultMap = {};
    for (const id of userIds) {
        const owe: ResultOwe = {};
        for (const otherId of userIds) {
            if (otherId !== id) {
                owe[otherId.toString()] = 0;
            }
        }
        map[id.toString()] = owe;
    }
    return map;
}

export function parseResultMap(json: string): ResultMap {
    try {
        return JSON.parse(json) as ResultMap;
    } catch {
        return {};
    }
}

export function stringifyResultMap(map: ResultMap): string {
    return JSON.stringify(map);
}

// Add winner to the result map
// Each loser owes the winner an equal share of the wager
export function addWinner(map: ResultMap, winnerId: number, wager: number): void {
    const winnerKey = winnerId.toString();
    const numLosers = Object.keys(map).length - 1;
    if (numLosers <= 0) return;

    const amountOwed = Math.floor(wager / numLosers);

    for (const [owerKey, owes] of Object.entries(map)) {
        if (owerKey === winnerKey) continue;
        owes[winnerKey] = (owes[winnerKey] || 0) + amountOwed;
    }
}

// Resolve mutual debts between users
// If A owes B $100 and B owes A $30, resolve to A owes B $70 and B owes A $0
export function resolveDebts(map: ResultMap): void {
    for (const [owerKey, owesTo] of Object.entries(map)) {
        for (const [owedKey, oweAmount] of Object.entries(owesTo)) {
            const owedAmount = map[owedKey]?.[owerKey] || 0;

            if (oweAmount >= owedAmount) {
                owesTo[owedKey] = oweAmount - owedAmount;
                if (map[owedKey]) {
                    map[owedKey][owerKey] = 0;
                }
            } else {
                owesTo[owedKey] = 0;
                if (map[owedKey]) {
                    map[owedKey][owerKey] = owedAmount - oweAmount;
                }
            }
        }
    }
}

// Merge multiple result maps together
// Adds all owed amounts from each source map into the target
export function mergeResultMaps(
    userIds: number[],
    ...maps: ResultMap[]
): ResultMap {
    const result = createResultMap(userIds);

    for (const map of maps) {
        for (const [owerKey, owesTo] of Object.entries(map)) {
            for (const [owedKey, amount] of Object.entries(owesTo)) {
                if (result[owerKey] && result[owerKey][owedKey] !== undefined) {
                    result[owerKey][owedKey] += amount;
                }
            }
        }
    }

    return result;
}

// Check if a user exists in the result map
export function userExists(map: ResultMap, userId: number): boolean {
    return userId.toString() in map;
}
