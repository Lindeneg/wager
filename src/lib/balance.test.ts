import {describe, test, expect} from "vitest";
import {
    getBalanceStatus,
    getBalanceTextClass,
    getBalanceBgClass,
    getAmountTextClass,
    formatBalance,
    calculateBalanceFromResultData,
} from "./balance";

describe("balance utilities", () => {
    describe("getBalanceStatus", () => {
        test("returns positive for positive amounts", () => {
            expect(getBalanceStatus(100)).toBe("positive");
            expect(getBalanceStatus(1)).toBe("positive");
        });

        test("returns negative for negative amounts", () => {
            expect(getBalanceStatus(-100)).toBe("negative");
            expect(getBalanceStatus(-1)).toBe("negative");
        });

        test("returns neutral for zero", () => {
            expect(getBalanceStatus(0)).toBe("neutral");
        });
    });

    describe("getBalanceTextClass", () => {
        test("returns green classes for positive amounts", () => {
            const result = getBalanceTextClass(100);
            expect(result).toContain("text-green-600");
            expect(result).toContain("dark:text-green-400");
        });

        test("returns red classes for negative amounts", () => {
            const result = getBalanceTextClass(-100);
            expect(result).toContain("text-red-600");
            expect(result).toContain("dark:text-red-400");
        });

        test("returns zinc classes for zero", () => {
            const result = getBalanceTextClass(0);
            expect(result).toContain("text-zinc-500");
        });

        test("includes size class based on parameter", () => {
            expect(getBalanceTextClass(100, "sm")).toContain("text-lg");
            expect(getBalanceTextClass(100, "lg")).toContain("text-2xl");
            expect(getBalanceTextClass(100, "xl")).toContain("text-4xl");
        });
    });

    describe("getBalanceBgClass", () => {
        test("returns green bg for positive amounts", () => {
            const result = getBalanceBgClass(100);
            expect(result).toContain("bg-green-50");
        });

        test("returns red bg for negative amounts", () => {
            const result = getBalanceBgClass(-100);
            expect(result).toContain("bg-red-50");
        });

        test("returns zinc bg for zero", () => {
            const result = getBalanceBgClass(0);
            expect(result).toContain("bg-zinc-50");
        });
    });

    describe("getAmountTextClass", () => {
        test("returns green for wins with positive amount", () => {
            const result = getAmountTextClass(100, "wins");
            expect(result).toContain("text-green-600");
        });

        test("returns red for owes with positive amount", () => {
            const result = getAmountTextClass(100, "owes");
            expect(result).toContain("text-red-600");
        });

        test("returns zinc for zero amounts", () => {
            expect(getAmountTextClass(0, "wins")).toBe("text-zinc-400");
            expect(getAmountTextClass(0, "owes")).toBe("text-zinc-400");
        });
    });

    describe("formatBalance", () => {
        test("adds + sign for positive amounts", () => {
            expect(formatBalance(100)).toBe("+100");
        });

        test("no sign for negative amounts", () => {
            expect(formatBalance(-100)).toBe("-100");
        });

        test("no sign for zero", () => {
            expect(formatBalance(0)).toBe("0");
        });

        test("respects showSign parameter", () => {
            expect(formatBalance(100, false)).toBe("100");
            expect(formatBalance(-100, false)).toBe("-100");
        });
    });

    describe("calculateBalanceFromResultData", () => {
        const userMap = new Map([
            ["1", "Alice"],
            ["2", "Bob"],
            ["3", "Charlie"],
        ]);

        test("calculates correct totals for simple case", () => {
            // Alice owes Bob 10, Charlie owes Alice 15
            const resultData = {
                "1": {"2": 10}, // Alice owes Bob 10
                "3": {"1": 15}, // Charlie owes Alice 15
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.totalOwes).toBe(10);
            expect(balance.totalOwed).toBe(15);
            expect(balance.netTotal).toBe(5); // 15 - 10
        });

        test("returns correct owesTo breakdown", () => {
            const resultData = {
                "1": {"2": 10, "3": 20}, // Alice owes Bob 10, Charlie 20
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.owesTo).toHaveLength(2);
            expect(balance.owesTo).toContainEqual({name: "Bob", amount: 10});
            expect(balance.owesTo).toContainEqual({name: "Charlie", amount: 20});
            expect(balance.totalOwes).toBe(30);
        });

        test("returns correct owedFrom breakdown", () => {
            const resultData = {
                "2": {"1": 25}, // Bob owes Alice 25
                "3": {"1": 15}, // Charlie owes Alice 15
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.owedFrom).toHaveLength(2);
            expect(balance.owedFrom).toContainEqual({name: "Bob", amount: 25});
            expect(balance.owedFrom).toContainEqual({name: "Charlie", amount: 15});
            expect(balance.totalOwed).toBe(40);
        });

        test("handles user with no data", () => {
            const resultData = {
                "2": {"3": 10}, // Bob owes Charlie 10, Alice not involved
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.totalOwes).toBe(0);
            expect(balance.totalOwed).toBe(0);
            expect(balance.netTotal).toBe(0);
            expect(balance.owesTo).toHaveLength(0);
            expect(balance.owedFrom).toHaveLength(0);
        });

        test("filters out zero amounts", () => {
            const resultData = {
                "1": {"2": 10, "3": 0}, // Alice owes Bob 10, Charlie 0
                "2": {"1": 0}, // Bob owes Alice 0
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.owesTo).toHaveLength(1);
            expect(balance.owedFrom).toHaveLength(0);
        });

        test("uses key as name if not in userMap", () => {
            const resultData = {
                "1": {"999": 10}, // Alice owes unknown user 10
            };

            const balance = calculateBalanceFromResultData(1, resultData, userMap);

            expect(balance.owesTo).toContainEqual({name: "999", amount: 10});
        });
    });
});
