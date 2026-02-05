import {describe, test, expect} from "vitest";
import {
    createResultMap,
    addWinner,
    resolveDebts,
    mergeResultMaps,
    type ResultMap,
} from "./result-map";

function assertCorrectValue(
    map: ResultMap,
    id: number,
    ...expected: [number, number][]
) {
    const target = map[id.toString()];
    expect(target).toBeDefined();

    for (const [oweToId, expectedVal] of expected) {
        const gotVal = target[oweToId.toString()];
        expect(gotVal).toBe(expectedVal);
    }
}

describe("createResultMap", () => {
    test("can create new result from user ids", () => {
        const got = createResultMap([1, 2, 3]);

        assertCorrectValue(got, 1, [2, 0], [3, 0]);
        assertCorrectValue(got, 2, [1, 0], [3, 0]);
        assertCorrectValue(got, 3, [1, 0], [2, 0]);
    });
});

describe("addWinner", () => {
    test("can add winner to result", () => {
        const got = createResultMap([1, 2, 3]);

        addWinner(got, 1, 100);

        // User 1 won, so users 2 and 3 each owe user 1: 100 / 2 = 50
        assertCorrectValue(got, 1, [2, 0], [3, 0]);
        assertCorrectValue(got, 2, [1, 50], [3, 0]);
        assertCorrectValue(got, 3, [1, 50], [2, 0]);

        addWinner(got, 3, 200);

        // User 3 won, so users 1 and 2 each owe user 3: 200 / 2 = 100
        assertCorrectValue(got, 1, [2, 0], [3, 100]);
        assertCorrectValue(got, 2, [1, 50], [3, 100]);
        assertCorrectValue(got, 3, [1, 50], [2, 0]);
    });

    test("handles two users correctly", () => {
        const got = createResultMap([1, 2]);

        addWinner(got, 1, 100);

        // User 1 won, user 2 owes user 1: 100 / 1 = 100
        assertCorrectValue(got, 1, [2, 0]);
        assertCorrectValue(got, 2, [1, 100]);
    });
});

describe("resolveDebts", () => {
    test("can resolve result", () => {
        const got = createResultMap([1, 2, 3]);

        addWinner(got, 1, 100);
        addWinner(got, 3, 200);
        resolveDebts(got);

        // After resolve:
        // User 1 owes user 3: 100, but user 3 owes user 1: 50
        // Net: user 1 owes user 3: 50
        assertCorrectValue(got, 1, [2, 0], [3, 50]);
        assertCorrectValue(got, 2, [1, 50], [3, 100]);
        assertCorrectValue(got, 3, [1, 0], [2, 0]);

        addWinner(got, 2, 300);
        addWinner(got, 1, 50);
        resolveDebts(got);

        assertCorrectValue(got, 1, [2, 75], [3, 25]);
        assertCorrectValue(got, 2, [1, 0], [3, 0]);
        assertCorrectValue(got, 3, [1, 0], [2, 50]);
    });

    test("fully cancels equal debts", () => {
        const got = createResultMap([1, 2]);

        addWinner(got, 1, 100);
        addWinner(got, 2, 100);
        resolveDebts(got);

        // Both owe each other 100, should cancel out
        assertCorrectValue(got, 1, [2, 0]);
        assertCorrectValue(got, 2, [1, 0]);
    });
});

describe("mergeResultMaps", () => {
    test("can merge ResultMaps", () => {
        const users = [1, 2, 3];

        const g1 = createResultMap(users);
        const g2 = createResultMap(users);
        const g3 = createResultMap(users);

        addWinner(g1, 1, 100);
        addWinner(g1, 3, 200);

        addWinner(g2, 1, 200);
        addWinner(g2, 2, 300);

        addWinner(g3, 3, 150);
        addWinner(g3, 2, 50);

        const got = mergeResultMaps(users, g1, g2, g3);

        assertCorrectValue(got, 1, [2, 175], [3, 175]);
        assertCorrectValue(got, 2, [1, 150], [3, 175]);
        assertCorrectValue(got, 3, [1, 150], [2, 175]);

        resolveDebts(got);

        assertCorrectValue(got, 1, [2, 25], [3, 25]);
        assertCorrectValue(got, 2, [1, 0], [3, 0]);
        assertCorrectValue(got, 3, [1, 0], [2, 0]);
    });

    test("merges empty maps correctly", () => {
        const users = [1, 2];
        const g1 = createResultMap(users);
        const g2 = createResultMap(users);

        const got = mergeResultMaps(users, g1, g2);

        assertCorrectValue(got, 1, [2, 0]);
        assertCorrectValue(got, 2, [1, 0]);
    });
});
