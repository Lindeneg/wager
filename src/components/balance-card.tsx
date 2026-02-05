import {Card, CardContent} from "@/components/ui/card";
import {
    getBalanceTextClass,
    getBalanceBgClass,
    getAmountTextClass,
    formatBalance,
    type BalanceBreakdown,
} from "@/lib/balance";

interface BalanceCardProps {
    name: string;
    netTotal: number;
    totalOwed: number;
    totalOwes: number;
    owedFrom: BalanceBreakdown[];
    owesTo: BalanceBreakdown[];
    subtitle?: string;
    compact?: boolean;
}

export function BalanceCard({
    name,
    netTotal,
    totalOwed,
    totalOwes,
    owedFrom,
    owesTo,
    subtitle,
    compact,
}: BalanceCardProps) {
    if (compact) {
        return (
            <div className="rounded-lg border bg-white p-3 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{name}</span>
                    <span className={getBalanceTextClass(netTotal, "sm")}>
                        {formatBalance(netTotal)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Header with net total */}
            <div className={`px-4 py-3 ${getBalanceBgClass(netTotal)}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                            {name}
                        </span>
                        {subtitle && (
                            <p className="text-xs text-zinc-500">{subtitle}</p>
                        )}
                    </div>
                    <span className={getBalanceTextClass(netTotal)}>
                        {formatBalance(netTotal)}
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
                        className={`text-lg font-semibold ${getAmountTextClass(totalOwed, "wins")}`}>
                        {totalOwed || 0}
                    </p>
                    {owedFrom.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {owedFrom.map(({name, amount}) => (
                                <li
                                    key={name}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                        from
                                    </span>{" "}
                                    <span className="capitalize">{name}</span>
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
                        className={`text-lg font-semibold ${getAmountTextClass(totalOwes, "owes")}`}>
                        {totalOwes || 0}
                    </p>
                    {owesTo.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {owesTo.map(({name, amount}) => (
                                <li
                                    key={name}
                                    className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {amount}{" "}
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                        to
                                    </span>{" "}
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
