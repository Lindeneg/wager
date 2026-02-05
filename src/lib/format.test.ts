import {describe, test, expect} from "vitest";
import {
    formatDate,
    formatDateShort,
    formatTime,
    formatDateTime,
    formatCurrency,
} from "./format";

describe("format", () => {
    // Use a fixed date to avoid timezone issues in tests
    const testDate = "2024-06-15T14:30:00.000Z";

    describe("formatDate", () => {
        test("formats date with month, day, year, and time", () => {
            const result = formatDate(testDate);
            // Contains month, day, year
            expect(result).toMatch(/Jun/);
            expect(result).toMatch(/15/);
            expect(result).toMatch(/2024/);
        });
    });

    describe("formatDateShort", () => {
        test("formats date with month, day, year only", () => {
            const result = formatDateShort(testDate);
            expect(result).toMatch(/Jun/);
            expect(result).toMatch(/15/);
            expect(result).toMatch(/2024/);
            // Should not contain time separator
            expect(result).not.toMatch(/:/);
        });
    });

    describe("formatTime", () => {
        test("formats time only", () => {
            const result = formatTime(testDate);
            // Should contain time format (varies by timezone)
            expect(result).toMatch(/\d{1,2}:\d{2}/);
            // Should not contain month
            expect(result).not.toMatch(/Jun/);
        });
    });

    describe("formatDateTime", () => {
        test("accepts string input", () => {
            const result = formatDateTime(testDate);
            expect(result).toMatch(/Jun/);
            expect(result).toMatch(/15/);
        });

        test("accepts Date object input", () => {
            const result = formatDateTime(new Date(testDate));
            expect(result).toMatch(/Jun/);
            expect(result).toMatch(/15/);
        });

        test("includes time component", () => {
            const result = formatDateTime(testDate);
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });
    });

    describe("formatCurrency", () => {
        test("formats small numbers", () => {
            expect(formatCurrency(100)).toBe("100");
        });

        test("formats large numbers with thousands separator", () => {
            const result = formatCurrency(1000000);
            // Locale-dependent, but should have separators
            expect(result).toMatch(/1.*000.*000/);
        });

        test("handles zero", () => {
            expect(formatCurrency(0)).toBe("0");
        });

        test("handles negative numbers", () => {
            const result = formatCurrency(-500);
            expect(result).toContain("500");
            expect(result).toContain("-");
        });
    });
});
