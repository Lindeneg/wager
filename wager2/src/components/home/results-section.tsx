import {db} from "@/lib/db";
import {Card, CardContent} from "@/components/ui/card";
import {SectionTitle} from "@/components/typography";
import {computeBestGames, type BestGame} from "@/lib/stats";
import {statsCache} from "@/lib/cache";

interface UserResult {
    id: number;
    name: string;
    totalOwes: number;
    owes: Record<string, number>;
    totalOwed: number;
    owed: Record<string, number>;
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

        const owes: Record<string, number> = {};
        let totalOwes = 0;
        for (const [toId, amount] of Object.entries(userOwes)) {
            const numAmount = amount as number;
            if (numAmount > 0) {
                owes[userMap.get(parseInt(toId)) || toId] = numAmount;
                totalOwes += numAmount;
            }
        }

        const owed: Record<string, number> = {};
        let totalOwed = 0;
        for (const [fromId, fromOwes] of Object.entries(resultData)) {
            const owedAmount =
                (fromOwes as Record<string, number>)[user.id.toString()] || 0;
            if (owedAmount > 0) {
                owed[userMap.get(parseInt(fromId)) || fromId] = owedAmount;
                totalOwed += owedAmount;
            }
        }

        return {
            id: user.id,
            name: user.name,
            totalOwes,
            owes,
            totalOwed,
            owed,
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
                    <UserResultCard key={user.id} user={user} />
                ))}
            </div>
        </section>
    );
}

function UserResultCard({user}: {user: UserResult}) {
    const netTotal = user.totalOwed - user.totalOwes;
    const isPositive = netTotal > 0;
    const isNegative = netTotal < 0;
    const hasOwed = Object.entries(user.owed).length > 0;
    const hasOwes = Object.entries(user.owes).length > 0;

    return (
        <Card className="overflow-hidden">
            {/* Header with net total */}
            <div
                className={`px-4 py-3 ${
                    isPositive
                        ? "bg-green-50 dark:bg-green-950/40"
                        : isNegative
                          ? "bg-red-50 dark:bg-red-950/40"
                          : "bg-zinc-50 dark:bg-zinc-800/50"
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                            {user.name}
                        </span>
                        {user.bestGame && (
                            <p className="text-xs text-zinc-500">
                                Best: {user.bestGame.gameName} (+
                                {user.bestGame.netWinnings})
                            </p>
                        )}
                    </div>
                    <span
                        className={`text-2xl font-bold ${
                            isPositive
                                ? "text-green-600 dark:text-green-400"
                                : isNegative
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-zinc-500"
                        }`}>
                        {isPositive && "+"}
                        {netTotal}
                    </span>
                </div>
            </div>

            {/* Breakdown */}
            <CardContent className="grid grid-cols-2 gap-4 p-4">
                {/* Wins column */}
                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Wins
                        </span>
                    </div>
                    <p
                        className={`text-lg font-semibold ${
                            user.totalOwed > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-zinc-400"
                        }`}>
                        {user.totalOwed || 0}
                    </p>
                    {hasOwed && (
                        <ul className="mt-1.5 space-y-0.5">
                            {Object.entries(user.owed).map(([from, amount]) => (
                                <li
                                    key={from}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                        from
                                    </span>{" "}
                                    <span className="capitalize">{from}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Owes column */}
                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Owes
                        </span>
                    </div>
                    <p
                        className={`text-lg font-semibold ${
                            user.totalOwes > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-zinc-400"
                        }`}>
                        {user.totalOwes || 0}
                    </p>
                    {hasOwes && (
                        <ul className="mt-1.5 space-y-0.5">
                            {Object.entries(user.owes).map(([to, amount]) => (
                                <li
                                    key={to}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                        to
                                    </span>{" "}
                                    <span className="capitalize">{to}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
