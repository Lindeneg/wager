import {db} from "@/lib/db";
import {SectionTitle} from "@/components/typography";
import {BalanceCard} from "@/components/balance-card";
import {computeBestGames, type BestGame} from "@/lib/stats";
import {statsCache} from "@/lib/cache";
import type {BalanceBreakdown} from "@/lib/balance";

interface UserResult {
    id: number;
    name: string;
    totalOwes: number;
    totalOwed: number;
    netTotal: number;
    owesTo: BalanceBreakdown[];
    owedFrom: BalanceBreakdown[];
    bestGame: BestGame | null;
}

async function getResults(): Promise<UserResult[]> {
    const result = await db.result.findFirst({where: {id: 1}});
    const users = await db.user.findMany({select: {id: true, name: true}});

    // Get best games (cached)
    const bestGames = await statsCache.getOrSet(
        "stats:best-games",
        computeBestGames
    );
    const bestGameMap = new Map(bestGames.map((bg) => [bg.oderId, bg.bestGame]));

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const resultData = result?.data ? JSON.parse(result.data) : {};

    return users.map((user) => {
        const userOwes = resultData[user.id] || {};

        const owesTo: BalanceBreakdown[] = [];
        let totalOwes = 0;
        for (const [toId, amount] of Object.entries(userOwes)) {
            const numAmount = amount as number;
            if (numAmount > 0) {
                owesTo.push({
                    name: userMap.get(parseInt(toId)) || toId,
                    amount: numAmount,
                });
                totalOwes += numAmount;
            }
        }

        const owedFrom: BalanceBreakdown[] = [];
        let totalOwed = 0;
        for (const [fromId, fromOwes] of Object.entries(resultData)) {
            const owedAmount =
                (fromOwes as Record<string, number>)[user.id.toString()] || 0;
            if (owedAmount > 0) {
                owedFrom.push({
                    name: userMap.get(parseInt(fromId)) || fromId,
                    amount: owedAmount,
                });
                totalOwed += owedAmount;
            }
        }

        return {
            id: user.id,
            name: user.name,
            totalOwes,
            totalOwed,
            netTotal: totalOwed - totalOwes,
            owesTo,
            owedFrom,
            bestGame: bestGameMap.get(user.id) || null,
        };
    });
}

export async function ResultsSection() {
    const results = await getResults();

    return (
        <section>
            <SectionTitle className="mb-4">Current Results</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((user) => (
                    <BalanceCard
                        key={user.id}
                        name={user.name}
                        netTotal={user.netTotal}
                        totalOwed={user.totalOwed}
                        totalOwes={user.totalOwes}
                        owedFrom={user.owedFrom}
                        owesTo={user.owesTo}
                        subtitle={
                            user.bestGame
                                ? `Best: ${user.bestGame.gameName} (+${user.bestGame.netWinnings})`
                                : undefined
                        }
                    />
                ))}
            </div>
        </section>
    );
}
