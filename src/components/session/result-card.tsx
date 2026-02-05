import {Card, CardContent} from "@/components/ui/card";
import type {User} from "./types";

interface ResultCardProps {
    user: User;
    resultData: Record<string, Record<string, number>>;
    users: User[];
    compact?: boolean;
}

export function ResultCard({user, resultData, users, compact}: ResultCardProps) {
    const userMap = new Map(users.map((u) => [u.id.toString(), u.name]));
    const owesObj = resultData[user.id.toString()] || {};

    const totalOwes = Object.values(owesObj).reduce((acc, cur) => acc + cur, 0);
    const totalOwed = Object.entries(resultData).reduce((acc, [key, value]) => {
        if (key === user.id.toString() || !value[user.id.toString()])
            return acc;
        return acc + value[user.id.toString()];
    }, 0);

    const netTotal = totalOwed - totalOwes;
    const isPositive = netTotal > 0;
    const isNegative = netTotal < 0;

    const owedFrom = Object.entries(resultData)
        .filter(
            ([key, value]) =>
                key !== user.id.toString() && value[user.id.toString()] > 0
        )
        .map(([key, value]) => ({
            name: userMap.get(key) || key,
            amount: value[user.id.toString()],
        }));

    const owesTo = Object.entries(owesObj)
        .filter(([, amount]) => amount > 0)
        .map(([key, amount]) => ({
            name: userMap.get(key) || key,
            amount,
        }));

    if (compact) {
        return (
            <div className="rounded-lg border bg-white p-3 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{user.name}</span>
                    <span
                        className={`text-lg font-bold ${
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
        );
    }

    return (
        <Card className="overflow-hidden">
            <div
                className={`px-4 py-3 ${
                    isPositive
                        ? "bg-green-50 dark:bg-green-950/40"
                        : isNegative
                          ? "bg-red-50 dark:bg-red-950/40"
                          : "bg-zinc-50 dark:bg-zinc-800/50"
                }`}>
                <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                        {user.name}
                    </span>
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

            <CardContent className="grid grid-cols-2 gap-4 p-4">
                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Wins
                        </span>
                    </div>
                    <p
                        className={`text-lg font-semibold ${
                            totalOwed > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-zinc-400"
                        }`}>
                        {totalOwed || 0}
                    </p>
                    {owedFrom.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {owedFrom.map(({name, amount}) => (
                                <li
                                    key={name}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400">from</span>{" "}
                                    <span className="capitalize">{name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <div className="mb-1 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Owes
                        </span>
                    </div>
                    <p
                        className={`text-lg font-semibold ${
                            totalOwes > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-zinc-400"
                        }`}>
                        {totalOwes || 0}
                    </p>
                    {owesTo.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {owesTo.map(({name, amount}) => (
                                <li
                                    key={name}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400">to</span>{" "}
                                    <span className="capitalize">{name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
