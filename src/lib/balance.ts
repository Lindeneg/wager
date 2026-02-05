// Balance utility functions for consistent styling and calculations

export type BalanceStatus = "positive" | "negative" | "neutral";

export function getBalanceStatus(amount: number): BalanceStatus {
    if (amount > 0) return "positive";
    if (amount < 0) return "negative";
    return "neutral";
}

export function getBalanceTextClass(amount: number, size: "sm" | "lg" | "xl" = "lg"): string {
    const status = getBalanceStatus(amount);
    const sizeClass = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-4xl";

    const colorClass = {
        positive: "text-green-600 dark:text-green-400",
        negative: "text-red-600 dark:text-red-400",
        neutral: "text-zinc-500",
    }[status];

    return `${sizeClass} font-bold ${colorClass}`;
}

export function getBalanceBgClass(amount: number): string {
    const status = getBalanceStatus(amount);

    return {
        positive: "bg-green-50 dark:bg-green-950/40",
        negative: "bg-red-50 dark:bg-red-950/40",
        neutral: "bg-zinc-50 dark:bg-zinc-800/50",
    }[status];
}

export function getAmountTextClass(amount: number, type: "wins" | "owes"): string {
    if (amount <= 0) return "text-zinc-400";

    return type === "wins"
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";
}

export function formatBalance(amount: number, showSign = true): string {
    if (showSign && amount > 0) return `+${amount}`;
    return amount.toString();
}

export interface BalanceBreakdown {
    name: string;
    amount: number;
}

export interface CalculatedBalance {
    totalOwes: number;
    totalOwed: number;
    netTotal: number;
    owesTo: BalanceBreakdown[];
    owedFrom: BalanceBreakdown[];
}

// Calculate balance from raw result data
export function calculateBalanceFromResultData(
    userId: number,
    resultData: Record<string, Record<string, number>>,
    userMap: Map<string, string>
): CalculatedBalance {
    const userIdStr = userId.toString();
    const owesObj = resultData[userIdStr] || {};

    const totalOwes = Object.values(owesObj).reduce((acc, cur) => acc + cur, 0);

    const totalOwed = Object.entries(resultData).reduce((acc, [key, value]) => {
        if (key === userIdStr || !value[userIdStr]) return acc;
        return acc + value[userIdStr];
    }, 0);

    const owedFrom = Object.entries(resultData)
        .filter(([key, value]) => key !== userIdStr && value[userIdStr] > 0)
        .map(([key, value]) => ({
            name: userMap.get(key) || key,
            amount: value[userIdStr],
        }));

    const owesTo = Object.entries(owesObj)
        .filter(([, amount]) => amount > 0)
        .map(([key, amount]) => ({
            name: userMap.get(key) || key,
            amount,
        }));

    return {
        totalOwes,
        totalOwed,
        netTotal: totalOwed - totalOwes,
        owesTo,
        owedFrom,
    };
}
