import {describe, test, expect} from "vitest";
import {
    parseMixedGames,
    winsNeeded,
    majorityWinner,
    buildMixedNote,
    type MixedGameEntry,
} from "./mixed-game";

describe("mixed game utilities", () => {
    describe("parseMixedGames", () => {
        test("parses a valid series", () => {
            const json = '[{"gameId":3,"winnerId":1},{"gameId":7,"winnerId":null}]';
            expect(parseMixedGames(json)).toEqual([
                {gameId: 3, winnerId: 1},
                {gameId: 7, winnerId: null},
            ]);
        });

        test("returns empty array for invalid json", () => {
            expect(parseMixedGames("not json")).toEqual([]);
        });

        test("returns empty array for non-array json", () => {
            expect(parseMixedGames('{"gameId":3}')).toEqual([]);
        });
    });

    describe("winsNeeded", () => {
        test("majority of odd series", () => {
            expect(winsNeeded(3)).toBe(2);
            expect(winsNeeded(5)).toBe(3);
            expect(winsNeeded(7)).toBe(4);
        });
    });

    describe("majorityWinner", () => {
        test("returns null when undecided", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 1},
                {gameId: 2, winnerId: 2},
                {gameId: 3, winnerId: null},
            ];
            expect(majorityWinner(entries)).toBeNull();
        });

        test("returns winner on a sweep before all games played", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 1},
                {gameId: 2, winnerId: 1},
                {gameId: 3, winnerId: null},
            ];
            expect(majorityWinner(entries)).toBe(1);
        });

        test("returns tie-breaker winner", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 1},
                {gameId: 2, winnerId: 2},
                {gameId: 3, winnerId: 2},
            ];
            expect(majorityWinner(entries)).toBe(2);
        });

        test("returns null when three players split three games", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 1},
                {gameId: 2, winnerId: 2},
                {gameId: 3, winnerId: 3},
            ];
            expect(majorityWinner(entries)).toBeNull();
        });
    });

    describe("buildMixedNote", () => {
        const gameNames = new Map([
            [1, "Fifa"],
            [2, "Golf"],
            [3, "Poker"],
        ]);
        const userNames = new Map([
            [10, "Christian"],
            [20, "Jacob"],
        ]);

        test("formats decided games with winner names", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 10},
                {gameId: 2, winnerId: 20},
                {gameId: 3, winnerId: 10},
            ];
            expect(buildMixedNote(entries, gameNames, userNames)).toBe(
                "Fifa (Christian) | Golf (Jacob) | Poker (Christian)"
            );
        });

        test("lists undecided games bare by default", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: null},
                {gameId: 2, winnerId: null},
                {gameId: 3, winnerId: null},
            ];
            expect(buildMixedNote(entries, gameNames, userNames)).toBe(
                "Fifa | Golf | Poker"
            );
        });

        test("drops undecided games when onlyDecided is set", () => {
            const entries: MixedGameEntry[] = [
                {gameId: 1, winnerId: 10},
                {gameId: 2, winnerId: 10},
                {gameId: 3, winnerId: null},
            ];
            expect(buildMixedNote(entries, gameNames, userNames, true)).toBe(
                "Fifa (Christian) | Golf (Christian)"
            );
        });
    });
});
